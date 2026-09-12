const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../validations/validate');

router.use(authenticate);

router.get('/today-stats', saleController.getTodayStats);
router.get('/reservations', saleController.getReservations);

router.post('/reservation', [
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
  body('items.*.product_id').isInt().withMessage('ID de producto requerido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Cantidad requerida'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Precio unitario requerido'),
  validate
], saleController.createReservation);

router.post('/reservation/:id/fulfill', [
  body().custom((body) => {
    if (!body.payment_method && (!body.payments || !Array.isArray(body.payments) || body.payments.length === 0)) {
      throw new Error('Metodo de pago o pagos requeridos');
    }
    return true;
  }),
  validate
], saleController.fulfillReservation);

router.post('/reservation/:id/cancel', saleController.cancelReservation);

router.post('/takeaway', [
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
  body('items.*.product_id').isInt().withMessage('ID de producto requerido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Cantidad requerida'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Precio unitario requerido'),
  body().custom((body) => {
    if (!body.payment_method && (!body.payments || !Array.isArray(body.payments) || body.payments.length === 0)) {
      throw new Error('Metodo de pago o pagos requeridos');
    }
    return true;
  }),
  validate
], saleController.createTakeaway);

router.post('/mesa', [
  body('mesa_id').isInt().withMessage('ID de mesa requerido'),
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
  body('items.*.product_id').isInt().withMessage('ID de producto requerido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Cantidad requerida'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Precio unitario requerido'),
  validate
], saleController.openMesa);

router.get('/mesa/:mesaId/active', saleController.getActiveByMesa);
router.get('/:id', saleController.getById);

router.post('/:id/items', [
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
  body('items.*.product_id').isInt().withMessage('ID de producto requerido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Cantidad requerida'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Precio unitario requerido'),
  validate
], saleController.addToMesaSale);

router.put('/items/:itemId/quantity', saleController.updateItemQuantity);
router.delete('/items/:itemId', saleController.removeItem);

router.post('/:id/close', [
  body().custom((body) => {
    if (!body.payment_method && (!body.payments || !Array.isArray(body.payments) || body.payments.length === 0)) {
      throw new Error('Metodo de pago o pagos requeridos');
    }
    return true;
  }),
  validate
], saleController.closeMesaSale);

module.exports = router;
