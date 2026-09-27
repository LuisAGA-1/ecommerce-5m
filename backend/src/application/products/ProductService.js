const Product = require("../../domain/entities/Product");

class ProductService {

  constructor(productRepository) {
    this.productRepository =
      productRepository;
  }

  // =========================================================
  // CREAR PRODUCTO
  // =========================================================
  async createProduct({
    nombre,
    descripcion,
    precio,
    stock,
    imagenUrl,
    proveedorId,
    rol
  }) {

    /*
      Los proveedores crean productos asociados
      a su propia cuenta.

      El administrador también puede crear productos.
      En ese caso no es obligatorio asignar proveedor.
    */

    if (
      rol !== "admin" &&
      !proveedorId
    ) {
      throw new Error(
        "Proveedor no identificado"
      );
    }

    const product = new Product({
      nombre,
      descripcion,
      precio,
      stock,
      imagenUrl
    });

    if (proveedorId) {

      product.proveedorId =
        Number(proveedorId);

    } else {

      product.proveedorId =
        null;
    }

    product.publicado = false;

    return await this.productRepository.create(
      product
    );
  }

  // =========================================================
  // OBTENER TODOS LOS PRODUCTOS
  // =========================================================
  async getProducts() {

    return await this.productRepository.findAll();
  }

  // =========================================================
  // OBTENER PRODUCTOS PUBLICADOS
  // =========================================================
  async getPublishedProducts() {

    return await this.productRepository.findPublished();
  }

  // =========================================================
  // OBTENER MIS PRODUCTOS
  // =========================================================
  async getMyProducts(proveedorId) {

    if (!proveedorId) {
      throw new Error(
        "Proveedor no identificado"
      );
    }

    return await this.productRepository
      .findByProviderId(proveedorId);
  }

  // =========================================================
  // OBTENER PRODUCTO POR ID
  // =========================================================
  async getProductById(id) {

    const product =
      await this.productRepository.findById(id);

    if (!product) {
      throw new Error(
        "Producto no encontrado"
      );
    }

    return product;
  }

  // =========================================================
  // ACTUALIZAR PRODUCTO
  // =========================================================
  async updateProduct(
    id,
    {
      nombre,
      descripcion,
      precio,
      stock,
      imagenUrl
    },
    proveedorId,
    rol
  ) {

    const existingProduct =
      await this.productRepository.findById(id);

    if (!existingProduct) {
      throw new Error(
        "Producto no encontrado"
      );
    }

    /*
      Si es proveedor:
      solamente puede modificar sus propios productos.

      Si es administrador:
      puede modificar cualquier producto.
    */

    if (
      rol !== "admin" &&
      Number(existingProduct.proveedor_id) !==
        Number(proveedorId)
    ) {

      throw new Error(
        "No puedes modificar un producto de otro proveedor"
      );
    }

    const product = new Product({
      id,
      nombre,
      descripcion,
      precio,
      stock,
      imagenUrl
    });

    /*
      Conservamos el proveedor original.
    */

    product.proveedorId =
      existingProduct.proveedor_id;

    /*
      Conservamos el estado de publicación.
    */

    product.publicado =
      existingProduct.publicado;

    return await this.productRepository.update(
      id,
      product
    );
  }

  // =========================================================
  // PUBLICAR PRODUCTO
  // =========================================================
  async publishProduct(
    id,
    proveedorId,
    rol
  ) {

    const existingProduct =
      await this.productRepository.findById(id);

    if (!existingProduct) {
      throw new Error(
        "Producto no encontrado"
      );
    }

    /*
      El proveedor solamente puede publicar
      sus propios productos.

      El administrador puede publicar cualquier producto.
    */

    if (
      rol !== "admin" &&
      Number(existingProduct.proveedor_id) !==
        Number(proveedorId)
    ) {

      throw new Error(
        "No puedes publicar un producto de otro proveedor"
      );
    }

    const product =
      await this.productRepository.publish(
        id,
        rol === "admin"
          ? null
          : proveedorId
      );

    if (!product) {
      throw new Error(
        "No se pudo publicar el producto"
      );
    }

    return product;
  }

  // =========================================================
  // DESPUBLICAR PRODUCTO
  // =========================================================
  async unpublishProduct(
    id,
    proveedorId,
    rol
  ) {

    const existingProduct =
      await this.productRepository.findById(id);

    if (!existingProduct) {
      throw new Error(
        "Producto no encontrado"
      );
    }

    /*
      El proveedor solamente puede despublicar
      sus propios productos.

      El administrador puede despublicar cualquiera.
    */

    if (
      rol !== "admin" &&
      Number(existingProduct.proveedor_id) !==
        Number(proveedorId)
    ) {

      throw new Error(
        "No puedes despublicar un producto de otro proveedor"
      );
    }

    const product =
      await this.productRepository.unpublish(
        id,
        rol === "admin"
          ? null
          : proveedorId
      );

    if (!product) {
      throw new Error(
        "No se pudo despublicar el producto"
      );
    }

    return product;
  }

  // =========================================================
  // ELIMINAR PRODUCTO
  // =========================================================
  async deleteProduct(
    id,
    proveedorId,
    rol
  ) {

    const existingProduct =
      await this.productRepository.findById(id);

    if (!existingProduct) {
      throw new Error(
        "Producto no encontrado"
      );
    }

    /*
      El proveedor solamente puede eliminar
      sus propios productos.

      El administrador puede eliminar cualquiera.
    */

    if (
      rol !== "admin" &&
      Number(existingProduct.proveedor_id) !==
        Number(proveedorId)
    ) {

      throw new Error(
        "No puedes eliminar un producto de otro proveedor"
      );
    }

    await this.productRepository.delete(id);

    return {
      mensaje:
        "Producto eliminado correctamente"
    };
  }
}

module.exports = ProductService;
