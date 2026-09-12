const dashboardService = require('../services/dashboardService');

exports.getSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
};
