const reportService = require('../services/reportService');

exports.getDailyReport = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const report = await reportService.getDailyReport(date);
    res.json(report);
  } catch (error) {
    next(error);
  }
};

exports.getTopProducts = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const limit = parseInt(req.query.limit) || 10;
    const products = await reportService.getTopProducts(date, limit);
    res.json(products);
  } catch (error) {
    next(error);
  }
};

exports.getPeriodReport = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'start_date y end_date son requeridos' });
    }
    const report = await reportService.getPeriodReport(start_date, end_date);
    res.json(report);
  } catch (error) {
    next(error);
  }
};
