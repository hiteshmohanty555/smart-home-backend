cssonst { Pool } = require("pg");

// Supabase PostgreSQL Pool - using direct database URL with proper encoding
const pool = new Pool({
  connectionString: "postgresql://postgres:Bapun%4012345@db.ynqyvtqrstziyhklhcvo.supabase.co:5432/postgres?sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTables() {
  try {
    // Test connection first
    const test = await pool.query('SELECT NOW()');
    console.log("✅ Connected to PostgreSQL:", test.rows[0].now);

    // Create devices table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        esp_id VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'OFF',
        speed INTEGER DEFAULT 0,
        last_heartbeat TIMESTAMP DEFAULT NULL
      )
    `);
    console.log("✅ Devices table created successfully");

    // Create otps table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        otp VARCHAR(10),
        expires_at TIMESTAMP
      )
    `);
    console.log("✅ OTPs table created successfully");

    // Create indexes for better performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_devices_esp_id ON devices(esp_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_otps_user_id ON otps(user_id)`);
    console.log("✅ Indexes created successfully");

    // Show all tables
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables in database:", result.rows.map(r => r.table_name));

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating tables:", err.message);
    await pool.end();
    process.exit(1);
  }
}

createTables();
