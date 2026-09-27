class ProductController {

  constructor(productService) {
    this.productService = productService;
  }

  async create(req, res) {
    try {
      const product =
        await this.productService.createProduct({
          ...req.body,
          proveedorId:
            req.usuario.rol === "proveedor"
              ? req.usuario.id
              : null,
          rol: req.usuario.rol
        });

      res.status(201).json(product);

    } catch (error) {

      if (
        error.message === "El nombre del producto es obligatorio" ||
        error.message === "El precio debe ser mayor que 0" ||
        error.message ===
          "El stock debe ser un número entero mayor o igual a 0" ||
        error.message === "Proveedor no identificado"
      ) {
        return res.status(400).json({
          mensaje: error.message
        });
      }

      console.error(error);

      res.status(500).json({
        mensaje: "Error del servidor"
      });
    }
  }

  async getAll(req, res) {
    try {
      const products =
        await this.productService.getProducts();

      res.json(products);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        mensaje: "Error del servidor"
      });
    }
  }

  async getPublished(req, res) {
    try {
      const products =
        await this.productService.getPublishedProducts();

      res.json(products);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        mensaje: "Error del servidor"
      });
    }
  }

  async getMine(req, res) {
    try {
      const products =
        await this.productService.getMyProducts(
          req.usuario.id
        );

      res.json(products);

    } catch (error) {

      if (
        error.message === "Proveedor no identificado"
      ) {
        return res.status(400).json({
          mensaje: error.message
        });
      }

      console.error(error);

      res.status(500).json({
        mensaje: "Error del servidor"
      });
    }
  }

  async getById(req, res) {
    try {
      const product =
        await this.productService.getProductById(
          req.params.id
        );

      res.json(product);

    } catch (error) {

      if (
        error.message === "Producto no encontrado"
      ) {
        return res.status(404).json({
          mensaje: error.message
        });
      }

      console.error(error);

      res.status(500).json({
        mensaje: "Error del servidor"
      });
    }
  }

  async update(req, res) {
    try {
      const product =
        await this.productService.updateProduct(
          req.params.id,
          req.body,
          req.usuario.id,
          req.usuario.rol
        );

      res.json(product);

    } catch (error) {

      if (
        error.message ===
          "El nombre del producto es obligatorio" ||
        error.message ===
          "El precio debe ser mayor que 0" ||
        error.message ===
          "El stock debe ser un número entero mayor o igual a 0"
      ) {
        return res.status(400).json({
          mensaje: error.message
        });
      }

      if (
        error.message ===
        "Producto no encontrado"
      ) {
        return res.status(404).json({
          mensaje: error.message
        });
      }

      if (
        error.message ===
        "No puedes modificar un producto de otro proveedor"
      ) {
        return res.status(403).json({
          mensaje: error.message
        });
      }

      console.error(error);

      res.status(500).json({
        mensaje: "Error del servidor"
      });
    }
  }

  async publish(req, res) {
    try {
      const product =
        await this.productService.publishProduct(
          req.params.id,
          req.usuario.id,
          req.usuario.rol
        );

      res.json(product);

    } catch (error) {

      if (
        error.message ===
        "Producto no encontrado"
      ) {
        return res.status(404).json({
          mensaje: error.message
        });
      }

      if (
        error.message ===
        "No puedes publicar un producto de otro proveedor"
      ) {
        return res.status(403).json({
          mensaje: error.message
        });
      }

      console.error(error);

      res.status(500).json({
        mensaje: "Error del servidor"
      });
    }
  }

  async unpublish(req, res) {
    try {
      const product =
        await this.productService.unpublishProduct(
          req.params.id,
          req.usuario.id,
          req.usuario.rol
        );

      res.json(product);

    } catch (error) {

      if (
        error.message ===
        "Producto no encontrado"
      ) {
        return res.status(404).json({
          mensaje: error.message
        });
      }

      if (
        error.message ===
        "No puedes despublicar un producto de otro proveedor"
      ) {
        return res.status(403).json({
          mensaje: error.message
        });
      }

      console.error(error);

      res.status(500).json({
        mensaje: "Error del servidor"
      });
    }
  }

  async delete(req, res) {
    try {
      const result =
        await this.productService.deleteProduct(
          req.params.id,
          req.usuario.id,
          req.usuario.rol
        );

      res.json(result);

    } catch (error) {

      if (
        error.message ===
        "Producto no encontrado"
      ) {
        return res.status(404).json({
          mensaje: error.message
        });
      }

      if (
        error.message ===
        "No puedes eliminar un producto de otro proveedor"
      ) {
        return res.status(403).json({
          mensaje: error.message
        });
      }

      console.error(error);

      res.status(500).json({
        mensaje: "Error del servidor"
      });
    }
  }
}

module.exports = ProductController;
