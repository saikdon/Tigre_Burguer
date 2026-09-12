const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('baileys');
const { detectOrder } = require('./orderDetector');

const handleMessage = async (sock, msg, io) => {
  try {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const isPrivateChat = from.endsWith('@s.whatsapp.net');

    let senderName = '';
    let senderPhone = '';

    if (isGroup) {
      const groupMeta = await sock.groupMetadata(from);
      const senderId = msg.key.participant || from;
      senderPhone = senderId.replace(/@.+/, '');

      const pushName = msg.pushName || '';
      const groupMember = groupMeta.participants?.find(
        (p) => p.id === senderId
      );
      senderName = pushName || senderPhone;
    } else {
      senderPhone = from.replace(/@.+/, '');
      senderName = msg.pushName || senderPhone;
    }

    let messageText = '';
    let messageType = 'text';
    let mediaUrl = null;

    if (msg.message?.conversation) {
      messageText = msg.message.conversation;
    } else if (msg.message?.extendedTextMessage?.text) {
      messageText = msg.message.extendedTextMessage.text;
    } else if (msg.message?.imageMessage) {
      messageType = 'image';
      messageText = msg.message.imageMessage.caption || '';
      mediaUrl = await downloadMedia(msg.message.imageMessage, sock, msg.key.id);
    } else if (msg.message?.audioMessage) {
      messageType = 'audio';
      mediaUrl = await downloadMedia(msg.message.audioMessage, sock, msg.key.id);
    } else if (msg.message?.documentMessage) {
      messageType = 'document';
      messageText = msg.message.documentMessage.fileName || '';
      mediaUrl = await downloadMedia(msg.message.documentMessage, sock, msg.key.id);
    } else if (msg.message?.videoMessage) {
      messageType = 'video';
      messageText = msg.message.videoMessage.caption || '';
      mediaUrl = await downloadMedia(msg.message.videoMessage, sock, msg.key.id);
    }

    if (!messageText && messageType === 'text') return;

    const messageId = msg.key.id;
    const existing = await pool.query(
      'SELECT id FROM whatsapp_messages WHERE message_id = ?',
      [messageId]
    );
    if (existing[0].length > 0) return;

    const [result] = await pool.query(
      `INSERT INTO whatsapp_messages (remote_jid, message_id, sender_name, sender_phone, message_text, message_type, media_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [from, messageId, senderName, senderPhone, messageText, messageType, mediaUrl]
    );

    const savedMessage = {
      id: result.insertId,
      remote_jid: from,
      message_id: messageId,
      sender_name: senderName,
      sender_phone: senderPhone,
      message_text: messageText,
      message_type: messageType,
      media_url: mediaUrl,
      is_order: false,
      created_at: new Date().toISOString()
    };

    io.emit('whatsapp:nuevo-mensaje', savedMessage);

    const detection = detectOrder(messageText);
    if (detection.isOrder) {
      await pool.query('UPDATE whatsapp_messages SET is_order = TRUE WHERE id = ?', [result.insertId]);
      savedMessage.is_order = true;
      io.emit('whatsapp:pedido-detectado', {
        id: result.insertId,
        sender_name: senderName,
        sender_phone: senderPhone,
        message_text: messageText,
        remote_jid: from,
        created_at: savedMessage.created_at
      });
      console.log(`[WhatsApp - PEDIDO DETECTADO] ${senderName}: ${messageText}`);
    }

    if (isGroup) {
      console.log(`[WhatsApp - GRUPO] ${senderName}: ${messageText}`);
    } else {
      console.log(`[WhatsApp - PRIVADO] ${senderName}: ${messageText}`);
    }

  } catch (error) {
    console.error('Error procesando mensaje de WhatsApp:', error);
  }
};

const downloadMedia = async (mediaMsg, sock, msgId) => {
  try {
    const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {}, { logger });
    if (!buffer) return null;

    const ext = mediaMsg.mimetype?.split('/')[1] || 'bin';
    const filename = `whatsapp_${msgId}.${ext}`;
    const uploadDir = path.join(__dirname, '../uploads/whatsapp');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    require('fs').writeFileSync(filePath, buffer);

    return `/uploads/whatsapp/${filename}`;
  } catch (error) {
    console.error('Error descargando media:', error);
    return null;
  }
};

module.exports = { handleMessage };
