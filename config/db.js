// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
  // 🚀 Render / 线上环境（用 Railway）
  pool = mysql.createPool(process.env.DATABASE_URL);
} else {
  // 💻 本地环境（用 localhost）
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'profocus',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

// 测试连接（可以保留）
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (err) {
    console.error('Database connection error:', err);
  }
})();

module.exports = pool;