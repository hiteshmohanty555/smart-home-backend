require('dotenv').config();
const { pool } = require('./src/config/db');

pool.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP NULL DEFAULT NULL')
  .then(() => {
    console.log('Column added successfully or already exists');
    pool.end();
  })
  .catch(err => {
    console.error('Error adding column:', err.message);
    pool.end();
  });
