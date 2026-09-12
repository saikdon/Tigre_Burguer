const { pool } = require('../config/database');

class SaleRepository {
  async create(saleData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [saleResult] = await connection.query(
        `INSERT INTO ventas (caja_id, mesa_id, user_id, payment_method_id, sale_type, subtotal, total, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          saleData.caja_id || null,
          saleData.mesa_id || null,
          saleData.user_id,
          saleData.payment_method_id || null,
          saleData.sale_type,
          saleData.subtotal,
          saleData.total,
          saleData.status || 'cerrada'
        ]
      );

      const saleId = saleResult.insertId;

      for (const item of saleData.items) {
        await connection.query(
          `INSERT INTO detalle_ventas (sale_id, product_id, quantity, unit_price, subtotal, notes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [saleId, item.product_id, item.quantity, item.unit_price, item.subtotal, item.notes || null]
        );
      }

      if (saleData.payments && saleData.payments.length > 0) {
        const values = saleData.payments.map(p => [saleId, p.payment_method_id, p.amount]);
        await connection.query(
          'INSERT INTO venta_pagos (sale_id, payment_method_id, amount) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      return saleId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findById(id) {
    const [sales] = await pool.query(
      `SELECT v.*, u.full_name as user_name, mp.name as payment_method_name,
              m.number as mesa_number
       FROM ventas v
       JOIN usuarios u ON v.user_id = u.id
       LEFT JOIN metodos_pago mp ON v.payment_method_id = mp.id
       LEFT JOIN mesas m ON v.mesa_id = m.id
       WHERE v.id = ?`,
      [id]
    );

    if (sales.length === 0) return null;

    const sale = sales[0];

    const [items] = await pool.query(
      `SELECT dv.*, p.name as product_name
       FROM detalle_ventas dv
       JOIN productos p ON dv.product_id = p.id
       WHERE dv.sale_id = ?`,
      [id]
    );

    const [payments] = await pool.query(
      `SELECT vp.*, mp.name as payment_method_name
       FROM venta_pagos vp
       JOIN metodos_pago mp ON vp.payment_method_id = mp.id
       WHERE vp.sale_id = ?`,
      [id]
    );

    sale.items = items;
    sale.payments = payments;
    return sale;
  }

  async findActiveByMesa(mesaId) {
    const [sales] = await pool.query(
      `SELECT v.*, u.full_name as user_name
       FROM ventas v
       JOIN usuarios u ON v.user_id = u.id
       WHERE v.mesa_id = ? AND v.status = 'activa'
       ORDER BY v.created_at DESC LIMIT 1`,
      [mesaId]
    );

    if (sales.length === 0) return null;

    const sale = sales[0];

    const [items] = await pool.query(
      `SELECT dv.*, p.name as product_name
       FROM detalle_ventas dv
       JOIN productos p ON dv.product_id = p.id
       WHERE dv.sale_id = ?`,
      [sale.id]
    );

    sale.items = items;
    return sale;
  }

  async addItem(saleId, item) {
    await pool.query(
      `INSERT INTO detalle_ventas (sale_id, product_id, quantity, unit_price, subtotal, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [saleId, item.product_id, item.quantity, item.unit_price, item.subtotal, item.notes || null]
    );

    await pool.query(
      `UPDATE ventas SET
        subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM detalle_ventas WHERE sale_id = ?),
        total = (SELECT COALESCE(SUM(subtotal), 0) FROM detalle_ventas WHERE sale_id = ?)
       WHERE id = ?`,
      [saleId, saleId, saleId]
    );
  }

  async updateItemQuantity(itemId, quantity) {
    if (quantity <= 0) {
      await pool.query('DELETE FROM detalle_ventas WHERE id = ?', [itemId]);
    } else {
      const [item] = await pool.query('SELECT * FROM detalle_ventas WHERE id = ?', [itemId]);
      if (item.length > 0) {
        const newSubtotal = item[0].unit_price * quantity;
        await pool.query(
          'UPDATE detalle_ventas SET quantity = ?, subtotal = ? WHERE id = ?',
          [quantity, newSubtotal, itemId]
        );
      }
    }
  }

  async removeItem(itemId) {
    const [item] = await pool.query('SELECT sale_id FROM detalle_ventas WHERE id = ?', [itemId]);
    if (item.length > 0) {
      await pool.query('DELETE FROM detalle_ventas WHERE id = ?', [itemId]);
      await pool.query(
        `UPDATE ventas SET
          subtotal = (SELECT COALESCE(SUM(subtotal), 0) FROM detalle_ventas WHERE sale_id = ?),
          total = (SELECT COALESCE(SUM(subtotal), 0) FROM detalle_ventas WHERE sale_id = ?)
         WHERE id = ?`,
        [item[0].sale_id, item[0].sale_id, item[0].sale_id]
      );
    }
  }

  async updateStatus(id, status) {
    await pool.query('UPDATE ventas SET status = ? WHERE id = ?', [status, id]);
  }

  async updatePaymentMethod(id, paymentMethodId) {
    await pool.query('UPDATE ventas SET payment_method_id = ? WHERE id = ?', [paymentMethodId, id]);
  }

  async findByCajaId(cajaId) {
    const [rows] = await pool.query(
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
    return rows;
  }

  async getTodayStats() {
    const [rows] = await pool.query(
      `SELECT
        COUNT(*) as total_sales,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN sale_type = 'llevar' THEN 1 ELSE 0 END), 0) as takeaway_count,
        COALESCE(SUM(CASE WHEN sale_type = 'mesa' THEN 1 ELSE 0 END), 0) as mesa_count,
        COALESCE((SELECT SUM(vp.amount) FROM venta_pagos vp JOIN ventas v2 ON vp.sale_id = v2.id WHERE DATE(v2.created_at) = CURDATE() AND v2.status = 'cerrada' AND vp.payment_method_id = (SELECT id FROM metodos_pago WHERE name = 'Efectivo')), 0) as cash_total,
        COALESCE((SELECT SUM(vp.amount) FROM venta_pagos vp JOIN ventas v2 ON vp.sale_id = v2.id WHERE DATE(v2.created_at) = CURDATE() AND v2.status = 'cerrada' AND vp.payment_method_id = (SELECT id FROM metodos_pago WHERE name = 'QR')), 0) as qr_total
       FROM ventas
       WHERE DATE(created_at) = CURDATE() AND status = 'cerrada'`
    );
    return rows[0];
  }

  async findReservations() {
    const [rows] = await pool.query(
      `SELECT v.*, u.full_name as user_name
       FROM ventas v
       JOIN usuarios u ON v.user_id = u.id
       WHERE v.status = 'reservada'
       ORDER BY v.created_at ASC`
    );

    for (const sale of rows) {
      const [items] = await pool.query(
        `SELECT dv.*, p.name as product_name
         FROM detalle_ventas dv
         JOIN productos p ON dv.product_id = p.id
         WHERE dv.sale_id = ?`,
        [sale.id]
      );
      sale.items = items;
    }
    return rows;
  }

  async cancelReservation(id) {
    await pool.query('UPDATE ventas SET status = "cancelada" WHERE id = ?', [id]);
  }
}

module.exports = new SaleRepository();
