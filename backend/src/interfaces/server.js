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

const orderService = new OrderService(
  orderRepository,
  userRepository,
  productRepository
);

const orderController =
  new OrderController(orderService);

app.use(
  "/pedidos",
  createOrderRoutes(orderController)
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
