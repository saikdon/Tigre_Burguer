const productService = require('../services/productService');

exports.getAll = async (req, res, next) => {
  try {
    const products = await productService.getAll();
    res.json(products);
  } catch (error) {
    next(error);
  }
};

exports.getActive = async (req, res, next) => {
  try {
    const products = await productService.getActive();
    res.json(products);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const product = await productService.getById(req.params.id);
    res.json(product);
  } catch (error) {
    next(error);
  }
};

exports.getByCategory = async (req, res, next) => {
  try {
    const products = await productService.getByCategory(req.params.categoryId);
    res.json(products);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.image_url = `/uploads/products/${req.file.filename}`;
    }
    const id = await productService.create(data);
    res.status(201).json({ id, message: 'Producto creado correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.image_url = `/uploads/products/${req.file.filename}`;
    }
    await productService.update(req.params.id, data);
    res.json({ message: 'Producto actualizado correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await productService.delete(req.params.id);
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.getTopSelling = async (req, res, next) => {
  try {
    const products = await productService.getTopSelling();
    res.json(products);
  } catch (error) {
    next(error);
  }
};

exports.toggleTopSelling = async (req, res, next) => {
  try {
    const product = await productService.toggleTopSelling(req.params.id);
    res.json(product);
  } catch (error) {
    next(error);
  }
};
