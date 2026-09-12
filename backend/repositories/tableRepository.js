const { pool } = require('../config/database');

class TableRepository {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM mesas ORDER BY number ASC');
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM mesas WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async findByNumber(number) {
    const [rows] = await pool.query('SELECT * FROM mesas WHERE number = ?', [number]);
    return rows[0] || null;
  }

  async updateStatus(id, status) {
    await pool.query('UPDATE mesas SET status = ? WHERE id = ?', [status, id]);
  }

  async countByStatus(status) {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM mesas WHERE status = ?', [status]);
    return rows[0].count;
  }
}

module.exports = new TableRepository();
