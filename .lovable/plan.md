

## Plan: Sistema de Receptores de Pago

### Resumen
Convertir el campo libre "A quién se paga" en un sistema de receptores (Payees) gestionado como base de datos local, con selector + creación inline en el formulario, y una página dedicada por receptor.

### Cambios principales

**1. Nuevo tipo `Payee` en `src/types/payment.ts`**
- Interfaz `Payee` con `id`, `name`, `createdAt`
- Agregar `payeeId` al tipo `Payment` (reemplaza `payTo` como string libre)
- Mantener `payTo` por compatibilidad pero derivarlo del payee

**2. Nuevo hook `src/hooks/usePayees.ts`**
- CRUD de receptores en localStorage (key separada `payees-app-data`)
- Funciones: `addPayee`, `deletePayee`, `getPayeeById`
- Migración automática: al cargar, si un payment tiene `payTo` pero no `payeeId`, crear el payee correspondiente y asignar el ID

**3. Modificar `PaymentForm.tsx`**
- Reemplazar el `Input` de "A quién se paga" por un `Select` (combobox) con la lista de receptores
- Agregar botón "+" al lado del selector que abre un mini-diálogo inline para crear un nuevo receptor (solo nombre) sin salir del formulario
- Al crear receptor inline, seleccionarlo automáticamente

**4. Nueva página `src/pages/PayeePage.tsx`**
- Ruta: `/payee/:id`
- Muestra nombre del receptor, resumen (total pagado, total pendiente, cantidad de pagos)
- Lista de pagos filtrados por ese receptor, con filtros de estado
- Reutiliza `PaymentCard`, `StatusBadge`

**5. Actualizar rutas en `App.tsx`**
- Agregar ruta `/payee/:id` → `PayeePage`

**6. Links al receptor desde `PaymentCard.tsx`**
- El nombre del receptor será un link clickeable que navega a `/payee/:id`

### Detalles técnicos
- Almacenamiento: localStorage con key `payees-app-data`
- Migración: al inicializar `usePayees`, escanear payments existentes y crear payees a partir de strings `payTo` únicos
- El `Payment` type tendrá `payeeId: string` como campo principal; `payTo` se mantiene como fallback de lectura

