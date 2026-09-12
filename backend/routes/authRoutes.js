const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { body } = require('express-validator');
const { validate } = require('../validations/validate');

router.post('/login', [
  body('username').notEmpty().withMessage('El usuario es requerido'),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
  validate
], authController.login);

router.get('/profile', authenticate, authController.getProfile);

router.get('/users', authenticate, authorize('admin'), authController.getAllUsers);

router.post('/users', authenticate, authorize('admin'), [
  body('username').notEmpty().isLength({ min: 3, max: 50 }).withMessage('Usuario requerido (3-50 caracteres)'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña requerida (mínimo 6 caracteres)'),
  body('full_name').notEmpty().withMessage('Nombre completo requerido'),
  body('role_id').isInt().withMessage('Rol requerido'),
  validate
], authController.createUser);

router.put('/users/:id', authenticate, authorize('admin'), authController.updateUser);

router.delete('/users/:id', authenticate, authorize('admin'), authController.deleteUser);

module.exports = router;
