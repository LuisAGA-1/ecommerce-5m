const ProductRepository = require("../../domain/ports/ProductRepository");
const pool = require("../database/db");

class ProductRepositoryPostgres extends ProductRepository {

  // =========================================================
  // CREAR PRODUCTO
  // =========================================================
  async create(product) {

    const result = await pool.query(
      `INSERT INTO productos
       (
         nombre,
         descripcion,
         precio,
         stock,
         imagen_url,
         proveedor_id,
         publicado
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING
         id,
         nombre,
         descripcion,
         precio,
         stock,
         imagen_url,
         proveedor_id,
         publicado`,
      [
        product.nombre,
        product.descripcion,
        product.precio,
        product.stock,
        product.imagenUrl,
        product.proveedorId,
        product.publicado
      ]
    );

    return result.rows[0];
  }

  // =========================================================
  // OBTENER TODOS LOS PRODUCTOS
  // =========================================================
  async findAll() {

    const result = await pool.query(
      `SELECT
         id,
         nombre,
         descripcion,
         precio,
         stock,
         imagen_url,
         proveedor_id,
         publicado
       FROM productos
       ORDER BY id`
    );

    return result.rows;
  }

  // =========================================================
  // OBTENER PRODUCTOS PUBLICADOS
  // =========================================================
  async findPublished() {

    const result = await pool.query(
      `SELECT
         id,
         nombre,
         descripcion,
         precio,
         stock,
         imagen_url,
         proveedor_id,
         publicado
       FROM productos
       WHERE publicado = TRUE
       ORDER BY id`
    );

    return result.rows;
  }

  // =========================================================
  // OBTENER MIS PRODUCTOS
  // =========================================================
  async findByProviderId(proveedorId) {

    const result = await pool.query(
      `SELECT
         id,
         nombre,
         descripcion,
         precio,
         stock,
         imagen_url,
         proveedor_id,
         publicado
       FROM productos
       WHERE proveedor_id = $1
       ORDER BY id`,
      [proveedorId]
    );

    return result.rows;
  }

  // =========================================================
  // OBTENER PRODUCTO POR ID
  // =========================================================
  async findById(id) {

    const result = await pool.query(
      `SELECT
         id,
         nombre,
         descripcion,
         precio,
         stock,
         imagen_url,
         proveedor_id,
         publicado
       FROM productos
       WHERE id = $1`,
      [id]
    );

    return result.rows.length > 0
      ? result.rows[0]
      : null;
  }

  // =========================================================
  // ACTUALIZAR PRODUCTO
  // =========================================================
  async update(id, product) {

    const result = await pool.query(
      `UPDATE productos
       SET nombre = $1,
           descripcion = $2,
           precio = $3,
           stock = $4,
           imagen_url = $5
       WHERE id = $6
       RETURNING
         id,
         nombre,
         descripcion,
         precio,
         stock,
         imagen_url,
         proveedor_id,
         publicado`,
      [
        product.nombre,
        product.descripcion,
        product.precio,
        product.stock,
        product.imagenUrl,
        id
      ]
    );

    return result.rows.length > 0
      ? result.rows[0]
      : null;
  }

  // =========================================================
  // PUBLICAR PRODUCTO
  // =========================================================
  async publish(id, proveedorId) {

    const result = await pool.query(
      `UPDATE productos
       SET publicado = TRUE
       WHERE id = $1
         AND proveedor_id = $2
       RETURNING
         id,
         nombre,
         descripcion,
         precio,
         stock,
         imagen_url,
         proveedor_id,
         publicado`,
      [id, proveedorId]
    );

    return result.rows.length > 0
      ? result.rows[0]
      : null;
  }

  // =========================================================
  // DESPUBLICAR PRODUCTO
  // =========================================================
  async unpublish(id, proveedorId) {

    const result = await pool.query(
      `UPDATE productos
       SET publicado = FALSE
       WHERE id = $1
         AND proveedor_id = $2
       RETURNING
         id,
         nombre,
         descripcion,
         precio,
         stock,
         imagen_url,
         proveedor_id,
         publicado`,
      [id, proveedorId]
    );

    return result.rows.length > 0
      ? result.rows[0]
      : null;
  }

  // =========================================================
  // ELIMINAR PRODUCTO
  // =========================================================
  async delete(id) {

    const result = await pool.query(
      `DELETE FROM productos
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    return result.rows.length > 0;
  }
}

module.exports = ProductRepositoryPostgres;
