// Si el usuario ya inició sesión antes, lo mandamos directo a la app
async function verificarSesion() {
  try {
    const { data } = await cliente.auth.getSession();
    if (data.session) {
      window.location.href = "app.html";
    }
  } catch (error) {
    console.log(error);
  }
}
verificarSesion();

function mostrarMensaje(texto) {
  document.getElementById("mensaje").textContent = texto;
}

// Iniciar sesión
async function iniciarSesion() {
  const correo = document.getElementById("correo").value;
  const clave = document.getElementById("clave").value;

  if (correo === "" || clave === "") {
    mostrarMensaje("Llena todos los campos");
    return;
  }

  try {
    const { error } = await cliente.auth.signInWithPassword({
      email: correo,
      password: clave
    });
    if (error) throw error;
    window.location.href = "app.html";
  } catch (error) {
    mostrarMensaje("Error: " + error.message);
  }
}

// Crear cuenta nueva
async function registrarse() {
  const correo = document.getElementById("correo").value;
  const clave = document.getElementById("clave").value;

  if (correo === "" || clave === "") {
    mostrarMensaje("Llena todos los campos");
    return;
  }

  try {
    const { error } = await cliente.auth.signUp({
      email: correo,
      password: clave
    });
    if (error) throw error;
    mostrarMensaje("Cuenta creada. Ahora inicia sesión.");
  } catch (error) {
    mostrarMensaje("Error: " + error.message);
  }
}
