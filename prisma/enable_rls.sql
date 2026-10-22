-- ==============================================================================
-- Activación obligatoria de Row Level Security (RLS) para tablas de Supabase
-- ==============================================================================
-- En Supabase es mandatorio habilitar RLS en todas las tablas para evitar acceso
-- no autorizado a través de la API pública expuesta por PostgREST.
-- Como el ERP opera con Prisma desde el backend usando conexiones directas de Postgres
-- (rol postgres o service_role), RLS no bloqueará las operaciones del servidor,
-- pero protegerá los datos ante cualquier exposición accidental de la API de Supabase.

ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
