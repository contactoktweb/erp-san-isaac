# Documento de Requerimientos Técnicos y Arquitectura Funcional (Fase 1)
**Proyecto:** ERP Personalizado de Manufactura, Inventarios y Facturación  
**Cliente:** Velas, Velones y Cirios San Isaac SAS  
**Desarrollador:** K&T CODE (Keyner Steban Trillos Useche — NIT: 1090384736-8)  
**Fecha de Cierre Fase 1:** 26 de octubre de 2026  
**Documentos Base Vinculados:**  
1. Cotización Maestra Actualizada ($10.000.000 COP, 20 de agosto de 2026).  
2. Anexo Funcional V2: Gestor de Pedidos Complejo y Empaque Progresivo (21 de octubre de 2026).  
3. Cuestionario de Aclaraciones Técnicas K&T CODE (24 de octubre de 2026).  
4. Respuestas Oficiales Vinculantes de San Isaac SAS (24 de octubre de 2026).  
5. Priorización Hoja de Costos Paramétrica y Simulador de Precios (13 de octubre de 2026).  

---

## 1. Objeto y Alcance Global del Sistema

El ERP personalizado centraliza e integra los procesos productivos, de inventario, comerciales, contables y tributarios de **Velas, Velones y Cirios San Isaac SAS**.

### Stack Tecnológico Aprobado
* **Frontend & Aplicación:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Radix UI.
* **Capa de Datos & Base de Datos:** PostgreSQL administrado en Supabase, Prisma ORM, Row Level Security (RLS) mandatorio en cada tabla.
* **Autenticación & Seguridad:** NextAuth v4 con control de perfiles RBAC y auditoría de cambios.
* **Despliegue & Hosting:** Vercel Pro + Supabase Pro.

---

## 2. Anexo Maestro V2: Gestor de Pedidos Complejo y Empaque Progresivo

### 2.1. Antecedentes y Contexto Operativo de Planta
En la fábrica de San Isaac SAS, los pedidos en temporada alta no poseen un número estático de días de alistamiento. La ventana de tiempo depende de la fecha en que se recibe el pedido y la fecha pactada de entrega:
$$\text{Plazo Total Pactado (Días)} = \text{FechaEntregaEstipulada} - \text{FechaRecepcion}$$
$$\text{Días Transcurridos} = \text{FechaActual (HOY)} - \text{FechaRecepcion}$$
$$\text{Días Restantes / Atraso} = \text{FechaEntregaEstipulada} - \text{FechaActual (HOY)}$$
*(Si el valor es negativo y el pedido no ha sido despachado, representa los días de mora en entrega).*

### 2.2. Máquina de Estados del Pedido (6 Estados Oficiales)
1. **`Registrado`:** Pedido ingresado en el sistema (manual por Ventas o automático desde la Tienda en Línea). No tiene cajas de empaque iniciadas.
2. **`En alistamiento`:** Pedido abierto para empaque simultáneo en planta; se comienzan a fabricar o apartar lotes.
3. **`Empacado parcialmente`:** Cuenta con al menos una caja de empaque armada pero su saldo pendiente es mayor a 0 unidades base.
4. **`Empacado completo`:** Saldo pendiente por empacar = 0 unidades base. Se estampa la `fecha_real_finalizacion` y se activa el botón de facturación.
5. **`Despachado/Entregado`:** Pedido cerrado logísticamente con transportadora y número de guía. Todas las cajas quedan bloqueadas contra edición.
6. **`Cancelado`:** Anulación formal del pedido. Revierte de inmediato las unidades empacadas al inventario disponible de producto terminado.

### 2.3. Reglas de Control de Empaque y Cajas Combinadas
* **Distinción Conceptual:**
  * **Presentación Caja:** Unidad comercial de venta del producto (ej. Caja x 24 unidades).
  * **Caja de Empaque:** Contenedor físico de cartón donde se arman y mezclan los productos para el despacho.
* **Control en Unidades Base:** Todas las operaciones internas de planta, saldos pendientes y kardex se computan en unidades base:
  * Fijas: `Unidad = 1`, `Docena = 12`.
  * Configurables por ficha técnica: `Paquete`, `Display`, `Presentación Caja`, `Bulto` (ej. 10, 20, 24, 50, 100 unidades base según el tamaño de la vela o velón).
