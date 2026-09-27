const UserRepository = require("../../domain/ports/UserRepository");
const pool = require("../database/db");

class UserRepositoryPostgres extends UserRepository {
  async create(user) {
    const result = await pool.query(
      `INSERT INTO usuarios
       (nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, email, rol`,
      [
        user.nombre,
        user.email,
        user.passwordHash,
        user.rol
      ]
    );

    return result.rows[0];
  }

  async findAll() {
    const result = await pool.query(
      `SELECT id, nombre, email, rol
       FROM usuarios
       ORDER BY id`
    );

    return result.rows;
  }

  async findById(id) {
    const result = await pool.query(
      `SELECT id, nombre, email, rol
       FROM usuarios
       WHERE id = $1`,
      [id]
    );

    return result.rows.length > 0
      ? result.rows[0]
      : null;
  }

  async findByEmail(email) {
    const result = await pool.query(
      `SELECT id, nombre, email, password_hash, rol
       FROM usuarios
       WHERE email = $1`,
      [email]
    );

    return result.rows.length > 0
      ? result.rows[0]
      : null;
  }

  async update(id, user) {
    const result = await pool.query(
      `UPDATE usuarios
       SET nombre = $1,
           email = $2,
           password_hash = $3,
           rol = $4
       WHERE id = $5
       RETURNING id, nombre, email, rol`,
      [
        user.nombre,
        user.email,
        user.passwordHash,
        user.rol,
        id
      ]
    );

    return result.rows.length > 0
      ? result.rows[0]
      : null;
  }

  async delete(id) {
    const result = await pool.query(
      `DELETE FROM usuarios
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    return result.rows.length > 0;
  }
}

module.exports = UserRepositoryPostgres;
