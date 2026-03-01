const mongoose = require("mongoose");
const { Pool } = require("pg");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb+srv://infosmartvyapaar_db_user:teamAlpha%4012345@cluster0.qvrg7rl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

// Supabase PostgreSQL Pool - using the provided connection string
const pool = new Pool({
  connectionString: "postgresql://postgres.ynqyvtqrstziyhklhcvo:Bapun7608045737@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('✅ Connected to Supabase PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test the connection
pool.query('SELECT NOW()')
  .then(() => console.log('✅ PostgreSQL connection test successful'))
  .catch(err => console.error('❌ PostgreSQL connection test failed:', err.message));

module.exports = { connectDB, pool };