* **Cajas Mixtas ("Caja X de N"):** Una misma caja de empaque permite guardar múltiples referencias distintas del pedido.
* **Bloqueo Estricto de Sobre-Empaque:** El sistema bloquea de manera taxativa cualquier intento de empacar más unidades de las pendientes en la línea del pedido.
* **Corrección de Unidades:** Si el operario rectifica una caja (ejemplo: corrige de 50 a 45 unidades por cubicaje físico), el sistema recalcula en tiempo real el acumulado y devuelve las 5 unidades al saldo pendiente.
* **Descuento de Stock y Lotes PEPS:**
  * El inventario disponible se descuenta **al momento de registrar la caja**.
  * El sistema sugiere automáticamente el lote más antiguo disponible mediante **PEPS (FIFO)**, permitiendo selección manual al operario.
  * Al corregir o eliminar cajas, el stock retorna en tiempo real al lote.

### 2.4. Semáforo Dinámico de Alertas
* 🟢 **En Plazo Normal:** Pedido con tiempo operativo suficiente frente a la fecha de entrega.
* 🟡 **Entrega Próxima (Preventivo):** Faltan $\le 3$ días calendario para la entrega y el avance de empaque es $< 100\%$.
* 🔴 **Entrega Hoy / Pedido Vencido:** Fecha actual $\ge$ Fecha de entrega estipulada y el empaque está incompleto. Alerta crítica en el tablero de planta.
* 🔵 **Empaque 100% Completado:** Saldo pendiente = 0. Habilita botón directo *"Convertir en Venta / Generar Factura"*.

### 2.5. Estrategia de Integración con Tienda en Línea
* **Fase 1 (Inmediata):** Estructura en base de datos lista con `origen_pedido: 'ERP' | 'TIENDA_WEB'` y `numero_orden_web` (ej. `WEB-1045`), permitiendo búsqueda unificada en el ERP.
* **Fase 2 (Conector Webhook):** Cotización e integración de sincronización en vivo de catálogo, existencias y pedidos web.

---

## 3. Hoja de Costos Paramétrica y Simulador de Precios

### 3.1. Fórmula del Costo Unitario de Producción
$$\text{Costo Unitario Total} = \text{Materia Prima e Insumos Directos} + \text{Mano de Obra Directa (MOD)} + \text{CIF / Servicios}$$

1. **Materia Prima e Insumos Directos:**
   $$\text{Costo Insumo} = (\text{Cantidad Consumida} \times \text{Costo Unitario Adquisición}) \times (1 + \%\text{Merma})$$
   Soporta unidades de medida: `g`, `kg`, `m` (pabilo), `ml` (esencias/colorantes), `unidades` (vasos, etiquetas, empaques).
2. **Mano de Obra Directa (MOD):**
   Tarifa/hora operario dedicada a las etapas de prensado, llenado y empaque.
3. **Costos Indirectos de Fabricación (CIF) y Energéticos:**
   Prorrateo de gas en calderas, energía eléctrica, arriendo de planta, supervisión y depreciación de moldes.

### 3.2. Simulador de Precios de Venta por Canal Comercial
Aplica la fórmula financiera de margen sobre precio de venta:
$$\text{Precio Sugerido (Sin IVA)} = \frac{\text{Costo Unitario Total}}{1 - \text{Margen Deseado (\%)}} $$

* **Venta Detal / Al por Menor:** Margen base parametrizable del **60%**.
* **Venta Mayoreo / Mayorista:** Margen base parametrizable del **35%**.
* **Distribuidor / Gran Volumen:** Margen base parametrizable del **20%**.

---

## 4. Matriz de Roles y Permisos (RBAC)

| Rol / Cargo | Permisos y Capacidades en el Sistema |
| :--- | :--- |
| **1. Administrador / Gerencia** | Control total sobre pedidos (ERP y Tienda Web), reprogramación de fechas, cancelaciones, reversión de cajas, auditoría de cambios, despacho y facturación. |
| **2. Ventas / Comercial** | Crear pedidos manuales, gestionar pedidos web, reprogramar fechas con motivo obligatorio, monitorear avance de alistamiento en vivo y generar Factura Electrónica. |
| **3. Jefe de Producción / Planta** | Visualizar tablero multipedido con semáforos, coordinar alistamiento simultáneo, crear/editar cajas de empaque e imprimir Packing List y Rótulos. |
| **4. Encargado de Alistamiento** | Visualizar pedidos en alistamiento, crear Cajas de Empaque, registrar unidades empacadas por lote PEPS, corregir errores de conteo e imprimir rótulos de caja. |

