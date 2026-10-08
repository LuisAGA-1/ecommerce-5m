-- =========================================================
-- Índices recomendados para el panel analítico
--
--   sudo -u postgres psql -d ecommerce_db -f docs/sql/indices-analitica.sql
--
-- Son opcionales y seguros de ejecutar varias veces.
-- Aceleran los filtros por rango de fechas + estado y los
-- JOIN de detalle_pedido cuando la tabla crece.
-- =========================================================

-- Filtro principal de todos los reportes: WHERE fecha BETWEEN ... AND estado IN (...)
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_estado
  ON pedidos (fecha, estado)
  INCLUDE (total, usuario_id);

-- JOIN detalle_pedido -> pedidos (ranking de productos y unidades vendidas)
CREATE INDEX IF NOT EXISTS idx_detalle_pedido_pedido
  ON detalle_pedido (pedido_id)
  INCLUDE (producto_id, cantidad, precio_unitario);

-- Conteo de clientes registrados
CREATE INDEX IF NOT EXISTS idx_usuarios_rol
  ON usuarios (rol);

ANALYZE pedidos;
ANALYZE detalle_pedido;
