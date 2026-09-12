const express = require('express');
const router = express.Router();
const whatsappController = require('./whatsappController');
const { authenticate } = require('../middleware/auth');

router.get('/status', whatsappController.getStatus);
router.get('/messages', authenticate, whatsappController.getMessages);
router.get('/groups', authenticate, whatsappController.getGroups);
router.get('/messages/group/:jid', authenticate, whatsappController.getMessagesByGroup);
router.put('/messages/:id/order', authenticate, whatsappController.markAsOrder);
router.post('/logout', authenticate, whatsappController.logout);
router.post('/cancel', authenticate, whatsappController.cancel);

module.exports = router;
