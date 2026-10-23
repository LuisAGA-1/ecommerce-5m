// Si cambias la lista, cámbiala también en frontend/src/components/ProductForm.jsx
const CATEGORIAS = [
  "Laptops",
  "Computadoras",
  "Monitores",
  "Celulares",
  "Tablets",
  "Audio",
  "Accesorios",
  "Componentes",
  "Otros"
];

class Product {

  constructor({
    id = null,
    nombre,
    descripcion = "",
    precio,
    stock = 0,
    imagenUrl = "",
    categoria = "Otros"
  }) {

    if (
      !nombre ||
      nombre.trim() === ""
    ) {
      throw new Error(
        "El nombre del producto es obligatorio"
      );
    }

    if (
      precio === undefined ||
      precio === null ||
      Number(precio) <= 0
    ) {
      throw new Error(
        "El precio debe ser mayor que 0"
      );
    }

    if (
      !Number.isInteger(Number(stock)) ||
      Number(stock) < 0
    ) {
      throw new Error(
        "El stock debe ser un número entero mayor o igual a 0"
      );
    }

    if (!CATEGORIAS.includes(categoria)) {
      throw new Error(
        "Categoría no válida"
      );
    }

    this.id = id;

    this.nombre =
      nombre.trim();

    this.descripcion =
      descripcion
        ? descripcion.trim()
        : "";

    this.precio =
      Number(precio);

    this.stock =
      Number(stock);

    this.imagenUrl =
      imagenUrl
        ? imagenUrl.trim()
        : "";

    this.categoria =
      categoria;
  }
}

Product.CATEGORIAS = CATEGORIAS;

module.exports = Product;
