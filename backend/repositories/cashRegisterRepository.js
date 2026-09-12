const { pool } = require('../config/database');

class CashRegisterRepository {
  async findOpenByUser(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM cajas WHERE user_id = ? AND status = "abierta" ORDER BY opened_at DESC LIMIT 1',
      [userId]
    );
    return rows[0] || null;
  }

  async findAnyOpen() {
    const [rows] = await pool.query(
      'SELECT c.*, u.full_name FROM cajas c JOIN usuarios u ON c.user_id = u.id WHERE c.status = "abierta" LIMIT 1'
    );
    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT c.*, u.full_name FROM cajas c JOIN usuarios u ON c.user_id = u.id WHERE c.id = ?',
      [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await pool.query(
      'INSERT INTO cajas (user_id, opening_amount, status) VALUES (?, ?, "abierta")',
      [data.user_id, data.opening_amount]
    );
    return result.insertId;
  }

  async close(id, closingData) {
    await pool.query(
      `UPDATE cajas SET
        closing_amount = ?,
        cash_sales = ?,
        qr_sales = ?,
        total_sales = ?,
        order_count = ?,
        status = "cerrada",
        closed_at = NOW()
       WHERE id = ?`,
      [
        closingData.closing_amount,
        closingData.cash_sales,
        closingData.qr_sales,
        closingData.total_sales,
        closingData.order_count,
        id
      ]
    );
  }

  async updateSales(cajaId) {
    await pool.query(
      `UPDATE cajas SET
        cash_sales = (
          SELECT COALESCE(SUM(amount), 0) FROM (
            SELECT vp.amount FROM venta_pagos vp
            JOIN ventas v ON vp.sale_id = v.id
            WHERE v.caja_id = ? AND vp.payment_method_id = (SELECT id FROM metodos_pago WHERE name = 'Efectivo') AND v.status = 'cerrada'
            UNION ALL
            SELECT v.total as amount FROM ventas v
            WHERE v.caja_id = ? AND v.payment_method_id = (SELECT id FROM metodos_pago WHERE name = 'Efectivo') AND v.status = 'cerrada'
            AND v.id NOT IN (SELECT DISTINCT sale_id FROM venta_pagos)
          ) as cash_detail
        ),
        qr_sales = (
          SELECT COALESCE(SUM(amount), 0) FROM (
            SELECT vp.amount FROM venta_pagos vp
            JOIN ventas v ON vp.sale_id = v.id
            WHERE v.caja_id = ? AND vp.payment_method_id = (SELECT id FROM metodos_pago WHERE name = 'QR') AND v.status = 'cerrada'
            UNION ALL
            SELECT v.total as amount FROM ventas v
            WHERE v.caja_id = ? AND v.payment_method_id = (SELECT id FROM metodos_pago WHERE name = 'QR') AND v.status = 'cerrada'
            AND v.id NOT IN (SELECT DISTINCT sale_id FROM venta_pagos)
          ) as qr_detail
        ),
        total_sales = (
          SELECT COALESCE(SUM(total), 0) FROM ventas
          WHERE caja_id = ? AND status = 'cerrada'
        ),
        order_count = (
          SELECT COUNT(*) FROM ventas
          WHERE caja_id = ? AND status = 'cerrada'
        )
       WHERE id = ?`,
      [cajaId, cajaId, cajaId, cajaId, cajaId, cajaId, cajaId]
    );
  }

  async getTodaySummary() {
    const [rows] = await pool.query(
      `SELECT
        COALESCE(COUNT(*), 0) as total_registers,
        COALESCE(SUM(CASE WHEN status = 'abierta' THEN 1 ELSE 0 END), 0) as open_registers,
        COALESCE(SUM(CASE WHEN status = 'cerrada' THEN total_sales ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'cerrada' THEN cash_sales ELSE 0 END), 0) as total_cash,
        COALESCE(SUM(CASE WHEN status = 'cerrada' THEN qr_sales ELSE 0 END), 0) as total_qr,
        COALESCE(SUM(CASE WHEN status = 'cerrada' THEN order_count ELSE 0 END), 0) as total_orders
       FROM cajas WHERE DATE(opened_at) = CURDATE()`
    );
    return rows[0];
  }

  async getSalesWithDetails(cajaId) {
    const [sales] = await pool.query(
      `SELECT v.*, u.full_name as user_name, mp.name as payment_method_name,
              m.number as mesa_number
       FROM ventas v
       JOIN usuarios u ON v.user_id = u.id
       LEFT JOIN metodos_pago mp ON v.payment_method_id = mp.id
       LEFT JOIN mesas m ON v.mesa_id = m.id
       WHERE v.caja_id = ? AND v.status = 'cerrada'
       ORDER BY v.created_at DESC`,
      [cajaId]
    );

    for (const sale of sales) {
      const [items] = await pool.query(
        `SELECT dv.*, p.name as product_name
         FROM detalle_ventas dv
         JOIN productos p ON dv.product_id = p.id
         WHERE dv.sale_id = ?`,
        [sale.id]
      );
      const [payments] = await pool.query(
        `SELECT vp.*, mp.name as payment_method_name
         FROM venta_pagos vp
         JOIN metodos_pago mp ON vp.payment_method_id = mp.id
         WHERE vp.sale_id = ?`,
        [sale.id]
      );
      sale.items = items;
      sale.payments = payments;
    }
    return sales;
  }

  async getProductSummary(cajaId) {
    const [rows] = await pool.query(
      `SELECT p.name as product_name, SUM(dv.quantity) as total_quantity, SUM(dv.subtotal) as total_revenue
       FROM detalle_ventas dv
       JOIN productos p ON dv.product_id = p.id
       JOIN ventas v ON dv.sale_id = v.id
       WHERE v.caja_id = ? AND v.status = 'cerrada'
       GROUP BY p.id, p.name
       ORDER BY total_quantity DESC`,
      [cajaId]
    );
    return rows;
  }

  async getClosedToday() {
    const [rows] = await pool.query(
      `SELECT c.*, u.full_name
       FROM cajas c
       JOIN usuarios u ON c.user_id = u.id
       WHERE DATE(c.opened_at) = CURDATE() AND c.status = 'cerrada'
       ORDER BY c.closed_at DESC`
    );
    return rows;
  }
}

module.exports = new CashRegisterRepository();
