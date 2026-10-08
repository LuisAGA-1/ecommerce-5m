// =========================================================
// Datos de demostración para el panel analítico
//
//   npm run seed:analitica             -> crea clientes demo y pedidos
//   npm run seed:analitica -- --limpiar -> borra SOLO los datos demo
//
// Opciones:  --dias=120  --pedidos=220
//
// Crea 6 clientes "demoN@analitica.test" (contraseña Demo1234)
// y pedidos repartidos en los últimos N días con estados
// variados, usando los productos que ya existen en tu BD.
// No modifica el stock ni toca pedidos/usuarios reales.
// =========================================================
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
require("dotenv").config({ path: path.join(__dirname, "../../.env"), quiet: true });

const DOMINIO_DEMO = "@analitica.test";

function leerOpcion(nombre, porDefecto) {
  const arg = process.argv.find(a => a.startsWith(`--${nombre}=`));
  return arg ? Number(arg.split("=")[1]) : porDefecto;
}

// ---------------------------------------------------------
// SQL (exportado para poder probarlo de forma aislada)
// ---------------------------------------------------------
const SQL = {

  insertarClientes: `
    INSERT INTO usuarios (nombre, email, password_hash, rol)
    SELECT
      'Cliente Demo ' || n,
      'demo' || n || '${DOMINIO_DEMO}',
      $1,
      'cliente'
    FROM generate_series(1, 6) AS n
    ON CONFLICT (email) DO NOTHING`,

  // ¿La tabla pedidos acepta el estado ENVIADO?
  permiteEnviado: `
    SELECT NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = 'pedidos'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%estado%'
        AND pg_get_constraintdef(oid) NOT ILIKE '%ENVIADO%'
    ) AS permitido`,

  // Un solo INSERT ... SELECT con CTEs:
  //  1) genera pedidos con id preasignado (nextval), fecha y estado
  //  2) elige 1-3 productos al azar (sesgado para que haya favoritos)
  //  3) inserta pedidos con su total ya calculado y luego el detalle
  insertarPedidos: `
    WITH clientes AS (
      SELECT array_agg(id) AS ids
      FROM usuarios
      WHERE email LIKE '%${DOMINIO_DEMO}'
    ),
    base AS (
      SELECT
        nextval(pg_get_serial_sequence('pedidos', 'id')) AS id,
        (SELECT ids FROM clientes)[1 + floor(random() * 6)::int] AS usuario_id,
        date_trunc('day', NOW())
          - (floor(power(random(), 1.35) * $1::int) || ' days')::interval
          + ((9 + floor(random() * 13)) || ' hours')::interval
          + (floor(random() * 60) || ' minutes')::interval AS fecha,
        random() AS r,
        g AS n
      FROM generate_series(1, $2::int) AS g
    ),
    lineas AS (
      SELECT
        b.id AS pedido_id,
        pr.id AS producto_id,
        (1 + floor(random() * 3))::int AS cantidad,
        pr.precio AS precio_unitario
      FROM base b
      CROSS JOIN LATERAL (
        SELECT p.id, p.precio
        FROM productos p
        WHERE b.n IS NOT NULL
        ORDER BY random() * (1 + (p.id % 6))
        LIMIT 1 + floor(random() * 3)::int
      ) pr
    ),
    nuevos AS (
      INSERT INTO pedidos (id, usuario_id, fecha, total, estado)
      SELECT
        b.id,
        b.usuario_id,
        b.fecha,
        (SELECT SUM(l.cantidad * l.precio_unitario) FROM lineas l WHERE l.pedido_id = b.id),
        CASE
          WHEN b.fecha > NOW() - interval '3 days' AND b.r < 0.6 THEN 'PENDIENTE'
          WHEN b.r < 0.15 THEN 'PENDIENTE'
          WHEN b.r < 0.72 THEN 'ACEPTADO'
          WHEN b.r < 0.88 THEN CASE WHEN $3::boolean THEN 'ENVIADO' ELSE 'ACEPTADO' END
          ELSE 'RECHAZADO'
        END
      FROM base b
      WHERE EXISTS (SELECT 1 FROM lineas l WHERE l.pedido_id = b.id)
      RETURNING id
    )
    INSERT INTO detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario)
    SELECT l.pedido_id, l.producto_id, l.cantidad, l.precio_unitario
    FROM lineas l
    INNER JOIN nuevos n ON n.id = l.pedido_id`,

  // El INSERT de arriba no puede leer las filas que él mismo crea,
  // así que se recalcula el total por si hubo diferencias.
  ajustarTotales: `
    UPDATE pedidos p
    SET total = t.total
    FROM (
      SELECT d.pedido_id, SUM(d.cantidad * d.precio_unitario) AS total
      FROM detalle_pedido d
      INNER JOIN pedidos px ON px.id = d.pedido_id
      INNER JOIN usuarios u ON u.id = px.usuario_id
      WHERE u.email LIKE '%${DOMINIO_DEMO}'
      GROUP BY d.pedido_id
    ) t
    WHERE p.id = t.pedido_id AND p.total IS DISTINCT FROM t.total`,

  resumen: `
    SELECT p.estado, COUNT(*)::int AS pedidos, SUM(p.total) AS monto
    FROM pedidos p
    INNER JOIN usuarios u ON u.id = p.usuario_id
    WHERE u.email LIKE '%${DOMINIO_DEMO}'
    GROUP BY p.estado
    ORDER BY p.estado`,

  limpiarDetalle: `
    DELETE FROM detalle_pedido
    WHERE pedido_id IN (
      SELECT p.id FROM pedidos p
      INNER JOIN usuarios u ON u.id = p.usuario_id
      WHERE u.email LIKE '%${DOMINIO_DEMO}'
    )`,

  limpiarPedidos: `
    DELETE FROM pedidos
    WHERE usuario_id IN (
      SELECT id FROM usuarios WHERE email LIKE '%${DOMINIO_DEMO}'
    )`,

  limpiarClientes: `
    DELETE FROM usuarios WHERE email LIKE '%${DOMINIO_DEMO}'`
};

