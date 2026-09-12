const categoryService = require('../services/categoryService');

exports.getAll = async (req, res, next) => {
  try {
    const categories = await categoryService.getAll();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

exports.getActive = async (req, res, next) => {
  try {
    const categories = await categoryService.getActive();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const category = await categoryService.getById(req.params.id);
    res.json(category);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const id = await categoryService.create(req.body);
    res.status(201).json({ id, message: 'Categoría creada correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    await categoryService.update(req.params.id, req.body);
    res.json({ message: 'Categoría actualizada correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await categoryService.delete(req.params.id);
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};
