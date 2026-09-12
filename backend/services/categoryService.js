const categoryRepository = require('../repositories/categoryRepository');

class CategoryService {
  async getAll() {
    return categoryRepository.findAll();
  }

  async getActive() {
    return categoryRepository.findActive();
  }

  async getById(id) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw Object.assign(new Error('Categoría no encontrada'), { status: 404 });
    }
    return category;
  }

  async create(data) {
    return categoryRepository.create(data);
  }

  async update(id, data) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw Object.assign(new Error('Categoría no encontrada'), { status: 404 });
    }
    return categoryRepository.update(id, data);
  }

  async delete(id) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw Object.assign(new Error('Categoría no encontrada'), { status: 404 });
    }

    const hasProducts = await categoryRepository.hasProducts(id);
    if (hasProducts) {
      throw Object.assign(new Error('No se puede eliminar: la categoría tiene productos asociados'), { status: 400 });
    }

    return categoryRepository.delete(id);
  }
}

module.exports = new CategoryService();
