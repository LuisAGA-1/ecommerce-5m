require("dotenv").config({
  path: __dirname + "/../../.env"
});

const express = require("express");
const cors = require("cors");

// =========================
// USUARIOS
// =========================
const UserRepositoryPostgres = require("../infrastructure/repositories/UserRepository");
const UserService = require("../application/users/UserService");
const UserController = require("./controllers/userController");
const createUserRoutes = require("./routes/userRoutes");

// =========================
// AUTENTICACIÓN
// =========================
const AuthService = require("../application/auth/AuthService");
const AuthController = require("./controllers/authController");
const createAuthRoutes = require("./routes/authRoutes");

// =========================
// PRODUCTOS
// =========================
const ProductRepositoryPostgres = require("../infrastructure/repositories/ProductRepository");
const ProductService = require("../application/products/ProductService");
const ProductController = require("./controllers/productController");
const createProductRoutes = require("./routes/productRoutes");

// =========================
// PEDIDOS
// =========================
const OrderRepositoryPostgres = require("../infrastructure/repositories/OrderRepository");
const OrderService = require("../application/orders/OrderService");
const OrderController = require("./controllers/orderController");
const createOrderRoutes = require("./routes/orderRoutes");

// =========================
// REPORTES ANALÍTICOS
// =========================
const AnalyticsRepositoryAdapter = require("../infrastructure/repositories/AnalyticsRepositoryAdapter");
const AnalyticsService = require("../application/analytics/AnalyticsService");
const AnalyticsController = require("./controllers/analyticsController");
const createAnalyticsRoutes = require("./routes/analyticsRoutes");

// =========================
// NOTIFICACIONES (puerto de salida + adaptadores)
// Nodemailer directo o n8n (con respaldo), según EMAIL_PROVIDER
// =========================
const crearServicioNotificaciones = require("../infrastructure/notifications/crearServicioNotificaciones");

// =========================
// APLICACIÓN
// =========================
const app = express();

app.use(cors());
app.use(express.json());

// =========================
// USUARIOS
// =========================
const userRepository = new UserRepositoryPostgres();

const userService = new UserService(
  userRepository
);

const userController = new UserController(
  userService
);

app.use(
  "/usuarios",
  createUserRoutes(userController)
);

// =========================
// AUTENTICACIÓN
// =========================
const authService = new AuthService(
  userRepository
);

const authController = new AuthController(
  authService
);

app.use(
  "/auth",
  createAuthRoutes(authController)
);

// =========================
// PRODUCTOS
// =========================
const productRepository =
  new ProductRepositoryPostgres();

const productService = new ProductService(
  productRepository
);

const productController =
  new ProductController(productService);

app.use(
  "/productos",
  createProductRoutes(productController)
);

// =========================
// PEDIDOS
// =========================
const orderRepository =
  new OrderRepositoryPostgres();

// Adaptador de notificaciones: aquí (y solo aquí) se decide qué
// implementación del puerto EmailServicePort se conecta.
//   EMAIL_PROVIDER=ethereal|mailtrap|smtp -> Nodemailer
//   EMAIL_PROVIDER=n8n                    -> webhook de n8n (+ respaldo)
//   EMAIL_PROVIDER=none                   -> sin notificaciones
const emailService = crearServicioNotificaciones(process.env);

const orderService = new OrderService(
  orderRepository,
  userRepository,
  productRepository,
  emailService
);

const orderController =
  new OrderController(orderService);

app.use(
  "/pedidos",
  createOrderRoutes(orderController)
);

// =========================
// REPORTES ANALÍTICOS (solo admin)
// Puerto de salida AnalyticsRepository -> adaptador PostgreSQL
// =========================
const analyticsRepository =
  new AnalyticsRepositoryAdapter();

const analyticsService =
  new AnalyticsService(analyticsRepository);

const analyticsController =
  new AnalyticsController(analyticsService);

app.use(
  "/api/reportes",
  createAnalyticsRoutes(analyticsController)
);

// =========================
// RUTA PRINCIPAL
// =========================
app.get("/", (req, res) => {
  res.json({
    mensaje: "API E-Commerce funcionando"
  });
});

// =========================
// SERVIDOR
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Servidor escuchando en el puerto ${PORT}`
  );
});
