const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', tableController.getAll);
router.get('/status-counts', tableController.getStatusCounts);
router.get('/:id', tableController.getById);
router.put('/:id/status', tableController.updateStatus);

module.exports = router;