---

## 5. Cronograma de Fases Actualizado

| Fase | Fechas | Entregables y Compromisos |
| :--- | :--- | :--- |
| **1. Análisis y estructura técnica** | **19 al 28 oct** | **Cierre formal con documento de requerimientos y V2 como anexo maestro.** |
| **2. Administración funcional** | 26 oct al 1 nov | Base de datos real de usuarios, roles RBAC, permisos granulares y auditoría. |
| **2B. Prototipo del gestor** | 29 oct al 3 nov | Prototipo interactivo con datos de demostración para validación de planta. |
| **3. Inventarios y producción** | 2 al 8 nov | Catálogo maestro, unidades base, lotes PEPS, hoja de costos paramétrica y recetas. |
| **4. Compras, ventas, DIAN** | 9 al 15 nov | Compras, facturación electrónica, cartera, PUC y documentos DIAN. |
| **4B. Gestor de pedidos real** | 16 al 29 nov | Gestor de pedidos conectado a inventario en vivo, descuento y empaque real. |
| **5. Cierre de etapa** | 30 nov al 6 dic | Pruebas integradas, balances y revisión final con gerencia. |
| **6. Despliegue y capacitación** | Hasta 2 ene 2027 | Puesta en producción en servidor final, manuales y soporte de garantía. |

---

## 6. ANEXO I: Especificación Funcional Completa del Gestor de Pedidos (Requerimiento V2)

### 6.1. Escenario Real de Planta y Alistamiento Dinámico
Para ilustrar con exactitud la lógica que debe soportar la base de datos en PostgreSQL/Supabase y la interfaz en Next.js, se toma el siguiente escenario real de planta:
* **Cliente:** Distribuidora Religiosa (Cliente XXX).
* **Fecha de Recepción:** 21 de octubre de 2026.
* **Fecha de Entrega Estipulada:** 26 de octubre de 2026.
* **Plazo Total Calculado:** $26/\text{Oct} - 21/\text{Oct} = 5\text{ días disponibles}$.
* **Ítems Solicitados:**
  1. *Producto 1:* 56 unidades.
  2. *Producto 2:* 60 unidades.
  3. *Producto 56:* 182 unidades.
  4. *Producto 30:* 12 docenas (equivalente a 144 unidades base).

