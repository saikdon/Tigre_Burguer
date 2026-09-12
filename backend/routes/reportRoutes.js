const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/daily', reportController.getDailyReport);
router.get('/top-products', reportController.getTopProducts);
router.get('/period', reportController.getPeriodReport);

module.exports = router;
