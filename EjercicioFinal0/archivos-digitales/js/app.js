
const TABLA = "luis_chavez";                   
const NOMBRE_ALUMNO = "Luis Enrique Chavez Dominguez"; 

const BUCKET = "documentos";
let usuario = null;
let documentos = [];
let carpetaActual = "Todos";
let editandoId = null;
let documentoEditando = null;

async function iniciar() {
  try {
    const { data } = await cliente.auth.getSession();
    if (!data.session) {
      window.location.href = "index.html";
      return;
    }
    usuario = data.session.user;
    document.getElementById("nombreAlumno").textContent = NOMBRE_ALUMNO;
    document.getElementById("correoUsuario").textContent = usuario.email;
    await cargarDocumentos();
  } catch (error) {
    mostrarMensaje("Error: " + error.message);
  }
}

async function cerrarSesion() {
  try {
    await cliente.auth.signOut();
    window.location.href = "index.html";
  } catch (error) {
    mostrarMensaje("Error: " + error.message);
  }
}

function mostrarMensaje(texto) {
  document.getElementById("mensaje").textContent = texto;
}

async function cargarDocumentos() {
  try {
    const { data, error } = await cliente
      .from(TABLA)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    documentos = data;
    mostrarDocumentos();
  } catch (error) {
    mostrarMensaje("Error al cargar: " + error.message);
  }
}

async function guardar() {
  const titulo = document.getElementById("titulo").value;
  const tipo = document.getElementById("tipo").value;
  const carpeta = document.getElementById("carpeta").value;
  const archivo = document.getElementById("archivo").files[0];

  if (titulo === "") {
    mostrarMensaje("Escribe un título");
    return;
  }
  if (!editandoId && !archivo) {
    mostrarMensaje("Selecciona un archivo");
    return;
  }

  try {
    let archivoUrl = null;
    let archivoPath = null;

    if (archivo) {
      const nombreLimpio = archivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      archivoPath = usuario.id + "/" + Date.now() + "_" + nombreLimpio;

      const { error: errorSubir } = await cliente.storage
        .from(BUCKET)
        .upload(archivoPath, archivo);
      if (errorSubir) throw errorSubir;

      const { data } = cliente.storage.from(BUCKET).getPublicUrl(archivoPath);
      archivoUrl = data.publicUrl;
    }

    if (editandoId) {
      // EDITAR
      const cambios = { titulo: titulo, tipo: tipo, carpeta: carpeta };
      if (archivo) {
        cambios.archivo_url = archivoUrl;
        cambios.archivo_path = archivoPath;
        // borramos el archivo anterior
        if (documentoEditando.archivo_path) {
          await cliente.storage.from(BUCKET).remove([documentoEditando.archivo_path]);
        }
      }
      const { error } = await cliente.from(TABLA).update(cambios).eq("id", editandoId);
      if (error) throw error;
      mostrarMensaje("Documento actualizado");
    } else {
      // NUEVO
      const { error } = await cliente.from(TABLA).insert({
        titulo: titulo,
        tipo: tipo,
        carpeta: carpeta,
        archivo_url: archivoUrl,
        archivo_path: archivoPath
      });
      if (error) throw error;
      mostrarMensaje("Documento guardado");
    }

    limpiarFormulario();
    await cargarDocumentos();
  } catch (error) {
    mostrarMensaje("Error: " + error.message);
  }
}

// Pone los datos del documento en el formulario para editarlo
function editar(id) {
  const doc = documentos.find(function (d) { return d.id === id; });
  editandoId = id;
  documentoEditando = doc;
  document.getElementById("titulo").value = doc.titulo;
  document.getElementById("tipo").value = doc.tipo;
  document.getElementById("carpeta").value = doc.carpeta;
  document.getElementById("tituloFormulario").textContent = "Editar documento";
  window.scrollTo(0, 0);
}

function cancelarEdicion() {
  limpiarFormulario();
  mostrarMensaje("");
}

function limpiarFormulario() {
  editandoId = null;
  documentoEditando = null;
  document.getElementById("titulo").value = "";
  document.getElementById("archivo").value = "";
  document.getElementById("tituloFormulario").textContent = "Subir documento";
}

async function eliminar(id) {
  if (!confirm("¿Seguro que quieres eliminar este documento?")) return;

  try {
    const doc = documentos.find(function (d) { return d.id === id; });

    // borrar archivo del Storage
    if (doc.archivo_path) {
      await cliente.storage.from(BUCKET).remove([doc.archivo_path]);
    }
    // borrar registro de la tabla
    const { error } = await cliente.from(TABLA).delete().eq("id", id);
    if (error) throw error;

    mostrarMensaje("Documento eliminado");
    await cargarDocumentos();
  } catch (error) {
    mostrarMensaje("Error: " + error.message);
  }
}

// ---------- CARPETAS Y BUSCADOR ----------
function cambiarCarpeta(nombre) {
  carpetaActual = nombre;
  document.getElementById("carpetaActual").textContent = nombre;
  mostrarDocumentos();
}

function mostrarDocumentos() {
  const texto = document.getElementById("buscador").value.toLowerCase();
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  const filtrados = documentos.filter(function (d) {
    const enCarpeta = carpetaActual === "Todos" || d.carpeta === carpetaActual;
    const coincide = d.titulo.toLowerCase().includes(texto);
    return enCarpeta && coincide;
  });

  if (filtrados.length === 0) {
    lista.innerHTML = "<tr><td colspan='5'>No hay documentos</td></tr>";
    return;
  }

  filtrados.forEach(function (d) {
    const fila = document.createElement("tr");
    fila.innerHTML =
      "<td></td><td></td><td></td>" +
      "<td><a href='" + d.archivo_url + "' target='_blank'>Ver</a></td>" +
      "<td><button onclick='editar(" + d.id + ")'>Editar</button> " +
      "<button onclick='eliminar(" + d.id + ")'>Eliminar</button></td>";
    // textContent para que no se meta código raro en el título
    fila.children[0].textContent = d.titulo;
    fila.children[1].textContent = d.tipo;
    fila.children[2].textContent = d.carpeta;
    lista.appendChild(fila);
  });
}

iniciar();
