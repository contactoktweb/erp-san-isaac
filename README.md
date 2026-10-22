# ERP San Isaac — Velas, Velones y Cirios San Isaac SAS

Sistema de gestión empresarial interno (ERP) de uso exclusivo para **Velas, Velones y Cirios San Isaac SAS**.

---

## 📋 Requisitos del Entorno

- **Node.js**: v18.18.0 o superior (recomendado v20.x LTS).
- **npm**: Gestor de paquetes obligatorio (incluido con Node.js).
- **Base de Datos**: Proyecto en **Supabase** (PostgreSQL).

---

## 🛠️ Configuración Inicial y Supabase

### 1. Crear el Proyecto en Supabase
1. Ingresa a [https://supabase.com](https://supabase.com) e inicia sesión.
2. Haz clic en **"New Project"**.
3. Selecciona la organización, asigna el nombre del proyecto (ej: `erp-san-isaac`), genera una contraseña segura para la base de datos y guárdala.
4. Elige la región geográfica más cercana a tus usuarios.

### 2. Obtener las Cadenas de Conexión
1. En el panel de Supabase, ve a **Project Settings** (ícono de engranaje) → **Database**.
2. Desplázate hasta la sección **Connection parameters / Connection string**:
   - **DATABASE_URL (Transaction Pooler - Puerto 6543):**
     - Selecciona la pestaña **URI** y modo **Transaction** (puerto `6543`).
     - Copia la cadena y reemplaza `[YOUR-PASSWORD]` por la contraseña de la base de datos.
     - **Importante:** Añade al final de la cadena los parámetros: `?pgbouncer=true&connection_limit=1`.
     - *Ejemplo:*  
       `postgresql://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`
   - **DIRECT_URL (Direct Connection - Puerto 5432):**
     - Selecciona el modo **Session** o conexión directa (puerto `5432`). Prisma CLI requiere esta cadena para ejecutar migraciones y comandos DDL.
     - *Nota:* Si tu conexión a internet o proveedor no soporta IPv6 y la conexión directa falla, utiliza la cadena del **Session pooler** (puerto `5432` del pooler).
     - *Ejemplo:*  
       `postgresql://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
3. Ve a **Project Settings** → **API** para obtener:
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `anon` `public` API key.
   - `SUPABASE_SERVICE_ROLE_KEY`: `service_role` `secret` key (**NUNCA exponer en cliente**).

---

## 🔐 Configurar Variables de Entorno

Crea tu archivo `.env.local` a partir de `.env.example`:

```bash
cp .env.example .env.local
```

Abre `.env.local` y completa los valores:

```env
# Conexión Supabase
DATABASE_URL="postgresql://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# NextAuth v4
# Genera un secreto seguro en terminal: openssl rand -base64 32
NEXTAUTH_SECRET="tu-clave-secreta-de-al-menos-32-caracteres"
NEXTAUTH_URL="http://localhost:3000"

# Supabase API
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"

# Credenciales para el Seed del Administrador
SEED_ADMIN_EMAIL="admin@velassanisaac.com"
SEED_ADMIN_PASSWORD="TuContraseñaSegura2026!"
```

---

## 🚀 Comandos de Instalación y Puesta en Marcha

Ejecuta los siguientes comandos en tu terminal en la raíz del proyecto:

### Paso 1: Instalar Dependencias
```bash
npm install
```

### Paso 2: Procedimiento de Migración Inicial con RLS (Mandatorio)
Para asegurar que las tablas en Supabase nazcan con **Row Level Security (RLS)** activado desde el primer momento:

1. Genera el borrador de la migración inicial:
   ```bash
   npx prisma migrate dev --name init --create-only
   ```
2. Abre el archivo generado en `prisma/migrations/<timestamp>_init/migration.sql`.
3. Pega al final del archivo el contenido de `prisma/enable_rls.sql`:
   ```sql
   ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
   ```
4. Aplica la migración a la base de datos:
   ```bash
   npx prisma migrate dev
   ```

### Paso 3: Ejecutar el Seed
Crea el rol `ADMIN` y el usuario administrador inicial (es idempotente y repetible gracias a `upsert`):
```bash
npm run prisma:seed
```

### Paso 4: Iniciar el Servidor de Desarrollo
```bash
npm run dev
```

Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

---

## 🛡️ Regla Obligatoria de RLS para Futuras Tablas

En Supabase, PostgREST expone automáticamente un API sobre las tablas públicas. Para garantizar la seguridad del ERP:

> **Regla Mandatoria:** Toda nueva tabla que se cree en `prisma/schema.prisma` debe tener activado Row Level Security (RLS) en su migración.

**Flujo para cada nueva migración:**
1. Modifica `prisma/schema.prisma`.
2. Genera el script con `--create-only`:
   ```bash
   npx prisma migrate dev --name nombre_de_migracion --create-only
   ```
3. Edita el archivo `migration.sql` recién generado y añade al final:
   ```sql
   ALTER TABLE "NombreDeLaNuevaTabla" ENABLE ROW LEVEL SECURITY;
   ```
4. Aplica la migración:
   ```bash
   npx prisma migrate dev
   ```

---

## 🌐 Despliegue en Vercel

1. **Configurar el Repositorio en Vercel:**
   - Importa el repositorio Git en [Vercel](https://vercel.com).
   - En **Build & Development Settings**, el framework detectado será Next.js.

2. **Variables de Entorno en Vercel:**
   En los ajustes del proyecto (**Settings** → **Environment Variables**), añade:
   - `DATABASE_URL`: Cadena transaction pooler (puerto 6543 con `?pgbouncer=true&connection_limit=1`).
   - `DIRECT_URL`: Cadena session pooler o directa (puerto 5432).
   - `NEXTAUTH_SECRET`: Mismo secreto o uno nuevo generado con `openssl rand -base64 32`.
   - `NEXTAUTH_URL`: La URL pública definitiva en producción (ej: `https://erp.velassanisaac.com` o `https://tu-proyecto.vercel.app`).
   - `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon key.
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key.

3. **Aplicar Migraciones en Producción:**
   Para ejecutar las migraciones pendientes sin modificar el historial, usa:
   ```bash
   npm run prisma:deploy
   ```
   (Puedes incluir `npx prisma migrate deploy` en el Build Command de Vercel como `npx prisma migrate deploy && next build`, o ejecutarlo vía Vercel CLI / CI/CD).

---

## 🩺 Verificación de Salud (Health Check)

Puedes verificar el estado de la conexión a la base de datos realizando una petición a:
```http
GET /api/health
```
- Respuesta exitosa: `HTTP 200` `{ "status": "ok" }`
- En caso de falla en base de datos: `HTTP 503` `{ "status": "error" }`
