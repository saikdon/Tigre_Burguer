const tableService = require('../services/tableService');

exports.getAll = async (req, res, next) => {
  try {
    const tables = await tableService.getAll();
    res.json(tables);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const table = await tableService.getById(req.params.id);
    res.json(table);
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    await tableService.updateStatus(req.params.id, req.body.status);
    res.json({ message: 'Estado de mesa actualizado' });
  } catch (error) {
    next(error);
  }
};

exports.getStatusCounts = async (req, res, next) => {
  try {
    const counts = await tableService.getStatusCounts();
    res.json(counts);
  } catch (error) {
    next(error);
  }
};
