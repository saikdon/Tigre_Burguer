const mysql = require('mysql2/promise');
require('dotenv').config();

const useTls = process.env.DB_SSL === 'true';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: useTls
    ? {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
      }
    : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功 - MySQL conectado');
    connection.release();
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error.message);
    return false;
  }
};

module.exports = { pool, testConnection };
