const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { body } = require('express-validator');
const { validate } = require('../validations/validate');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', productController.getAll);
router.get('/active', productController.getActive);
router.get('/top-selling', productController.getTopSelling);
router.get('/category/:categoryId', productController.getByCategory);
router.get('/:id', productController.getById);

router.post('/', authorize('admin'), upload.single('image'), [
  body('name').notEmpty().withMessage('Nombre del producto requerido'),
  body('category_id').isInt().withMessage('Categoría requerida'),
  body('price').isFloat({ min: 0 }).withMessage('Precio requerido (mayor a 0)'),
  validate
], productController.create);

router.put('/:id/top-selling', authorize('admin'), productController.toggleTopSelling);
router.put('/:id', authorize('admin'), upload.single('image'), productController.update);
router.delete('/:id', authorize('admin'), productController.delete);

module.exports = router;
