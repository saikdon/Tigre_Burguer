const { pool } = require('../config/database');

class ProductRepository {
  async findAll() {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM productos p
       JOIN categorias c ON p.category_id = c.id
       ORDER BY p.name ASC`
    );
    return rows;
  }

  async findActive() {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM productos p
       JOIN categorias c ON p.category_id = c.id
       WHERE p.status = 'activo'
       ORDER BY p.name ASC`
    );
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM productos p
       JOIN categorias c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findByCategory(categoryId) {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM productos p
       JOIN categorias c ON p.category_id = c.id
       WHERE p.category_id = ? AND p.status = 'activo'
       ORDER BY p.name ASC`,
      [categoryId]
    );
    return rows;
  }

  async findActiveByIds(ids) {
    if (!ids.length) return [];
    const [rows] = await pool.query(
      `SELECT id, name, price, status FROM productos
       WHERE id IN (?) AND status = 'activo'`,
      [ids]
    );
    return rows;
  }

  async create(data) {
    const [result] = await pool.query(
      'INSERT INTO productos (name, description, image_url, category_id, price, status) VALUES (?, ?, ?, ?, ?, ?)',
      [data.name, data.description || null, data.image_url || null, data.category_id, data.price, data.status || 'activo']
    );
    return result.insertId;
  }

  async update(id, data) {
    const fields = [];
    const values = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.image_url !== undefined) { fields.push('image_url = ?'); values.push(data.image_url); }
    if (data.category_id !== undefined) { fields.push('category_id = ?'); values.push(data.category_id); }
    if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }

    if (fields.length === 0) return false;

    values.push(id);
    await pool.query(`UPDATE productos SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  async delete(id) {
    await pool.query('DELETE FROM productos WHERE id = ?', [id]);
  }

  async findTopSelling() {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM productos p
       JOIN categorias c ON p.category_id = c.id
       WHERE p.is_top_selling = 1 AND p.status = 'activo'
       ORDER BY p.name ASC`
    );
    return rows;
  }

  async toggleTopSelling(id) {
    await pool.query(
      'UPDATE productos SET is_top_selling = NOT is_top_selling WHERE id = ?',
      [id]
    );
    return this.findById(id);
  }
}

module.exports = new ProductRepository();
