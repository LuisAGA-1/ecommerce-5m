# Proyecto Ecommerce 5M

Sistema de comercio electrónico desarrollado como proyecto académico para la materia de Ingeniería en Desarrollo y Tecnologías de Software.

El proyecto está compuesto por un backend desarrollado con Node.js y Express, un frontend desarrollado con React y Vite, y una base de datos PostgreSQL.

## 1. Tecnologías utilizadas

### Backend

* Node.js
* Express
* PostgreSQL
* JWT para autenticación
* bcryptjs para el manejo seguro de contraseñas
* CORS
* dotenv

### Frontend

* React
* Vite
* JavaScript
* CSS

### Entorno de desarrollo

* Windows 11
* WSL2
* Ubuntu 24.04
* PostgreSQL 16
* Node.js
* npm

## 2. Arquitectura del proyecto

El backend utiliza una arquitectura basada en el enfoque de **Arquitectura Hexagonal (Ports and Adapters)**.

La estructura principal se divide en:

* **Domain:** contiene las entidades y puertos del dominio.
* **Application:** contiene los casos de uso y servicios de la aplicación.
* **Infrastructure:** contiene las implementaciones relacionadas con la base de datos y repositorios.
* **Interfaces:** contiene controladores, rutas, middleware y el servidor.

Flujo general:

```text
Usuario
   │
   ▼
Frontend React + Vite
   │
   │ HTTP / JSON
   ▼
Backend Node.js + Express
   │
   ├── Interfaces
   │   ├── Routes
   │   ├── Controllers
   │   └── Middleware
   │
   ├── Application
   │   ├── Auth
   │   ├── Users
   │   ├── Products
   │   └── Orders
   │
   ├── Domain
   │   ├── Entities
   │   └── Ports
   │
   └── Infrastructure
       ├── Database
       └── Repositories
   │
   ▼
PostgreSQL
```

## 3. Estructura del repositorio

```text
ecommerce-5M/
├── backend/
│   └── src/
│       ├── application/
│       │   ├── auth/
│       │   ├── orders/
│       │   ├── products/
│       │   └── users/
│       ├── domain/
│       │   ├── entities/
│       │   └── ports/
│       ├── infrastructure/
│       │   ├── database/
│       │   └── repositories/
│       └── interfaces/
│           ├── controllers/
│           ├── middleware/
│           ├── routes/
│           └── server.js
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── modules/
│       │   ├── auth/
│       │   ├── client/
│       │   ├── dashboard/
│       │   ├── orders/
│       │   ├── products/
│       │   └── provider/
│       ├── services/
│       ├── App.jsx
│       ├── App.css
│       └── main.jsx
│
├── .gitignore
├── package.json
├── package-lock.json
└── server.js
```

## 4. Autenticación y roles

El sistema utiliza autenticación mediante **JSON Web Tokens (JWT)**.

Las rutas protegidas requieren el siguiente encabezado:

```text
Authorization: Bearer <TOKEN>
```

El sistema contempla diferentes roles:

* **Administrador:** gestión de usuarios, productos y pedidos.
* **Proveedor:** gestión y publicación de sus productos.
* **Cliente:** consulta de productos y gestión de sus pedidos.

Las contraseñas se almacenan utilizando hash mediante `bcryptjs`.

## 5. Especificación de endpoints

### Autenticación

| Método | Endpoint      | Descripción                        | Acceso  |
| ------ | ------------- | ---------------------------------- | ------- |
| POST   | `/auth/login` | Iniciar sesión y obtener token JWT | Público |

### Usuarios

| Método | Endpoint        | Descripción            | Acceso        |
| ------ | --------------- | ---------------------- | ------------- |
| POST   | `/usuarios`     | Crear usuario          | Administrador |
| GET    | `/usuarios`     | Obtener usuarios       | Administrador |
| GET    | `/usuarios/:id` | Obtener usuario por ID | Administrador |
| PUT    | `/usuarios/:id` | Actualizar usuario     | Administrador |
| DELETE | `/usuarios/:id` | Eliminar usuario       | Administrador |

