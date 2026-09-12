const { pool } = require('../config/database');

class CategoryRepository {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM categorias ORDER BY name ASC');
    return rows;
  }

  async findActive() {
    const [rows] = await pool.query('SELECT * FROM categorias WHERE status = "activo" ORDER BY name ASC');
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM categorias WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await pool.query(
      'INSERT INTO categorias (name, description, icon, status) VALUES (?, ?, ?, ?)',
      [data.name, data.description || null, data.icon || null, data.status || 'activo']
    );
    return result.insertId;
  }

  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.icon !== undefined) { fields.push('icon = ?'); values.push(data.icon); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }

    if (fields.length === 0) return false;

    values.push(id);
    await pool.query(`UPDATE categorias SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  async delete(id) {
    await pool.query('DELETE FROM categorias WHERE id = ?', [id]);
  }

  async hasProducts(id) {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM productos WHERE category_id = ?', [id]);
    return rows[0].count > 0;
  }
}

module.exports = new CategoryRepository();
