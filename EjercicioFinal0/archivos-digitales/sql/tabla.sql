
create table luis_chavez (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  titulo text not null,
  tipo text,
  carpeta text,
  archivo_url text,
  archivo_path text,
  created_at timestamptz default now()
);

alter table luis_chavez enable row level security;

create policy "usuario ve sus documentos" on luis_chavez
  for select using (auth.uid() = user_id);
create policy "usuario crea sus documentos" on luis_chavez
  for insert with check (auth.uid() = user_id);
create policy "usuario edita sus documentos" on luis_chavez
  for update using (auth.uid() = user_id);
create policy "usuario borra sus documentos" on luis_chavez
  for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', true)
on conflict do nothing;

create policy "subir archivos" on storage.objects
  for insert to authenticated with check (bucket_id = 'documentos');
create policy "borrar archivos" on storage.objects
  for delete to authenticated using (bucket_id = 'documentos');
