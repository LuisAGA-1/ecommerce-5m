# API de Reportes Analíticos

Endpoints de solo lectura para el panel de administración del e-commerce 5M.
Calculan métricas de rendimiento comercial a partir de las entidades **Usuario**, **Producto** y **Pedido**.

- **Base URL (local):** `http://localhost:3000/api/reportes`
- **Autenticación:** `Authorization: Bearer <token JWT>`, o bien `X-API-Key: <REPORTES_API_KEY>` para integraciones como n8n (ver `docs/N8N.md`)
- **Rol requerido:** `admin`, en todos los endpoints.
- **Formato:** JSON. Montos en MXN y fechas `AAAA-MM-DD`.

## Arquitectura

| Capa | Archivo | Rol |
|---|---|---|
| Interfaces | `backend/src/interfaces/routes/analyticsRoutes.js` | Rutas `/api/reportes/*` + `verificarToken` + `autorizarRoles("admin")` |
| Interfaces | `backend/src/interfaces/controllers/analyticsController.js` | Traduce query params; errores de filtro → 400 |
| Aplicación | `backend/src/application/analytics/AnalyticsService.js` | **Caso de uso / puerto de entrada**: tickets, porcentajes, variaciones, ranking |
| Dominio | `backend/src/domain/analytics/FiltroReporte.js` | Objeto de valor: valida rango, granularidad y base de cálculo |
| Dominio | `backend/src/domain/analytics/EstadosPedido.js` | Mapea estados de BD → Pendiente / Pagado / Enviado / Cancelado |
| Dominio | `backend/src/domain/ports/AnalyticsRepository.js` | **Puerto de salida** de consultas analíticas (solo lectura) |
| Infraestructura | `backend/src/infrastructure/repositories/AnalyticsRepositoryAdapter.js` | **Adaptador PostgreSQL**: `SUM`, `COUNT`, `COUNT DISTINCT`, `GROUP BY`, `date_trunc`, `generate_series` |

Las agregaciones se resuelven en PostgreSQL. Node.js recibe solo filas ya agregadas (como máximo una por período, producto o estado), nunca el historial completo de pedidos.

## Parámetros comunes (query string)

| Parámetro | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `desde` | `AAAA-MM-DD` | hoy − 29 días | Inicio del rango (inclusive) |
| `hasta` | `AAAA-MM-DD` | hoy | Fin del rango (inclusive) |
| `granularidad` | `dia` \| `semana` \| `mes` | automática | Agrupación de la serie de ingresos. Si se omite: ≤31 días → `dia`, ≤120 → `semana`, mayor → `mes` |
| `base` | `pagados` \| `todos` | `pagados` | Qué pedidos cuentan como venta: `pagados` = ACEPTADO/ENVIADO; `todos` = también PENDIENTE (nunca cancelados) |
| `limite` | entero 1–50 | `5` | Tamaño del ranking (`/dashboard`, `/productos-top`) |
| `ordenarPor` | `unidades` \| `ingresos` | `unidades` | Criterio del ranking |

El rango máximo por consulta es de 731 días. Las métricas comparativas usan el **período anterior** de igual duración, que termina el día previo a `desde`.

## Endpoints