### Productos

| Método | Endpoint                     | Descripción                     | Acceso                    |
| ------ | ---------------------------- | ------------------------------- | ------------------------- |
| POST   | `/productos`                 | Crear producto                  | Administrador / Proveedor |
| GET    | `/productos`                 | Obtener productos               | Administrador             |
| GET    | `/productos/:id`             | Obtener producto por ID         | Público                   |
| PUT    | `/productos/:id`             | Actualizar producto             | Administrador / Proveedor |
| DELETE | `/productos/:id`             | Eliminar producto               | Administrador / Proveedor |
| GET    | `/productos/publicados`      | Obtener productos publicados    | Público                   |
| GET    | `/productos/mis-productos`   | Obtener productos del proveedor | Proveedor                 |
| PATCH  | `/productos/:id/publicar`    | Publicar producto               | Proveedor                 |
| PATCH  | `/productos/:id/despublicar` | Despublicar producto            | Proveedor                 |

### Pedidos

| Método | Endpoint                | Descripción                 | Acceso        |
| ------ | ----------------------- | --------------------------- | ------------- |
| POST   | `/pedidos`              | Crear pedido                | Cliente       |
| GET    | `/pedidos`              | Obtener pedidos             | Administrador |
| GET    | `/pedidos/:id`          | Obtener pedido por ID       | Administrador |
| PUT    | `/pedidos/:id`          | Actualizar pedido           | Administrador |
| DELETE | `/pedidos/:id`          | Eliminar pedido             | Administrador |
| GET    | `/pedidos/mis-pedidos`  | Obtener pedidos del cliente | Cliente       |
| PATCH  | `/pedidos/:id/aceptar`  | Aceptar pedido              | Administrador |
| PATCH  | `/pedidos/:id/rechazar` | Rechazar pedido             | Administrador |

## 6. Ejecución en WSL

### Requisitos

Se requiere:

* Windows 11
* WSL2
* Ubuntu 24.04
* Node.js
* npm
* PostgreSQL

### Iniciar PostgreSQL

Desde Ubuntu:

```bash
sudo systemctl start postgresql
```

Para comprobar el estado:

```bash
sudo systemctl status postgresql
```

### Ejecutar el backend

Abrir una terminal de Ubuntu:

```bash
cd ~/webapp/backend
npm install
node src/interfaces/server.js
```

El backend estará disponible en:

```text
http://localhost:3000
```

### Ejecutar el frontend

Abrir una segunda terminal de Ubuntu:

```bash
cd ~/webapp/frontend
npm install
npm run dev
```

El frontend estará disponible en:

```text
http://localhost:5173/
```

### Ubicación del proyecto en Windows

El proyecto puede accederse desde el explorador de archivos mediante:

```text
\\wsl.localhost\Ubuntu-24.04\home\luis_angel\webapp
```

## 7. Variables de entorno

Las variables de configuración se almacenan mediante archivos `.env`.

Por seguridad, estos archivos **no se incluyen en el repositorio de GitHub**.

El archivo `.gitignore` también evita subir:

```text
.env
node_modules/
dist/
```

Las credenciales, contraseñas y secretos utilizados por la aplicación deben mantenerse únicamente en el entorno local o en el entorno de despliegue correspondiente.

## 8. Despliegue en AWS

El despliegue en AWS queda **pendiente de la activación y disponibilidad del laboratorio correspondiente**.

Como parte del despliegue se contempla:

* Configuración del backend Node.js.
* Configuración del frontend React/Vite.
* Configuración de PostgreSQL.
* Configuración de variables de entorno.
* Configuración de red y acceso.
* Pruebas de funcionamiento de la aplicación.

## 9. Repositorio GitHub

El código fuente y la documentación del proyecto se encuentran disponibles en:

**GitHub:**
https://github.com/LuisAGA-1/ecommerce-5m

El repositorio contiene el código del backend, frontend y los archivos necesarios para instalar y ejecutar el proyecto.

