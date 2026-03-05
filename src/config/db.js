const mongoose = require("mongoose");
const { Pool } = require("pg");

// ==============================
// MongoDB Connection (Users, Profiles)
// ==============================

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI ||
      "mongodb+srv://infosmartvyapaar_db_user:teamAlpha%4012345@cluster0.qvrg7rl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

    await mongoose.connect(mongoURI);

    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

// ==============================
// PostgreSQL Connection (Supabase)
// ==============================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false,
  },

  // Force IPv4 to avoid Render IPv6 connection error
  family: 4,

  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 5,
});

// When PostgreSQL connects
pool.on("connect", () => {
  console.log("Connected to PostgreSQL (Supabase)");
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err);
});

module.exports = { connectDB, pool };
