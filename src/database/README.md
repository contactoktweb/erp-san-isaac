# Arquitectura de Datos y Capa de Acceso (src/database/)

Esta carpeta constituye el **único punto de acceso a datos de negocio** en el ERP de **Velas, Velones y Cirios San Isaac SAS**.

---

## 🏛️ Principio de Aislamiento

> **Regla de Oro:** Ninguna página, componente o servicio fuera de `src/database/` debe importar archivos JSON ni ejecutar consultas de base de datos directamente. Toda la interfaz consume exclusivamente las funciones asíncronas expuestas en `src/database/index.ts`.

Cuando en la siguiente fase se implementen las tablas de negocio en PostgreSQL / Supabase a través de Prisma, **las pantallas y componentes no cambiarán en absoluto**. Únicamente se sustituirá la lógica interna de los repositorios en esta carpeta.

---

## 📁 Estructura Interna

```text
src/database/
├── mocks/                  # Archivos JSON con 6 a 12 registros verosímiles de la fábrica
│   ├── accounting.json     # Catálogo PUC y saldos
│   ├── administration.json # Usuarios y perfiles ficticios (distintos del seed real)
│   ├── corporate.json      # Accionistas y participaciones SAS
│   ├── dian.json           # Facturas electrónicas y estados DIAN
│   ├── inventory.json      # Parafinas, pabilos, esencias, velones y cirios
│   ├── payroll.json        # Trabajadores de planta y contratos laborales
│   ├── production.json     # Órdenes de fabricación y fórmulas
│   ├── purchasing.json     # Órdenes de compra y proveedores
│   ├── reports.json        # Catálogo de reportes disponibles
│   └── sales.json          # Pedidos comerciales y cuentas por cobrar
├── repositories/
│   ├── mock/               # Implementación actual que lee y valida los JSON
│   ├── prisma/             # Punto de extensión futuro que usará Prisma Client
│   └── types.ts            # Interfaces TypeScript que ambos repositorios implementan
├── schemas/
│   └── index.ts            # Esquemas Zod y tipos inferidos para todas las entidades
├── index.ts                # Fachada pública que selecciona la fuente según DATA_SOURCE
└── README.md               # Esta documentación técnica
```

---

## 🔄 Guía Paso a Paso: Cómo Reemplazar los Mocks por Prisma (Fase 2)

Para conectar el sistema a la base de datos real de producción sin tocar la interfaz, sigue estos pasos:

### 1. Definir los modelos en `prisma/schema.prisma`
Crea los modelos relacionales en `prisma/schema.prisma` respetando los campos y tipos ya estandarizados en `src/database/schemas/index.ts` (por ejemplo, identificadores de texto `cuid()`, fechas ISO, importes enteros en pesos COP y relaciones por ID).

### 2. Generar y aplicar las migraciones con RLS
Recuerda la regla obligatoria de seguridad en Supabase:
```bash
npx prisma migrate dev --name create_business_tables --create-only
```
Agrega al final del archivo `migration.sql` generado la activación de Row Level Security para cada nueva tabla:
```sql
ALTER TABLE "InventoryItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductionOrder" ENABLE ROW LEVEL SECURITY;
-- etc.
```
Aplica la migración:
```bash
npx prisma migrate dev
```

### 3. Implementar las clases en `src/database/repositories/prisma/`
Sustituye la excepción temporal `throwNotImplemented()` por consultas reales utilizando el singleton de Prisma (`import { prisma } from '@/lib/prisma'`):

```typescript
// Ejemplo para Inventario:
export class PrismaInventoryRepository implements IInventoryRepository {
  async getItems(): Promise<InventoryItem[]> {
    const records = await prisma.inventoryItem.findMany({
      orderBy: { productionDate: 'desc' },
    })
    return z.array(inventoryItemSchema).parse(records)
  }
}
```

### 4. Cambiar la variable de entorno
En tus archivos `.env` y `.env.local` (y en las variables de entorno de Vercel):
```env
DATA_SOURCE="prisma"
```

Al reiniciar el servidor, `src/database/index.ts` instanciará automáticamente los repositorios de Prisma sin que sea necesario modificar una sola línea de código en las páginas ni en los componentes visuales.
