const cashRegisterService = require('../services/cashRegisterService');

exports.open = async (req, res, next) => {
  try {
    const register = await cashRegisterService.open(req.user.id, req.body.opening_amount);
    res.status(201).json({ register, message: 'Caja abierta correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.getOpen = async (req, res, next) => {
  try {
    const register = await cashRegisterService.getOpenRegister();
    res.json(register || null);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const register = await cashRegisterService.getById(req.params.id);
    res.json(register);
  } catch (error) {
    next(error);
  }
};

exports.close = async (req, res, next) => {
  try {
    const register = await cashRegisterService.close(
      req.params.id,
      req.user.id,
      req.body.closing_amount
    );
    res.json({ register, message: 'Caja cerrada correctamente' });
  } catch (error) {
    next(error);
  }
};

exports.getSales = async (req, res, next) => {
  try {
    const sales = await cashRegisterService.getSales(req.params.id);
    res.json(sales);
  } catch (error) {
    next(error);
  }
};

exports.getSalesDetails = async (req, res, next) => {
  try {
    const sales = await cashRegisterService.getSalesDetails(req.params.id);
    res.json(sales);
  } catch (error) {
    next(error);
  }
};

exports.getClosingSummary = async (req, res, next) => {
  try {
    const summary = await cashRegisterService.getClosingSummary(req.params.id);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

exports.getSummary = async (req, res, next) => {
  try {
    const summary = await cashRegisterService.getSummary(req.params.id);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

exports.getTodaySummary = async (req, res, next) => {
  try {
    const summary = await cashRegisterService.getTodaySummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
};
