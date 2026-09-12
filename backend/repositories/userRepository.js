const { pool } = require('../config/database');

class UserRepository {
  async findByUsername(username) {
    const [rows] = await pool.query(
      'SELECT u.*, r.name as role_name FROM usuarios u JOIN roles r ON u.role_id = r.id WHERE u.username = ?',
      [username]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT u.id, u.username, u.full_name, u.role_id, r.name as role_name, u.status FROM usuarios u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [id]
    );
    return rows[0] || null;
  }

  async findAll() {
    const [rows] = await pool.query(
      'SELECT u.id, u.username, u.full_name, r.name as role_name, u.status, u.created_at FROM usuarios u JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC'
    );
    return rows;
  }

  async create(userData) {
    const [result] = await pool.query(
      'INSERT INTO usuarios (username, password, full_name, role_id, status) VALUES (?, ?, ?, ?, ?)',
      [userData.username, userData.password, userData.full_name, userData.role_id, userData.status || 'activo']
    );
    return result.insertId;
  }

  async update(id, userData) {
    const fields = [];
    const values = [];

    if (userData.full_name !== undefined) { fields.push('full_name = ?'); values.push(userData.full_name); }
    if (userData.role_id !== undefined) { fields.push('role_id = ?'); values.push(userData.role_id); }
    if (userData.status !== undefined) { fields.push('status = ?'); values.push(userData.status); }
    if (userData.password !== undefined) { fields.push('password = ?'); values.push(userData.password); }

    if (fields.length === 0) return false;

    values.push(id);
    await pool.query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  async delete(id) {
    await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
  }
}

module.exports = new UserRepository();
