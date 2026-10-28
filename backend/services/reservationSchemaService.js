const { pool } = require('../config/database');

const columns = [
  ['customer_name', 'VARCHAR(150) NULL'],
  ['customer_phone', 'VARCHAR(30) NULL'],
  ['payment_preference', "VARCHAR(20) NULL"],
  ['reservation_notes', 'TEXT NULL']
];

async function ensureReservationSchema() {
  for (const [name, definition] of columns) {
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ventas' AND COLUMN_NAME = ?`,
      [name]
    );
    if (!rows.length) {
      await pool.query(`ALTER TABLE ventas ADD COLUMN ${name} ${definition}`);
      console.log(`Columna de reservas creada: ventas.${name}`);
    }
  }
}

module.exports = { ensureReservationSchema };
