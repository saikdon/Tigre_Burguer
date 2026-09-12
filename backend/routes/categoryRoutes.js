const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { body } = require('express-validator');
const { validate } = require('../validations/validate');

router.use(authenticate);

router.get('/', categoryController.getAll);
router.get('/active', categoryController.getActive);
router.get('/:id', categoryController.getById);

router.post('/', authorize('admin'), [
  body('name').notEmpty().withMessage('Nombre de categoría requerido'),
  validate
], categoryController.create);

router.put('/:id', authorize('admin'), categoryController.update);
router.delete('/:id', authorize('admin'), categoryController.delete);

module.exports = router;
