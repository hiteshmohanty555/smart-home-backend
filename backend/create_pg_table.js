const { Pool } = require("pg");

// Supabase PostgreSQL Pool
const pool = new Pool({
  connectionString: "postgresql://postgres.ynqyvtqrstziyhklhcvo:Bapun7608045737@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function createDevicesTable() {
  try {
    // Create devices table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        esp_id VARCHAR(255),
        name VARCHAR(255),
        type VARCHAR(50),
        status VARCHAR(50),
        speed INTEGER,
        last_heartbeat TIMESTAMP
      )
    `);
    console.log("✅ Devices table created successfully");
    
    // Show all tables
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables in database:", result.rows);
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating table:", err.message);
    await pool.end();
    process.exit(1);
  }
}

createDevicesTable();