async function sembrar(pool, { dias, pedidos, hash }) {
  const { rows: productos } = await pool.query("SELECT COUNT(*)::int AS n FROM productos");
  if (!Number(productos[0].n)) {
    throw new Error("No hay productos en la base de datos. Crea algunos antes de sembrar.");
  }

  await pool.query(SQL.insertarClientes, [hash]);

  const { rows } = await pool.query(SQL.permiteEnviado);
  const permiteEnviado = rows[0].permitido === true || rows[0].permitido === "t";

  await pool.query(SQL.insertarPedidos, [dias, pedidos, permiteEnviado]);
  await pool.query(SQL.ajustarTotales);

  const resumen = await pool.query(SQL.resumen);
  return { permiteEnviado, resumen: resumen.rows };
}

async function limpiar(pool) {
  await pool.query(SQL.limpiarDetalle);
  await pool.query(SQL.limpiarPedidos);
  await pool.query(SQL.limpiarClientes);
}

async function main() {
  const pool = require("../src/infrastructure/database/db");

  try {
    if (process.argv.includes("--limpiar")) {
      await limpiar(pool);
      console.log("Datos demo eliminados (clientes *@analitica.test y sus pedidos).");
      return;
    }

    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash("Demo1234", 10);

    const dias = leerOpcion("dias", 120);
    const pedidos = leerOpcion("pedidos", 220);

    const { permiteEnviado, resumen } = await sembrar(pool, { dias, pedidos, hash });

    console.log(`Pedidos demo generados en los últimos ${dias} días:`);
    console.table(resumen);

    if (!permiteEnviado) {
      console.log(
        "Nota: tu tabla 'pedidos' no admite el estado ENVIADO (CHECK); " +
        "esos pedidos se registraron como ACEPTADO."
      );
    }
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error("Error al sembrar datos:", error.message);
    process.exit(1);
  });
}

module.exports = { SQL, sembrar, limpiar };
