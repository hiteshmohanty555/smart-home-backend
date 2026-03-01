require('dotenv').config();
const mongoose = require("mongoose");
const { connectDB, pool } = require("./src/config/db");
const User = require("./src/models/User");
const Profile = require("./src/models/Profile");

async function showAllRecords() {
  try {
    // Connect to MongoDB
    await connectDB();

    console.log("=== MongoDB Records ===");

    // Users
    console.log("\n--- Users ---");
    const users = await User.find({});
    console.log(JSON.stringify(users, null, 2));

    // Profiles
    console.log("\n--- Profiles ---");
    const profiles = await Profile.find({});
    console.log(JSON.stringify(profiles, null, 2));

    console.log("\n=== PostgreSQL Records ===");

    try {
      // Devices
      console.log("\n--- Devices ---");
      const devicesResult = await pool.query("SELECT * FROM devices");
      console.log(JSON.stringify(devicesResult.rows, null, 2));

      // OTPs
      console.log("\n--- OTPs ---");
      const otpsResult = await pool.query("SELECT * FROM otps");
      console.log(JSON.stringify(otpsResult.rows, null, 2));
    } catch (pgError) {
      console.log("\n--- PostgreSQL Connection Error ---");
      console.log("PostgreSQL database connection failed. This could be due to:");
      console.log("1. PostgreSQL server not running");
      console.log("2. Incorrect database credentials");
      console.log("3. Database 'smart_home' doesn't exist");
      console.log("4. PostgreSQL user permissions issue");
      console.log("\nError details:", pgError.message);
    }

    // Close connections
    await mongoose.connection.close();
    await pool.end();

  } catch (error) {
    console.error("Error fetching records:", error);
  }
}

showAllRecords();
