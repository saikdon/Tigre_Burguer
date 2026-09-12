const { pool } = require('../config/database');
const {
  getConnectionStatus,
  getQrCode,
  logout,
  cancelReconnect
} = require('./baileysClient');

exports.getStatus = async (req, res, next) => {
  try {
    const status = getConnectionStatus();
    const qr = getQrCode();
    res.json({ status, qr });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { limit = 50, before } = req.query;
    let query = 'SELECT * FROM whatsapp_messages';
    const params = [];

    if (before) {
      query += ' WHERE created_at < ?';
      params.push(before);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [rows] = await pool.query(query, params);
    res.json(rows.reverse());
  } catch (error) {
    next(error);
  }
};

exports.getMessagesByGroup = async (req, res, next) => {
  try {
    const { jid } = req.params;
    const { limit = 50 } = req.query;

    const [rows] = await pool.query(
      'SELECT * FROM whatsapp_messages WHERE remote_jid = ? ORDER BY created_at DESC LIMIT ?',
      [jid, parseInt(limit)]
    );
    res.json(rows.reverse());
  } catch (error) {
    next(error);
  }
};

exports.getGroups = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT remote_jid, COUNT(*) as message_count,
              MIN(sender_name) as first_sender,
              MAX(created_at) as last_message_at
       FROM whatsapp_messages
       WHERE remote_jid LIKE '%@g.us'
       GROUP BY remote_jid
       ORDER BY last_message_at DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

exports.markAsOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE whatsapp_messages SET is_order = TRUE WHERE id = ?', [id]);
    res.json({ message: 'Marcado como pedido' });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await logout();
    res.json({ message: 'Desconectado de WhatsApp' });
  } catch (error) {
    next(error);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    cancelReconnect();
    res.json({ message: 'Reconexion cancelada' });
  } catch (error) {
    next(error);
  }
};
