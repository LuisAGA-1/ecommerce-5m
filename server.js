require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("API funcionando");
});

// POST /usuarios
// Registrar un nuevo usuario
app.post("/usuarios", async (req, res) => {
  const { nombre, email, password } = req.body;

  // Validación
  if (!nombre || !email || !password) {
    return res.status(400).json({
      msg: "Faltan datos"
    });
  }

  try {
    // Convertir contraseña a hash
    const passwordHash = await bcrypt.hash(password, 10);

    // Insertar usuario
    await pool.query(
      "INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)",
      [nombre, email, passwordHash]
    );

    res.status(201).json({
      msg: "Usuario registrado"
    });

  } catch (error) {
    console.error(error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        msg: "El correo ya existe"
      });
    }

    res.status(500).json({
      msg: "Error del servidor"
    });
  }
});

// GET /usuarios
// Consultar usuarios
app.get("/usuarios", async (req, res) => {

  try {
    const [rows] = await pool.query(
      "SELECT id, nombre, email, password_hash FROM usuarios"
    );

    res.json(rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      msg: "Error del servidor"
    });
  }
});

// POST /login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        msg: "Credenciales incorrectas"
      });
    }

    const user = rows[0];

    const valid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!valid) {
      return res.status(401).json({
        msg: "Credenciales incorrectas"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h"
      }
    );

    res.json({
      msg: "Login exitoso",
      token
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      msg: "Error del servidor"
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(
    "Servidor escuchando en el puerto",
    process.env.PORT || 3000
  );
});
