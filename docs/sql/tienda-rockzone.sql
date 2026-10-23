-- =========================================================
-- Catálogo de RockZone (instrumentos y equipo para bandas de rock)
--
--   sudo -u postgres psql -d ecommerce_db -f docs/sql/tienda-rockzone.sql
--
-- Requiere docs/sql/categorias-productos.sql (columna categoria).
-- - Oculta (despublica) los productos anteriores; no borra nada,
--   así los pedidos viejos siguen intactos.
-- - Pasa a 'Otros' las categorías que ya no existen (Laptops, etc.)
--   para que se puedan editar desde el admin.
-- - Agrega los productos nuevos (si ya existen por nombre, no los duplica).
-- Las imágenes están en frontend/public/catalogo/; puedes cambiarlas por
-- fotos reales desde el admin (campo "URL de imagen").
-- Para volver a mostrar un producto viejo: publícalo desde el admin.
-- =========================================================

BEGIN;

WITH nuevos (nombre, descripcion, precio, stock, imagen_url, categoria) AS (
  VALUES
    ('Guitarra eléctrica Stratus Sunburst', 'Cuerpo de aliso, 3 pastillas single coil y mástil de maple.', 8499.00, 6, '/catalogo/guitarra-stratus-sunburst.svg', 'Instrumentos'),
    ('Guitarra eléctrica Thunder Negra', 'Dos humbuckers de alta ganancia, ideal para rock pesado.', 11999.00, 4, '/catalogo/guitarra-thunder-negra.svg', 'Instrumentos'),
    ('Bajo eléctrico Groove 4 cuerdas', 'Pastillas P/J, sonido redondo para cualquier estilo.', 9299.00, 5, '/catalogo/bajo-groove.svg', 'Instrumentos'),
    ('Batería acústica 5 piezas', 'Bombo 22", tarola, 3 toms, platillos y herrajes incluidos.', 14999.00, 3, '/catalogo/bateria-acustica.svg', 'Instrumentos'),
    ('Teclado sintetizador 61 teclas', 'Teclas sensibles, 400 sonidos y salida USB-MIDI.', 6799.00, 7, '/catalogo/teclado-61.svg', 'Instrumentos'),
    ('Guitarra electroacústica Folk', 'Tapa de abeto, ecualizador de 4 bandas con afinador.', 4999.00, 8, '/catalogo/electroacustica-folk.svg', 'Instrumentos'),
    ('Cuerdas para guitarra eléctrica 10-46', 'Juego de 6 cuerdas de níquel, calibre regular.', 249.00, 60, '/catalogo/cuerdas-10-46.svg', 'Insumos y refacciones'),
    ('Plumillas surtidas (12 piezas)', 'Calibres delgado, medio y grueso.', 129.00, 80, '/catalogo/plumillas-surtidas.svg', 'Insumos y refacciones'),
    ('Baquetas 5A de maple', 'Par de baquetas con punta de madera.', 199.00, 50, '/catalogo/baquetas-5a.svg', 'Insumos y refacciones'),
    ('Cable para instrumento 6 m', 'Plug de 1/4" con blindaje contra ruido.', 349.00, 40, '/catalogo/cable-6m.svg', 'Insumos y refacciones'),
    ('Parche para tarola 14"', 'Parche arenado de una capa.', 599.00, 20, '/catalogo/parche-tarola.svg', 'Insumos y refacciones'),
    ('Pedal de distorsión Fuzz', 'Fuzz clásico con controles de volumen, tono y ganancia.', 1299.00, 12, '/catalogo/pedal-fuzz.svg', 'Efectos y accesorios'),
    ('Pedal de delay analógico', 'Repeticiones cálidas de hasta 600 ms.', 1899.00, 9, '/catalogo/pedal-delay.svg', 'Efectos y accesorios'),
    ('Afinador digital de clip', 'Para guitarra, bajo y ukulele, pantalla a color.', 299.00, 35, '/catalogo/afinador-clip.svg', 'Efectos y accesorios'),
    ('Correa de cuero para guitarra', 'Cuero ajustable con costura roja.', 449.00, 25, '/catalogo/correa-cuero.svg', 'Efectos y accesorios'),
    ('Estuche rígido para guitarra eléctrica', 'Interior acolchado y cerradura.', 1999.00, 10, '/catalogo/estuche-guitarra.svg', 'Efectos y accesorios'),
    ('Amplificador de guitarra 40W', 'Dos canales, reverb y entrada para audífonos.', 4299.00, 6, '/catalogo/ampli-guitarra-40w.svg', 'Amplificación y sonido'),
    ('Amplificador de bajo 100W', 'Bocina de 12" y ecualizador de 4 bandas.', 6999.00, 4, '/catalogo/ampli-bajo-100w.svg', 'Amplificación y sonido'),
    ('Micrófono dinámico vocal', 'Patrón cardioide, ideal para voces en vivo.', 1599.00, 15, '/catalogo/microfono-vocal.svg', 'Amplificación y sonido'),
    ('Interfaz de audio 2x2', 'Dos entradas con preamp y USB-C para grabar en casa.', 2899.00, 8, '/catalogo/interfaz-2x2.svg', 'Amplificación y sonido'),
    ('Audífonos de monitoreo', 'Respuesta plana y cable de 3 m.', 1199.00, 18, '/catalogo/audifonos-monitoreo.svg', 'Amplificación y sonido'),
    ('Mezcladora de 8 canales', 'Efectos integrados y entradas XLR.', 3999.00, 5, '/catalogo/mezcladora-8.svg', 'Amplificación y sonido'),
    ('Paquete banda principiante', 'Guitarra eléctrica, amplificador 20W, cable, correa y plumillas.', 9999.00, 4, '/catalogo/paquete-principiante.svg', 'Equipo para bandas'),
    ('Paquete voces en vivo', 'Dos micrófonos dinámicos, pedestales y cables.', 3999.00, 6, '/catalogo/paquete-voces.svg', 'Equipo para bandas'),
    ('Sistema de sonido para escenario pequeño', 'Par de bocinas activas de 500W con tripiés.', 12999.00, 3, '/catalogo/sistema-escenario.svg', 'Equipo para bandas')
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
WHERE categoria NOT IN ('Instrumentos', 'Insumos y refacciones', 'Efectos y accesorios', 'Amplificación y sonido', 'Equipo para bandas', 'Otros');

COMMIT;

SELECT categoria, COUNT(*) FILTER (WHERE publicado) AS publicados, COUNT(*) AS total
FROM productos
GROUP BY categoria
ORDER BY categoria;
