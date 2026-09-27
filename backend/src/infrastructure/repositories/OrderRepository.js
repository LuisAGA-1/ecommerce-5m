const OrderRepository = require("../../domain/ports/OrderRepository");
const pool = require("../database/db");

class OrderRepositoryPostgres extends OrderRepository {

  // =========================================================
  // CREAR PEDIDO
  // El pedido nace como PENDIENTE.
  // IMPORTANTE: aquí NO se descuenta stock.
  // =========================================================
  async create(order) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const orderResult = await client.query(
        `INSERT INTO pedidos
         (usuario_id, total, estado)
         VALUES ($1, $2, 'PENDIENTE')
         RETURNING id, usuario_id, fecha, total, estado`,
        [
          order.usuarioId,
          order.total
        ]
      );

      const pedido = orderResult.rows[0];

      for (const detalle of order.detalles) {

        await client.query(
          `INSERT INTO detalle_pedido
           (pedido_id, producto_id, cantidad, precio_unitario)
           VALUES ($1, $2, $3, $4)`,
          [
            pedido.id,
            detalle.productoId,
            detalle.cantidad,
            detalle.precioUnitario
          ]
        );
      }

      await client.query("COMMIT");

      return await this.findById(pedido.id);

    } catch (error) {

      await client.query("ROLLBACK");

      throw error;

    } finally {

      client.release();

    }
  }

  // =========================================================
  // OBTENER TODOS LOS PEDIDOS
  // =========================================================
  async findAll() {

    const result = await pool.query(
      `SELECT
         p.id,
         p.usuario_id,
         p.fecha,
         p.total,
         p.estado,
         u.nombre AS usuario_nombre,
         u.email AS usuario_email,
         COALESCE(
           SUM(d.cantidad),
           0
         ) AS cantidad_productos
       FROM pedidos p
       INNER JOIN usuarios u
         ON p.usuario_id = u.id
       LEFT JOIN detalle_pedido d
         ON p.id = d.pedido_id
       GROUP BY
         p.id,
         p.usuario_id,
         p.fecha,
         p.total,
         p.estado,
         u.nombre,
         u.email
       ORDER BY p.id`
    );

    return result.rows;
  }

  // =========================================================
  // OBTENER PEDIDO POR ID
  // =========================================================
  async findById(id) {

    const orderResult = await pool.query(
      `SELECT
         p.id,
         p.usuario_id,
         p.fecha,
         p.total,
         p.estado,
         u.nombre AS usuario_nombre,
         u.email AS usuario_email
       FROM pedidos p
       INNER JOIN usuarios u
         ON p.usuario_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return null;
    }

    const order = orderResult.rows[0];

    const detailResult = await pool.query(
      `SELECT
         d.id,
         d.producto_id,
         pr.nombre AS producto_nombre,
         d.cantidad,
         d.precio_unitario
       FROM detalle_pedido d
       INNER JOIN productos pr
         ON d.producto_id = pr.id
       WHERE d.pedido_id = $1
       ORDER BY d.id`,
      [id]
    );

    return {
      ...order,
      detalles: detailResult.rows
    };
  }

  // =========================================================
  // OBTENER PEDIDOS DE UN CLIENTE
  // =========================================================
  async findByUserId(usuarioId) {

    const result = await pool.query(
      `SELECT
         p.id,
         p.usuario_id,
         p.fecha,
         p.total,
         p.estado,
         COALESCE(
           SUM(d.cantidad),
           0
         ) AS cantidad_productos
       FROM pedidos p
       LEFT JOIN detalle_pedido d
         ON p.id = d.pedido_id
       WHERE p.usuario_id = $1
       GROUP BY
         p.id,
         p.usuario_id,
         p.fecha,
         p.total,
         p.estado
       ORDER BY p.id DESC`,
      [usuarioId]
    );

    return result.rows;
  }

  // =========================================================
  // ACTUALIZAR PEDIDO
  //
  // Solamente se pueden modificar pedidos PENDIENTES.
  // No se modifica el stock aquí.
  // =========================================================
  async update(id, order) {

    const client = await pool.connect();

    try {

      await client.query("BEGIN");

      const existingOrder = await client.query(
        `SELECT id, estado
         FROM pedidos
         WHERE id = $1
         FOR UPDATE`,
        [id]
      );

      if (existingOrder.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      if (existingOrder.rows[0].estado !== "PENDIENTE") {
        throw new Error(
          "Solo se pueden modificar pedidos pendientes"
        );
      }

      await client.query(
        `DELETE FROM detalle_pedido
         WHERE pedido_id = $1`,
        [id]
      );

      for (const detalle of order.detalles) {

        await client.query(
          `INSERT INTO detalle_pedido
           (pedido_id, producto_id, cantidad, precio_unitario)
           VALUES ($1, $2, $3, $4)`,
          [
            id,
            detalle.productoId,
            detalle.cantidad,
            detalle.precioUnitario
          ]
        );
      }

      await client.query(
        `UPDATE pedidos
         SET usuario_id = $1,
             total = $2
         WHERE id = $3`,
        [
          order.usuarioId,
          order.total,
          id
        ]
      );

      await client.query("COMMIT");

      return await this.findById(id);

    } catch (error) {

      await client.query("ROLLBACK");

      throw error;

    } finally {

      client.release();

    }
  }

  // =========================================================
  // ACEPTAR O RECHAZAR PEDIDO
  //
  // ACEPTAR:
  // - Verifica que esté PENDIENTE
  // - Verifica stock
  // - Descuenta stock
  // - Cambia estado a ACEPTADO
  //
  // RECHAZAR:
  // - Verifica que esté PENDIENTE
  // - NO toca stock
  // - Cambia estado a RECHAZADO
  // =========================================================
  async changeStatus(id, nuevoEstado) {

    const client = await pool.connect();

    try {

      await client.query("BEGIN");

      const orderResult = await client.query(
        `SELECT id, estado
         FROM pedidos
         WHERE id = $1
         FOR UPDATE`,
        [id]
      );

      if (orderResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      const pedido = orderResult.rows[0];

      if (pedido.estado !== "PENDIENTE") {
        throw new Error(
          "El pedido ya fue procesado"
        );
      }

      // =====================================================
      // RECHAZAR
      // =====================================================
      if (nuevoEstado === "RECHAZADO") {

        await client.query(
          `UPDATE pedidos
           SET estado = 'RECHAZADO'
           WHERE id = $1`,
          [id]
        );

        await client.query("COMMIT");

        return await this.findById(id);
      }

      // =====================================================
      // ACEPTAR
      // =====================================================
      if (nuevoEstado === "ACEPTADO") {

        const detalles = await client.query(
          `SELECT producto_id, cantidad
           FROM detalle_pedido
           WHERE pedido_id = $1`,
          [id]
        );

        if (detalles.rows.length === 0) {
          throw new Error(
            "El pedido no tiene productos"
          );
        }

        // Verificar y descontar stock
        for (const detalle of detalles.rows) {

          const stockResult = await client.query(
            `UPDATE productos
             SET stock = stock - $1
             WHERE id = $2
               AND stock >= $1
             RETURNING id, stock`,
            [
              detalle.cantidad,
              detalle.producto_id
            ]
          );

          if (stockResult.rows.length === 0) {
            throw new Error(
              "Stock insuficiente para aceptar el pedido"
            );
          }
        }

        await client.query(
          `UPDATE pedidos
           SET estado = 'ACEPTADO'
           WHERE id = $1`,
          [id]
        );

        await client.query("COMMIT");

        return await this.findById(id);
      }

      throw new Error(
        "Estado de pedido no válido"
      );

    } catch (error) {

      await client.query("ROLLBACK");

      throw error;

    } finally {

      client.release();

    }
  }

  // =========================================================
  // ELIMINAR PEDIDO
  //
  // Si estaba ACEPTADO, devuelve el stock.
  // Si estaba PENDIENTE o RECHAZADO, no modifica stock.
  // =========================================================
  async delete(id) {

    const client = await pool.connect();

    try {

      await client.query("BEGIN");

      const orderResult = await client.query(
        `SELECT id, estado
         FROM pedidos
         WHERE id = $1
         FOR UPDATE`,
        [id]
      );

      if (orderResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return false;
      }

      const pedido = orderResult.rows[0];

      // Solo devolver stock si el pedido fue aceptado
      if (pedido.estado === "ACEPTADO") {

        const details = await client.query(
          `SELECT producto_id, cantidad
           FROM detalle_pedido
           WHERE pedido_id = $1`,
          [id]
        );

        for (const detalle of details.rows) {

          await client.query(
            `UPDATE productos
             SET stock = stock + $1
             WHERE id = $2`,
            [
              detalle.cantidad,
              detalle.producto_id
            ]
          );
        }
      }

      const deleteResult = await client.query(
        `DELETE FROM pedidos
         WHERE id = $1
         RETURNING id`,
        [id]
      );

      await client.query("COMMIT");

      return deleteResult.rows.length > 0;

    } catch (error) {

      await client.query("ROLLBACK");

      throw error;

    } finally {

      client.release();

    }
  }
}

module.exports = OrderRepositoryPostgres;
