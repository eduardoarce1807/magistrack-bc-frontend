# Bandeja de Pedidos Histórico - API Documentation

## Endpoint Sugerido
`POST /api/pedidos/historico/buscar`

## JSON de Entrada (Request)

```json
{
  "fechaInicio": "2025-09-01",
  "fechaFin": "2025-09-30",
  "clientesIds": [],
  "canalesVentaIds": [],
  "metodosPagoIds": [],
  "estadoPedidoIds": []
}
```

### Descripción de campos de entrada:
- `fechaInicio` (string, requerido): Fecha de inicio en formato YYYY-MM-DD
- `fechaFin` (string, requerido): Fecha de fin en formato YYYY-MM-DD
- `clientesIds` (array, opcional): Array de IDs de clientes. Si está vacío, aplica para todos los clientes
- `canalesVentaIds` (array, opcional): Array de IDs de canales de venta. Si está vacío, aplica para todos los canales
- `metodosPagoIds` (array, opcional): Array de IDs de métodos de pago. Si está vacío, aplica para todos los métodos
- `estadoPedidoIds` (array, opcional): Array de IDs de estados de pedido. Si está vacío, aplica para todos los estados

**Nota importante**: Todos los campos deben enviarse siempre, incluso si están vacíos. Las fechas son obligatorias y siempre deben tener valores. Los arrays vacíos significan "todos" para ese filtro.

---

## JSON de Respuesta (Response) - EXACTO PARA EL P-TABLE

