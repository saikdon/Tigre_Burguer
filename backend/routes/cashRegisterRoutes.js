const express = require('express');
const router = express.Router();
const cashRegisterController = require('../controllers/cashRegisterController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../validations/validate');

router.use(authenticate);

router.get('/open', cashRegisterController.getOpen);
router.get('/today', cashRegisterController.getTodaySummary);

router.post('/open', [
  body('opening_amount').isFloat({ min: 0 }).withMessage('Monto inicial requerido'),
  validate
], cashRegisterController.open);

router.get('/:id', cashRegisterController.getById);
router.get('/:id/sales', cashRegisterController.getSales);
router.get('/:id/sales-details', cashRegisterController.getSalesDetails);
router.get('/:id/closing-summary', cashRegisterController.getClosingSummary);
router.get('/:id/summary', cashRegisterController.getSummary);

router.post('/:id/close', [
  body('closing_amount').isFloat({ min: 0 }).withMessage('Monto de cierre requerido'),
  validate
], cashRegisterController.close);

module.exports = router;