## 10. Estado de los entregables

| Entregable                  | Estado                                  |
| --------------------------- | --------------------------------------- |
| Diagrama arquitectónico     | Terminado                               |
| Especificación de endpoints | Terminado                               |
| Estructura del repositorio  | Terminado                               |
| Guía de despliegue en WSL   | Terminado                               |
| Código fuente               | Terminado                               |
| Repositorio GitHub          | Terminado                               |
| Documentación               | Terminado                               |
| Despliegue AWS              | Pendiente de activación del laboratorio |

## 11. Conclusión

El proyecto implementa un sistema de comercio electrónico utilizando Node.js, Express, React, Vite y PostgreSQL. El backend está organizado mediante una arquitectura basada en puertos y adaptadores, separando el dominio, los casos de uso, la infraestructura y las interfaces.

La aplicación cuenta con operaciones CRUD para usuarios, productos y pedidos, autenticación mediante JWT y control de acceso basado en roles. El proyecto puede ejecutarse en un entorno WSL2 con Ubuntu y cuenta con su código fuente disponible en GitHub para revisión.

El despliegue en AWS queda pendiente hasta contar con la activación del laboratorio correspondiente.

## 12. Notificaciones por correo (Puerto de salida + Adaptador)

Al generar un pedido, el sistema lo registra con estado **Pendiente de pago** (en BD: `PENDIENTE`) y dispara automáticamente:

1. Al **cliente**: comprobante con el desglose de la compra, total y las instrucciones/datos bancarios para pagar por transferencia o depósito.
2. Al **administrador**: aviso de nuevo pedido con datos del cliente y del pedido.

No se procesan pagos con tarjeta en línea.

### Diseño hexagonal

```text
OrderController ──> OrderService (aplicación) ──> EmailServicePort (dominio/puerto)
                                                          ▲
                                                          │ implementa
                                         NodemailerAdapter (infraestructura)
                                                          │
                                                 Nodemailer ─> Ethereal / Mailtrap / SMTP
```

| Archivo | Capa | Responsabilidad |
| ------- | ---- | --------------- |
| `backend/src/domain/ports/EmailServicePort.js` | Dominio | Contrato: `enviarComprobantePedido`, `notificarNuevoPedidoAdmin` |
| `backend/src/infrastructure/email/NodemailerAdapter.js` | Infraestructura | Única clase que importa `nodemailer` |
| `backend/src/infrastructure/email/templates/*.js` | Infraestructura | Plantillas HTML/texto de los correos |
| `backend/src/application/orders/OrderService.js` | Aplicación | Recibe el puerto por constructor y lo invoca tras crear el pedido |
| `backend/src/interfaces/server.js` | Interfaces | Composición: conecta el adaptador al servicio |
| `frontend/src/components/CheckoutConfirmation.jsx` | Frontend | Confirmación del checkout con estado Pendiente de pago |

`OrderService` nunca importa Nodemailer ni lee `process.env`. Si el envío falla, el pedido se conserva y la respuesta incluye `notificacion.cliente.enviado = false`.

### Ejecución local (localhost)

```bash
npm install                # instala nodemailer
cp .env.example .env       # configura BD y correo
npm test                   # pruebas unitarias del puerto (sin BD ni SMTP)
npm run email:prueba       # envía un correo de ejemplo sin BD
npm run dev                # backend en http://localhost:3000
cd frontend && npm run dev # frontend en http://localhost:5173
```

**Ethereal** (`EMAIL_PROVIDER=ethereal`): sin credenciales, se crea una cuenta al arrancar y la consola imprime usuario, contraseña y la URL de vista previa de cada correo. Inicia sesión en https://ethereal.email/login con esos datos para ver la bandeja.

**Mailtrap** (`EMAIL_PROVIDER=mailtrap`): copia `SMTP_USER` y `SMTP_PASS` de tu Sandbox en mailtrap.io; los correos aparecen en la bandeja de pruebas.

`EMAIL_PROVIDER=none` desactiva el envío.