```json
{
  "success": true,
  "message": "Datos obtenidos correctamente",
  "data": {
    "content": [
      {
        "idPedido": "PED20250001",
        "fechaPedido": "2024-01-15",
        "cliente": "Juan Pérez García",
        "monto": 125.50,
        "estado": "Entregado",
        "fechaEstimadaEntrega": "2024-01-20",
        "metodoPago": "Tarjeta de Crédito",
        "clienteDetalle": {
          "idCliente": 1,
          "nombres": "Juan",
          "apellidos": "Pérez García",
          "numeroDocumento": "12345678",
          "correo": "juan.perez@email.com",
          "telefono": "987654321"
        },
        "estadoDetalle": {
          "idEstadoPedido": 10,
          "descripcion": "Entregado",
          "color": "#28a745"
        },
        "metodoPagoDetalle": {
          "idTipoPago": 2,
          "descripcion": "Tarjeta de Crédito",
          "icono": "pi pi-credit-card"
        },
        "canalVenta": {
          "idCanalVenta": 1,
          "descripcion": "Tienda Online"
        },
        "metodoEntrega": {
          "idMetodoEntrega": 1,
          "descripcion": "Delivery"
        },
        "direccion": {
          "direccion": "Av. Principal 123",
          "distrito": { "nombre": "San Isidro" },
          "provincia": { "nombre": "Lima" },
          "departamento": { "nombre": "Lima" }
        },
        "tipoPedido": "PRODUCTO",
        "montoTotal": 125.50,
        "observaciones": "Entregado sin observaciones"
      },
      {
        "idPedido": "PED20250002",
        "fechaPedido": "2024-01-18",
        "cliente": "María López Silva",
        "monto": 89.99,
        "estado": "Entregado",
        "fechaEstimadaEntrega": "2024-01-23",
        "metodoPago": "Efectivo",
        "clienteDetalle": {
          "idCliente": 3,
          "nombres": "María",
          "apellidos": "López Silva",
          "numeroDocumento": "87654321",
          "correo": "maria.lopez@email.com",
          "telefono": "912345678"
        },
        "estadoDetalle": {
          "idEstadoPedido": 10,
          "descripcion": "Entregado",
          "color": "#28a745"
        },
        "metodoPagoDetalle": {
          "idTipoPago": 1,
          "descripcion": "Efectivo",
          "icono": "pi pi-money-bill"
        },
        "canalVenta": {
          "idCanalVenta": 2,
          "descripcion": "Tienda Física"
        },
        "metodoEntrega": {
          "idMetodoEntrega": 2,
          "descripcion": "Recojo en Tienda"
        },
        "direccion": null,
        "tipoPedido": "PREPARADO_MAGISTRAL",
        "montoTotal": 89.99,
        "observaciones": null
      },
      {
        "idPedido": "PED20250003",
        "fechaPedido": "2024-01-22",
        "cliente": "Carlos Mendoza Ruiz",
        "monto": 234.75,
        "estado": "Cancelado",
        "fechaEstimadaEntrega": "2024-01-27",
        "metodoPago": "Transferencia Bancaria",
        "clienteDetalle": {
          "idCliente": 5,
          "nombres": "Carlos",
          "apellidos": "Mendoza Ruiz",
          "numeroDocumento": "11223344",
          "correo": "carlos.mendoza@email.com",
          "telefono": "976543210"
        },
        "estadoDetalle": {
          "idEstadoPedido": 11,
          "descripcion": "Cancelado",
          "color": "#dc3545"
        },
        "metodoPagoDetalle": {
          "idTipoPago": 4,
          "descripcion": "Transferencia Bancaria",
          "icono": "pi pi-building"
        },
        "canalVenta": {
          "idCanalVenta": 1,
          "descripcion": "Tienda Online"
        },
        "metodoEntrega": {
          "idMetodoEntrega": 1,
          "descripcion": "Delivery"
        },
        "direccion": {
          "direccion": "Jr. Los Rosales 456",
          "distrito": { "nombre": "Miraflores" },
          "provincia": { "nombre": "Lima" },
          "departamento": { "nombre": "Lima" }
        },
        "tipoPedido": "PRODUCTO",
        "montoTotal": 234.75,
        "observaciones": "Cliente canceló por demora en la entrega"
      },
      {
        "idPedido": "PED20250004",
        "fechaPedido": "2024-02-01",
        "cliente": "Ana García Torres",
        "monto": 156.80,
        "estado": "Entregado",
        "fechaEstimadaEntrega": "2024-02-06",
        "metodoPago": "Yape",
        "clienteDetalle": {
          "idCliente": 8,
          "nombres": "Ana",
          "apellidos": "García Torres",
          "numeroDocumento": "55667788",
          "correo": "ana.garcia@email.com",
          "telefono": "965432198"
        },
        "estadoDetalle": {
          "idEstadoPedido": 10,
          "descripcion": "Entregado",
          "color": "#28a745"
        },
        "metodoPagoDetalle": {
          "idTipoPago": 5,
          "descripcion": "Yape",
          "icono": "pi pi-mobile"
        },
        "canalVenta": {
          "idCanalVenta": 3,
          "descripcion": "WhatsApp"
        },
        "metodoEntrega": {
          "idMetodoEntrega": 1,
          "descripcion": "Delivery"
        },
        "direccion": {
          "direccion": "Calle Las Flores 789",
          "distrito": { "nombre": "San Borja" },
          "provincia": { "nombre": "Lima" },
          "departamento": { "nombre": "Lima" }
        },
        "tipoPedido": "PRODUCTO",
        "montoTotal": 156.80,
        "observaciones": "Entrega perfecta"
      },
      {
        "idPedido": "PED20250005",
        "fechaPedido": "2024-02-05",
        "cliente": "Roberto Silva Vargas",
        "monto": 98.25,
        "estado": "Entregado",
        "fechaEstimadaEntrega": "2024-02-10",
        "metodoPago": "Plin",
        "clienteDetalle": {
          "idCliente": 12,
          "nombres": "Roberto",
          "apellidos": "Silva Vargas",
          "numeroDocumento": "99887766",
          "correo": "roberto.silva@email.com",
          "telefono": "954321987"
        },
        "estadoDetalle": {
          "idEstadoPedido": 10,
          "descripcion": "Entregado",
          "color": "#28a745"
        },
        "metodoPagoDetalle": {
          "idTipoPago": 6,
          "descripcion": "Plin",
          "icono": "pi pi-mobile"
        },
        "canalVenta": {
          "idCanalVenta": 2,
          "descripcion": "Tienda Física"
        },
        "metodoEntrega": {
          "idMetodoEntrega": 2,
          "descripcion": "Recojo en Tienda"
        },
        "direccion": null,
        "tipoPedido": "PREPARADO_MAGISTRAL",
        "montoTotal": 98.25,
        "observaciones": "Cliente recogió en horario"
      }
    ],
    "pagination": {
      "totalElements": 450,
      "totalPages": 45,
      "currentPage": 1,
      "pageSize": 10,
      "hasNext": true,
      "hasPrevious": false,
      "isFirst": true,
      "isLast": false
    },
    "filtrosAplicados": {
      "fechaInicio": "2024-01-01",
      "fechaFin": "2024-12-31",
      "clientesIds": [1, 3, 5, 8, 12],
      "canalesVentaIds": [1, 2, 3],
      "metodosPagoIds": [1, 2, 4, 5, 6]
    }
  },
  "timestamp": "2024-09-17T15:30:00.000Z"
}
```