### 6.2. Cronología de Empaque y Corrección de Cajas
1. **21/Oct (Día 1):** Operario crea la **Caja #1** y guarda 20 uds de Producto 1 y 30 uds de Producto 2. Crea la **Caja #2** y guarda inicialmente 50 uds de Producto 56.
2. **22/Oct (Día 2):** Registra en la **Caja #3 (mixta)** 36 uds de Producto 1 (completando las 56 pedidas), 30 uds de Producto 2 (completando las 60 pedidas) y 4 docenas de Producto 30 (48 uds base).
3. **23/Oct (Corrección en Caja #2):** El operario detecta que en la Caja #2 solo cabían 45 unidades de Producto 56 en el cartón físico. Edita la Caja #2 cambiando de 50 a 45 unidades. El sistema recalcula de inmediato el acumulado a 45 unidades y devuelve 5 unidades al saldo pendiente (137 uds por empacar).
4. **24 al 26/Oct:** Se continúa empacando en nuevas cajas hasta que el saldo pendiente llegue a 0 unidades antes de la fecha límite.

---

## 7. ANEXO II: Matriz Integral de Preguntas Técnicas y Respuestas Oficiales Vinculantes

Las siguientes definiciones fueron acordadas de manera vinculante entre K&T CODE y San Isaac SAS:

1. **Documentos y Referencias:**
   * Se confirma la plena equivalencia entre numerales: Numeral 10 (Ventas/Pedidos) = 3.5; Numeral 4 (Inventarios) = 3.2; Numeral 6 (Producción) = 3.3.
   * La integración con la Tienda Web se ejecuta en dos fases: Fase 1 (tablas y campos duales listos en ERP) y Fase 2 (conector webhook para sincronización automática).
2. **Reglas del Pedido:**
   * La Fecha de Recepción es automática por defecto, editable por Ventas o Administrador para pedidos retroactivos.
   * La Fecha de Entrega Estipulada solo puede ser modificada por Gerencia o Ventas con justificación obligatoria en campo `motivo_reprogramacion`.
   * Agregar o aumentar ítems está permitido; si el pedido estaba al 100%, regresa a *Empacado parcialmente*.
   * Disminuir cantidad pedida nunca podrá ser inferior a lo ya empacado en cajas físicas.
   * Eliminar un producto solo se permite si tiene 0 unidades empacadas.
   * Consecutivo maestro anualizado: `PED-2026-0001` (reinicio anual), con campo visible para `numero_orden_web` (ej. `WEB-1045`).
   * Cancelación: Anula el empaque y devuelve el stock al inventario disponible de inmediato.
3. **Productos y Presentaciones:**
   * Catálogo maestro único en ERP con sincronización hacia la web y switch de visibilidad.
   * Presentaciones estándar: Unidad, Paquete, Docena, Display, Presentación Caja y Bulto.
   * Control interno estricto en **unidades base** para todas las operaciones de inventario.
   * Distinción plena entre *Presentación Caja* (comercial) y *Caja de Empaque* (contenedor logístico).
   * Campo de texto libre `detalle_personalizacion` en cada línea de pedido.
4. **Empaque y Cajas:**
   * Numeración interna por pedido: Caja #1, Caja #2, rotuladas como "Caja X de N".
   * Datos de caja: número, fecha, operario empacador, ítems/unidades por lote PEPS, peso kg opcional y observaciones.
   * Sobre-empaque: **Bloqueo estricto por sistema**.
   * Bloqueo total de cajas una vez el pedido pasa a estado *Despachado/Entregado*.
5. **Inventarios y Lotes:**
   * Descuento de stock en el momento exacto en que se arma y guarda la caja.
   * Asignación automática de lote por **PEPS (FIFO)**, con selector manual disponible.
   * Reversión de stock en tiempo real al corregir o eliminar cajas.
   * Bodega de alistamiento: *Bodega Principal de Producto Terminado (Planta)* por defecto.
6. **Alertas y Pantallas:**
   * Semáforos visibles para Administrador, Jefe de Planta, Alistamiento y Ventas.
   * Al alcanzar el 100% de empaque: botón directo *"Convertir en Venta / Generar Factura"* habilitado.
   * UI con resumen de saldos por ítem y panel/acordeón desplegable por Caja de Empaque.
   * Generación de PDF para Packing List desglosado por caja y Rótulos individuales de caja.

---

## 8. ANEXO III: Fórmulas de la Hoja de Costos y Simulador de Precios

* **Costo Directo por Insumo:**
  $$\text{Costo Directo} = (\text{Cantidad Consumida} \times \text{Costo Unitario}) \times (1 + \text{Factor Merma})$$
* **Mano de Obra Directa (MOD):**
  $$\text{MOD} = \sum (\text{Horas Operario} \times \text{Tarifa Horaria})$$
* **Costos Indirectos de Fabricación (CIF):**
  $$\text{CIF} = \text{Tarifa Energéticos (Gas/Luz)} + \text{Cuota Prorrateada (Arriendo/Depreciación)}$$
* **Precio de Venta Sugerido (Sin IVA):**
  $$\text{Precio Sugerido} = \frac{\text{Costo Unitario Total}}{1 - \text{Margen Deseado}}$$

---

## 9. Cierre Contractual y Aceptación de la Fase 1

Con la entrega de este documento maestro y la actualización de la plataforma en su estructura técnica de base de datos, tipos de datos, catálogo de módulos y tablero preliminar interactivo del Gestor de Pedidos Complejo:

* **Estado de la Fase 1:** **100% COMPLETADA Y CERRADA.**
* **Transición a Fase 2:** Habilitada para el desarrollo de la **Administración Funcional (Usuarios, Roles RBAC y Auditoría)** correspondiente a la semana del 26 de octubre al 1 de noviembre de 2026.

_____________________________________________  
**K&T CODE**  
Keyner Steban Trillos Useche  
Desarrollo y Arquitectura de Software  

_____________________________________________  
**Velas, Velones y Cirios San Isaac SAS**  
Dirección Administrativa y Operativa  
