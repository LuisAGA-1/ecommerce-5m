// =========================================================
// Pruebas de la categoría de productos
//
//   npm test
// =========================================================
const { test } = require("node:test");
const assert = require("node:assert/strict");

const Product = require("../src/domain/entities/Product");
const ProductService = require("../src/application/products/ProductService");

const BASE = { nombre: "Guitarra eléctrica Stratus", precio: 8499, stock: 3 };

test("sin categoría el producto queda en Otros", () => {
  assert.equal(new Product(BASE).categoria, "Otros");
});

test("acepta una categoría de la lista y rechaza las demás", () => {
  assert.equal(new Product({ ...BASE, categoria: "Instrumentos" }).categoria, "Instrumentos");
  assert.throws(() => new Product({ ...BASE, categoria: "instrumentos" }), /Categoría no válida/);
});

test("al editar sin mandar categoría se conserva la actual", async () => {
  let guardado;
  const repo = {
    findById: async () => ({ id: 1, proveedor_id: 7, publicado: true, categoria: "Instrumentos" }),
    update: async (id, product) => (guardado = product)
  };
  await new ProductService(repo).updateProduct(1, BASE, 7, "proveedor");
  assert.equal(guardado.categoria, "Instrumentos");
});
