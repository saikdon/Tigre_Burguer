const { pool } = require('../config/database');

class PaymentRepository {
  async createBulk(saleId, payments) {
    if (!payments || payments.length === 0) return;
    const values = payments.map(p => [saleId, p.payment_method_id, p.amount]);
    await pool.query(
      'INSERT INTO venta_pagos (sale_id, payment_method_id, amount) VALUES ?',
      [values]
    );
  }

  async findBySaleId(saleId) {
    const [rows] = await pool.query(
      `SELECT vp.*, mp.name as payment_method_name
       FROM venta_pagos vp
       JOIN metodos_pago mp ON vp.payment_method_id = mp.id
       WHERE vp.sale_id = ?
       ORDER BY vp.id ASC`,
      [saleId]
    );
    return rows;
  }

  async deleteBySaleId(saleId) {
    await pool.query('DELETE FROM venta_pagos WHERE sale_id = ?', [saleId]);
  }
}

module.exports = new PaymentRepository();
