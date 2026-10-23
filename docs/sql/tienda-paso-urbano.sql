-- =========================================================
-- Catálogo de "Paso Urbano" (tenis y ropa urbana)
--
--   sudo -u postgres psql -d ecommerce_db -f docs/sql/tienda-paso-urbano.sql
--
-- Requiere docs/sql/categorias-productos.sql (columna categoria).
-- - Oculta (despublica) los productos anteriores; no borra nada,
--   así los pedidos viejos siguen intactos.
-- - Pasa a 'Otros' las categorías que ya no existen (Laptops, etc.)
--   para que se puedan editar desde el admin.
-- - Agrega los productos nuevos (si ya existen por nombre, no los duplica).
-- Las imágenes están en frontend/public/catalogo/.
-- Para volver a mostrar un producto viejo: publícalo desde el admin.
-- =========================================================

BEGIN;

WITH nuevos (nombre, descripcion, precio, stock, imagen_url, categoria) AS (
  VALUES
    ('Tenis Runner Aire Blanco',   'Tenis para correr con amortiguación de aire y malla transpirable.', 1899.00, 12, '/catalogo/tenis-runner-blanco.svg',    'Tenis'),
    ('Tenis Runner Aire Negro',    'La versión total black del Runner Aire, ligera y cómoda todo el día.', 1899.00, 10, '/catalogo/tenis-runner-negro.svg',  'Tenis'),
    ('Tenis Clásico Lona Rojo',    'Tenis de lona con suela vulcanizada, el clásico de siempre.', 999.00, 20, '/catalogo/tenis-clasico-rojo.svg',               'Tenis'),
    ('Tenis Skate Pro Gris',       'Suela plana de alto agarre y puntera reforzada para patinar.', 1499.00, 8, '/catalogo/tenis-skate-gris.svg',               'Tenis'),
    ('Tenis Trail Montaña Verde',  'Suela con tacos para terracería y ciudad.', 2299.00, 6, '/catalogo/tenis-trail-verde.svg',                                'Tenis'),
    ('Playera Básica Blanca',      'Algodón 100%, corte regular.', 349.00, 40, '/catalogo/playera-basica-blanca.svg',                                         'Playeras'),
    ('Playera Oversize Negra',     'Corte holgado y hombro caído, algodón pesado.', 449.00, 30, '/catalogo/playera-oversize-negra.svg',                        'Playeras'),
    ('Sudadera con Capucha Arena', 'Felpa suave por dentro, bolsa canguro.', 899.00, 15, '/catalogo/sudadera-capucha-arena.svg',                                'Sudaderas'),
    ('Sudadera con Capucha Verde', 'Felpa suave por dentro, color verde olivo.', 899.00, 12, '/catalogo/sudadera-capucha-verde.svg',                          'Sudaderas'),
    ('Gorra Curva Negra',          'Seis paneles, visera curva y ajuste trasero.', 399.00, 25, '/catalogo/gorra-curva-negra.svg',                               'Gorras'),
    ('Gorra Plana Naranja',        'Visera plana y broche ajustable.', 449.00, 18, '/catalogo/gorra-plana-naranja.svg',                                         'Gorras'),
    ('Mochila Urbana 20L',         'Compartimento para laptop de 15" y bolsillo frontal.', 1099.00, 10, '/catalogo/mochila-urbana-20l.svg',                    'Mochilas'),
    ('Mochila Roll-top Mostaza',   'Cierre enrollable resistente al agua.', 1399.00, 7, '/catalogo/mochila-rolltop.svg',                                       'Mochilas'),
    ('Calcetines Deportivos (3 pares)', 'Caña alta con franjas, algodón y elastano.', 249.00, 50, '/catalogo/calcetines-pack-3.svg',                          'Calcetines'),
    ('Lentes de Sol Clásicos',     'Armazón negro con protección UV400.', 599.00, 14, '/catalogo/lentes-clasicos.svg',                                       'Accesorios'),
    ('Riñonera Negra',             'Correa ajustable y dos compartimentos.', 499.00, 16, '/catalogo/rinonera-negra.svg',                                     'Accesorios')
),
ocultos AS (
  UPDATE productos
  SET publicado = FALSE
  WHERE nombre NOT IN (SELECT nombre FROM nuevos)
  RETURNING id
)
INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, proveedor_id, publicado, categoria)
SELECT n.nombre, n.descripcion, n.precio, n.stock, n.imagen_url, NULL, TRUE, n.categoria
FROM nuevos n
WHERE NOT EXISTS (SELECT 1 FROM productos p WHERE p.nombre = n.nombre);

UPDATE productos
SET categoria = 'Otros'
WHERE categoria NOT IN ('Tenis', 'Playeras', 'Sudaderas', 'Gorras', 'Mochilas', 'Calcetines', 'Accesorios', 'Otros');

COMMIT;

SELECT categoria, COUNT(*) FILTER (WHERE publicado) AS publicados, COUNT(*) AS total
FROM productos
GROUP BY categoria
ORDER BY categoria;
