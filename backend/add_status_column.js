const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://postgres.ynqyvtqrstziyhklhcvo:Bapun7608045737@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function addStatusColumn() {
  try {
    await pool.query('ALTER TABLE devices ADD COLUMN status VARCHAR(50)');
    console.log("✅ Added 'status' column");
  } catch (err) {
    if (err.code === '42701') { // column already exists
      console.log("ℹ️ 'status' column already exists");
    } else {
      console.error("❌ Error:", err.message);
    }
  }
  
  // Show all columns
  const result = await pool.query(
    'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1',
    ['devices']
  );
  console.log("Updated columns:", JSON.stringify(result.rows, null, 2));
  await pool.end();
}

addStatusColumn();
