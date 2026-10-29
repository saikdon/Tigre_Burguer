const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../validations/validate');
const publicController = require('../controllers/publicController');

const router = express.Router();

router.get('/catalog', publicController.getCatalog);

router.post('/reservations', [
  body('customer_name').trim().isLength({ min: 2, max: 150 }).withMessage('Ingresa tu nombre completo'),
  body('customer_phone').trim().matches(/^(?:\+?591[\s-]?)?[67]\d{7}$/).withMessage('Ingresa un celular boliviano válido'),
  body('payment_preference').isIn(['QR', 'Efectivo']).withMessage('Elige QR o efectivo'),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('La nota no puede superar 500 caracteres'),
  body('items').isArray({ min: 1, max: 30 }).withMessage('Agrega al menos un producto'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('Producto inválido'),
  body('items.*.quantity').isInt({ min: 1, max: 20 }).withMessage('Cantidad inválida'),
  body('items.*.customizations').optional().isObject().withMessage('Personalización inválida'),
  body('items.*.customizations.sauces').optional().isArray({ max: 4 }).withMessage('Aderezos inválidos'),
  body('items.*.customizations.sauces.*').optional().isIn(['Ketchup', 'Mayonesa', 'Mostaza', 'Llajua']).withMessage('Aderezo inválido'),
  body('items.*.customizations.salad').optional().isArray({ max: 2 }).withMessage('Ensalada inválida'),
  body('items.*.customizations.salad.*').optional().isIn(['Cebolla', 'Tomate']).withMessage('Ingrediente de ensalada inválido'),
  validate
], publicController.createReservation);

module.exports = router;