---

## 🔑 CAMPOS CLAVE PARA EL P-TABLE

### Campos principales (mostrados en la tabla):
- **`idPedido`** (string): ID del pedido - Columna 1
- **`fechaPedido`** (string): Fecha en formato YYYY-MM-DD - Columna 2
- **`cliente`** (string): Nombre completo concatenado - Columna 3
- **`monto`** (number): Monto total - Columna 4
- **`estado`** (string): Estado para mostrar - Columna 5
- **`fechaEstimadaEntrega`** (string): FEE en formato YYYY-MM-DD - Columna 6
- **`metodoPago`** (string): Método de pago para mostrar - Columna 7

### Objetos de detalle (para funcionalidades adicionales):
- **`clienteDetalle`**: Info completa del cliente
- **`estadoDetalle`**: Incluye color para el badge
- **`metodoPagoDetalle`**: Incluye ícono
- **`canalVenta`**: Canal utilizado
- **`metodoEntrega`**: Método de entrega
- **`direccion`**: Dirección completa (para PDF)
- **`tipoPedido`**: PRODUCTO o PREPARADO_MAGISTRAL
- **`montoTotal`**: Monto final
- **`observaciones`**: Comentarios

---

## 🎨 MAPEO DE COLORES PARA BADGES DE ESTADO

```json
{
  "coloresPorEstado": {
    "Entregado": "#28a745",
    "Cancelado": "#dc3545",
    "Devuelto": "#fd7e14",
    "Rechazado": "#6c757d",
    "Pendiente": "#ffc107",
    "Procesando": "#17a2b8"
  }
}
```

---

## 📊 MÉTODOS DE PAGO CON ÍCONOS

```json
{
  "metodosPago": [
    { "id": 1, "descripcion": "Efectivo", "icono": "pi pi-money-bill" },
    { "id": 2, "descripcion": "Tarjeta de Crédito", "icono": "pi pi-credit-card" },
    { "id": 3, "descripcion": "Tarjeta de Débito", "icono": "pi pi-credit-card" },
    { "id": 4, "descripcion": "Transferencia Bancaria", "icono": "pi pi-building" },
    { "id": 5, "descripcion": "Yape", "icono": "pi pi-mobile" },
    { "id": 6, "descripcion": "Plin", "icono": "pi pi-mobile" }
  ]
}
```

---

## 🔧 NOTAS TÉCNICAS IMPORTANTES

### Para el Frontend Angular:
1. **Campo `cliente`**: Es la concatenación de `nombres + ' ' + apellidos` del backend
2. **Fechas**: Vienen en formato string YYYY-MM-DD, el pipe `date` las formatea automáticamente
3. **Badge de estado**: Usa `estadoDetalle.color` para el color del badge
4. **Botones de acción**: Usan `idPedido` para las navegaciones
5. **Impresión PDF**: Usa todos los campos de detalle para generar el documento

### Para el Backend:
1. **Paginación**: Implementar con `page` y `size`
2. **Filtros opcionales**: Si un filtro no viene, no aplicarlo
3. **Performance**: Crear índices en fechas, estados y cliente_id
4. **Concatenación**: El campo `cliente` debe ser `nombres + ' ' + apellidos`
5. **Colores**: Incluir colores hexadecimales para los estados

### Estructura de respuesta requerida:
```typescript
interface PedidoHistorico {
  idPedido: string;
  fechaPedido: string; // YYYY-MM-DD
  cliente: string; // nombres + apellidos
  monto: number;
  estado: string;
  fechaEstimadaEntrega: string; // YYYY-MM-DD
  metodoPago: string;
  // ... objetos de detalle
}
```

---

## ✅ VALIDACIÓN DE DATOS

El backend debe asegurar que:
1. Todas las fechas estén en formato YYYY-MM-DD
2. Los montos sean números decimales con 2 decimales
3. El campo `cliente` nunca sea null/undefined
4. Los objetos de detalle estén completos para el PDF
5. La paginación sea consistente

Esta estructura garantiza que el p-table funcione perfectamente con ordenamiento, búsqueda, filtros y todas las funcionalidades implementadas.