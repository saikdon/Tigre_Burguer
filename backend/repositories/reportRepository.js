const { pool } = require('../config/database');

class ReportRepository {
  async getSalesByDate(date) {
    const [rows] = await pool.query(
      `SELECT v.*, u.full_name as user_name, mp.name as payment_method_name,
              m.number as mesa_number
       FROM ventas v
       JOIN usuarios u ON v.user_id = u.id
       JOIN metodos_pago mp ON v.payment_method_id = mp.id
       LEFT JOIN mesas m ON v.mesa_id = m.id
       WHERE DATE(v.created_at) = ? AND v.status = 'cerrada'
       ORDER BY v.created_at DESC`,
      [date]
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

  async getDailyStats(date) {
    const [rows] = await pool.query(
      `SELECT
        COUNT(*) as total_sales,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN sale_type = 'llevar' THEN 1 ELSE 0 END), 0) as takeaway_count,
        COALESCE(SUM(CASE WHEN sale_type = 'mesa' THEN 1 ELSE 0 END), 0) as mesa_count
       FROM ventas
       WHERE DATE(created_at) = ? AND status = 'cerrada'`,
      [date]
    );

    const totals = await this._getPaymentTotals(date, date);
    rows[0].cash_total = totals.cash;
    rows[0].qr_total = totals.qr;
    return rows[0];
  }

  async getTopProducts(date, limit = 10) {
    const [rows] = await pool.query(
      `SELECT p.name as product_name, SUM(dv.quantity) as total_quantity, SUM(dv.subtotal) as total_revenue
       FROM detalle_ventas dv
       JOIN productos p ON dv.product_id = p.id
       JOIN ventas v ON dv.sale_id = v.id
       WHERE DATE(v.created_at) = ? AND v.status = 'cerrada'
       GROUP BY p.id, p.name
       ORDER BY total_quantity DESC
       LIMIT ?`,
      [date, limit]
    );
    return rows;
  }

  async getSalesSummaryByPeriod(startDate, endDate) {
    const [rows] = await pool.query(
      `SELECT
        DATE(v.created_at) as date,
        COUNT(*) as total_sales,
        COALESCE(SUM(v.total), 0) as total_revenue
       FROM ventas v
       WHERE DATE(v.created_at) BETWEEN ? AND ? AND v.status = 'cerrada'
       GROUP BY DATE(v.created_at)
       ORDER BY date DESC`,
      [startDate, endDate]
    );

    const [methods] = await pool.query('SELECT id, name FROM metodos_pago');
    const cashId = methods.find(m => m.name === 'Efectivo')?.id || null;
    const qrId = methods.find(m => m.name === 'QR')?.id || null;

    const [payments] = await pool.query(
      `SELECT DATE(v.created_at) as date, vp.payment_method_id as pm_id, SUM(vp.amount) as amount
       FROM venta_pagos vp
       JOIN ventas v ON vp.sale_id = v.id
       WHERE DATE(v.created_at) BETWEEN ? AND ? AND v.status = 'cerrada'
       GROUP BY DATE(v.created_at), vp.payment_method_id
       UNION ALL
       SELECT DATE(v.created_at), v.payment_method_id, SUM(v.total)
       FROM ventas v
       WHERE DATE(v.created_at) BETWEEN ? AND ? AND v.status = 'cerrada'
         AND v.id NOT IN (SELECT DISTINCT sale_id FROM venta_pagos)
       GROUP BY DATE(v.created_at), v.payment_method_id`,
      [startDate, endDate, startDate, endDate]
    );

    const payMap = {};
    for (const p of payments) {
      const key = p.date instanceof Date ? p.date.toISOString().split('T')[0] : String(p.date).split('T')[0];
      if (!payMap[key]) payMap[key] = { cash: 0, qr: 0 };
      if (p.pm_id === cashId) payMap[key].cash += Number(p.amount);
      if (p.pm_id === qrId) payMap[key].qr += Number(p.amount);
    }

    return rows.map(row => {
      const key = row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date).split('T')[0];
      return {
        date: key,
        total_sales: row.total_sales,
        total_revenue: row.total_revenue,
        cash_total: (payMap[key]?.cash || 0),
        qr_total: (payMap[key]?.qr || 0)
      };
    });
  }

  async _getPaymentTotals(startDate, endDate) {
    const [methods] = await pool.query('SELECT id, name FROM metodos_pago');
    const cashId = methods.find(m => m.name === 'Efectivo')?.id || null;
    const qrId = methods.find(m => m.name === 'QR')?.id || null;

    const [payments] = await pool.query(
      `SELECT vp.payment_method_id as pm_id, SUM(vp.amount) as amount
       FROM venta_pagos vp
       JOIN ventas v ON vp.sale_id = v.id
       WHERE DATE(v.created_at) BETWEEN ? AND ? AND v.status = 'cerrada'
       GROUP BY vp.payment_method_id
       UNION ALL
       SELECT v.payment_method_id, SUM(v.total)
       FROM ventas v
       WHERE DATE(v.created_at) BETWEEN ? AND ? AND v.status = 'cerrada'
         AND v.id NOT IN (SELECT DISTINCT sale_id FROM venta_pagos)
       GROUP BY v.payment_method_id`,
      [startDate, endDate, startDate, endDate]
    );

    let cash = 0, qr = 0;
    for (const p of payments) {
      if (p.pm_id === cashId) cash += Number(p.amount);
      if (p.pm_id === qrId) qr += Number(p.amount);
    }
    return { cash, qr };
  }
}

module.exports = new ReportRepository();
