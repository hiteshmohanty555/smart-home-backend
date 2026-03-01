const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://postgres.ynqyvtqrstziyhklhcvo:Bapun7608045737@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function checkTable() {
  const result = await pool.query(
    'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1',
    ['devices']
  );
  console.log("Table columns:", JSON.stringify(result.rows, null, 2));
  await pool.end();
}

checkTable();
