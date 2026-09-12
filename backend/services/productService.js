const productRepository = require('../repositories/productRepository');

class ProductService {
  async getAll() {
    return productRepository.findAll();
  }

  async getActive() {
    return productRepository.findActive();
  }

  async getById(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
    }
    return product;
  }

  async getByCategory(categoryId) {
    return productRepository.findByCategory(categoryId);
  }

  async create(data) {
    return productRepository.create(data);
  }

  async update(id, data) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
    }
    return productRepository.update(id, data);
  }

  async delete(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
    }
    return productRepository.delete(id);
  }

  async getTopSelling() {
    return productRepository.findTopSelling();
  }

  async toggleTopSelling(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
    }
    return productRepository.toggleTopSelling(id);
  }
}

module.exports = new ProductService();
