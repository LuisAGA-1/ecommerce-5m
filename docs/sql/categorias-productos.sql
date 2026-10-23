-- =========================================================
-- Categorías de productos
--
--   sudo -u postgres psql -d ecommerce_db -f docs/sql/categorias-productos.sql
--
-- Córrelo ANTES de arrancar el backend nuevo: el API de
-- productos ya lee la columna categoria.
-- Es seguro ejecutarlo varias veces.
-- =========================================================

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS categoria VARCHAR(30) NOT NULL DEFAULT 'Otros';

-- Primera clasificación por el inicio del nombre (solo los que siguen en 'Otros').
-- "Funda para laptop" no empieza con "laptop", así que no cae en Laptops.
-- Revisa el resultado y corrige lo que haga falta desde el panel de productos.
UPDATE productos SET categoria = CASE
    WHEN nombre ILIKE ANY (ARRAY['laptop%', 'notebook%', 'macbook%'])                        THEN 'Laptops'
    WHEN nombre ILIKE ANY (ARRAY['computadora%', 'pc %', 'all in one%', 'imac%'])            THEN 'Computadoras'
    WHEN nombre ILIKE 'monitor%'                                                              THEN 'Monitores'
    WHEN nombre ILIKE ANY (ARRAY['celular%', 'smartphone%', 'iphone%', 'teléfono%'])         THEN 'Celulares'
    WHEN nombre ILIKE ANY (ARRAY['tablet%', 'ipad%'])                                         THEN 'Tablets'
    WHEN nombre ILIKE ANY (ARRAY['audífono%', 'audifono%', 'bocina%', 'headset%'])           THEN 'Audio'
    WHEN nombre ILIKE ANY (ARRAY['mouse%', 'teclado%', 'funda%', 'cable%', 'cargador%', 'mochila%', 'hub%']) THEN 'Accesorios'
    WHEN nombre ILIKE ANY (ARRAY['memoria%', 'disco%', 'ssd%', 'tarjeta%', 'procesador%'])   THEN 'Componentes'
    ELSE 'Otros'
  END
WHERE categoria = 'Otros';

-- Acelera "productos de una categoría" (bot y catálogo).
CREATE INDEX IF NOT EXISTS idx_productos_categoria
  ON productos (categoria)
  WHERE publicado = TRUE;

SELECT categoria, COUNT(*) AS productos
FROM productos
GROUP BY categoria
ORDER BY categoria;
