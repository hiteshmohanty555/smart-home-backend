const mongoose = require("mongoose");
const { Pool } = require("pg");

// MongoDB connection (for User and Profile models)
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

// PostgreSQL pool (for Device and OTP models) - Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:Bapun%407608045737@db.ynqyvtqrstziyhklhcvo.supabase.co:5432/postgres",
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 1
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL (Supabase)');
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

module.exports = { connectDB, pool };