### `GET /api/reportes/dashboard`
Devuelve todas las métricas del panel en una sola petición. Es el endpoint que usa el frontend.

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/reportes/dashboard?desde=2026-10-02&hasta=2026-10-08&limite=5"
```

Respuesta `200` (ejemplo real, recortado):

```json
{
  "rango": {
    "desde": "2026-10-02",
    "hasta": "2026-10-08",
    "dias": 7,
    "granularidad": "dia",
    "base": "pagados",
    "estadosConsiderados": [
      "ACEPTADO",
      "PAGADO",
      "ENVIADO",
      "ENTREGADO"
    ]
  },
  "resumen": {
    "ingresos": 118226,
    "pedidos": 10,
    "clientesCompradores": 5,
    "unidadesVendidas": 48,
    "ticketPromedioPedido": 11822.6,
    "ticketPromedioCliente": 23645.2,
    "clientesRegistrados": 7
  },
  "periodoAnterior": {
    "desde": "2026-09-25",
    "hasta": "2026-10-01",
    "ingresos": 262023,
    "pedidos": 11,
    "clientesCompradores": 5,
    "unidadesVendidas": 50,
    "ticketPromedioPedido": 23820.27,
    "ticketPromedioCliente": 52404.6
  },
  "variacion": {
    "ingresos": -54.9,
    "pedidos": -9.1,
    "ticketPromedioPedido": -50.4,
    "ticketPromedioCliente": -54.9
  },
  "ingresos": {
    "total": 118226,
    "promedioPorPeriodo": 16889.43,
    "mejorPeriodo": {
      "periodo": "2026-10-05",
      "ingresos": 65722,
      "pedidos": 2
    },
    "serie": [
      {
        "periodo": "2026-10-02",
        "ingresos": 27634,
        "pedidos": 3
      },
      {
        "periodo": "2026-10-03",
        "ingresos": 2588,
        "pedidos": 1
      },
      {
        "periodo": "2026-10-04",
        "ingresos": 0,
        "pedidos": 0
      },
      {
        "...": "un objeto por día del rango"
      }
    ]
  },
  "productosTop": {
    "limite": 5,
    "ordenarPor": "unidades",
    "productos": [
      {
        "posicion": 1,
        "productoId": 6,
        "nombre": "Audífonos Sony WH-CH520",
        "unidades": 17,
        "ingresos": 19533,
        "pedidos": 8,
        "precioPromedio": 1149,
        "participacionUnidades": 35.4,
        "participacionIngresos": 16.5
      },
      {
        "posicion": 2,
        "productoId": 7,
        "nombre": "SSD Kingston 1TB",
        "unidades": 9,
        "ingresos": 11610,
        "pedidos": 4,
        "precioPromedio": 1290,
        "participacionUnidades": 18.8,
        "participacionIngresos": 9.8
      }
    ]
  },
  "estados": {
    "total": 27,
    "estados": [
      {
        "clave": "PENDIENTE",
        "etiqueta": "Pendiente",
        "cantidad": 12,
        "monto": 189832,
        "porcentaje": 44.4
      },
      {
        "clave": "PAGADO",
        "etiqueta": "Pagado",
        "cantidad": 7,
        "monto": 99391,
        "porcentaje": 25.9
      },
      {
        "clave": "ENVIADO",
        "etiqueta": "Enviado",
        "cantidad": 3,
        "monto": 18835,
        "porcentaje": 11.1
      },
      {
        "clave": "CANCELADO",
        "etiqueta": "Cancelado",
        "cantidad": 5,
        "monto": 63345,
        "porcentaje": 18.5
      }
    ]
  },
  "generadoEn": "2026-10-08T17:12:28.438Z"
}
```

### `GET /api/reportes/resumen`
Ingresos, pedidos, clientes compradores, unidades, **ticket promedio por pedido** (ingresos ÷ pedidos) y **ticket promedio por cliente** (ingresos ÷ clientes distintos que compraron). Incluye `periodoAnterior` y `variacion` en %. Si el período anterior fue 0 y el actual no, la variación es `null`.

```bash
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/reportes/resumen?desde=2026-09-01&hasta=2026-09-30"
```

### `GET /api/reportes/ingresos`
Ingresos totales agrupados por día, semana o mes. Los períodos sin ventas se devuelven con 0 (`generate_series`), así que la serie es continua.

```bash
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/reportes/ingresos?desde=2026-07-01&hasta=2026-09-30&granularidad=semana"
```

```json
{
  "rango": {
    "desde": "2026-07-01",
    "hasta": "2026-09-30",
    "dias": 92,
    "granularidad": "semana",
    "base": "pagados"
  },
  "total": 1859646,
  "promedioPorPeriodo": 132831.86,
  "mejorPeriodo": {
    "periodo": "2026-09-14",
    "ingresos": 252382,
    "pedidos": 13
  },
  "serie": [
    {
      "periodo": "2026-06-29",
      "ingresos": 66585,
      "pedidos": 3
    },
    {
      "periodo": "2026-07-06",
      "ingresos": 113160,
      "pedidos": 10
    }
  ]
}
```

`periodo` es la fecha de inicio del día, de la semana (lunes) o del mes.

### `GET /api/reportes/productos-top`
Ranking de productos con mayor rotación: unidades vendidas, monto recaudado (`SUM(cantidad × precio_unitario)`), número de pedidos, precio promedio y participación porcentual en unidades e ingresos del período.

```bash
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/reportes/productos-top?desde=2026-09-01&hasta=2026-09-30&limite=2&ordenarPor=ingresos"
```

```json
{
  "limite": 2,
  "ordenarPor": "ingresos",
  "productos": [
    {
      "posicion": 1,
      "productoId": 1,
      "nombre": "Laptop Lenovo IdeaPad",
      "unidades": 41,
      "ingresos": 676500,
      "pedidos": 20,
      "precioPromedio": 16500,
      "participacionUnidades": 20.4,
      "participacionIngresos": 76.4
    },
    {
      "posicion": 2,
      "productoId": 6,
      "nombre": "Audífonos Sony WH-CH520",
      "unidades": 70,
      "ingresos": 80430,
      "pedidos": 34,
      "precioPromedio": 1149,
      "participacionUnidades": 34.8,
      "participacionIngresos": 9.1
    }
  ]
}
```

### `GET /api/reportes/estados-pedidos`
Conteo, monto y porcentaje de pedidos por estado. Considera **todos** los pedidos del rango; no le aplica el parámetro `base`.

| Categoría | Estados en BD |
|---|---|
| Pendiente | `PENDIENTE` |
| Pagado | `ACEPTADO`, `PAGADO` |
| Enviado | `ENVIADO`, `ENTREGADO` |
| Cancelado | `RECHAZADO`, `CANCELADO` |

```json
{
  "total": 65,
  "estados": [
    {
      "clave": "PENDIENTE",
      "etiqueta": "Pendiente",
      "cantidad": 7,
      "monto": 69002,
      "porcentaje": 10.8
    },
    {
      "clave": "PAGADO",
      "etiqueta": "Pagado",
      "cantidad": 38,
      "monto": 539663,
      "porcentaje": 58.5
    },
    {
      "clave": "ENVIADO",
      "etiqueta": "Enviado",
      "cantidad": 14,
      "monto": 346098,
      "porcentaje": 21.5
    },
    {
      "clave": "CANCELADO",
      "etiqueta": "Cancelado",
      "cantidad": 6,
      "monto": 84162,
      "porcentaje": 9.2
    }
  ]
}
```

## Errores

| Código | Cuándo | Ejemplo de `mensaje` |
|---|---|---|
| `400` | Filtro inválido | `El parámetro "desde" no es una fecha válida`, `"desde" no puede ser posterior a "hasta"`, `La granularidad debe ser "dia", "semana" o "mes"`, `"limite" debe ser un entero entre 1 y 50` |
| `401` | Sin token, token inválido o API key incorrecta | (middleware de autenticación) |
| `403` | El usuario no es `admin` | (middleware de roles) |
| `500` | Error de base de datos | `Error al generar el reporte` |

## Rendimiento

- Todas las métricas usan agregaciones SQL. El adaptador nunca recorre pedidos en memoria.
- El rango se filtra como `fecha >= desde AND fecha < hasta + 1 día`, lo que permite usar índices.
- Índices recomendados: `docs/sql/indices-analitica.sql` (`pedidos(fecha, estado)`, `detalle_pedido(pedido_id)`, `usuarios(rol)`).
- `/dashboard` ejecuta las consultas en paralelo (`Promise.all`) y reutiliza el resumen del período para el ranking.

## Datos de demostración

```bash
npm run seed:analitica               # 6 clientes demo + ~220 pedidos en 120 días
npm run seed:analitica -- --limpiar  # borra solo los datos demo (*@analitica.test)
```
