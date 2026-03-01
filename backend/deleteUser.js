const mongoose = require("mongoose");
const { connectDB, pool } = require("./src/config/db");
const User = require("./src/models/User");
const Profile = require("./src/models/Profile");

async function deleteUserByPhone(phoneNumber) {
  try {
    // Connect to MongoDB
    await connectDB();

    console.log(`=== Searching for user with phone: ${phoneNumber} ===`);

    // First, let's find the user
    const user = await User.findOne({ phone: phoneNumber });
    if (!user) {
      console.log(`❌ User with phone ${phoneNumber} not found`);
      return;
    }

    console.log("✅ User found:", JSON.stringify(user, null, 2));

    // Find associated profiles
    const profiles = await Profile.find({ phone: phoneNumber });
    console.log(`\n📋 Found ${profiles.length} associated profiles`);

    // Delete profiles first (foreign key constraint)
    if (profiles.length > 0) {
      console.log("🗑️ Deleting profiles...");
      await Profile.deleteMany({ phone: phoneNumber });
      console.log(`✅ Deleted ${profiles.length} profiles`);
    }

    // Delete the user
    console.log("🗑️ Deleting user...");
    await User.deleteOne({ phone: phoneNumber });
    console.log("✅ User deleted successfully");

    // Check and delete PostgreSQL records
    console.log("\n=== Checking PostgreSQL Records ===");

    // Check devices - Note: devices table uses user_id, not phone
    // You'll need to update this logic based on your actual data
    const devicesResult = await pool.query("SELECT * FROM devices WHERE user_id = $1", [user.id]);
    if (devicesResult.rows.length > 0) {
      console.log(`📋 Found ${devicesResult.rows.length} devices in PostgreSQL`);
      console.log("🗑️ Deleting devices...");
      await pool.query("DELETE FROM devices WHERE user_id = $1", [user.id]);
      console.log(`✅ Deleted ${devicesResult.rows.length} devices from PostgreSQL`);
    }

    // Check OTPs - Note: otps table uses user_id, not phone
    const otpsResult = await pool.query("SELECT * FROM otps WHERE user_id = $1", [user.id]);
    if (otpsResult.rows.length > 0) {
      console.log(`📋 Found ${otpsResult.rows.length} OTPs in PostgreSQL`);
      console.log("🗑️ Deleting OTPs...");
      await pool.query("DELETE FROM otps WHERE user_id = $1", [user.id]);
      console.log(`✅ Deleted ${otpsResult.rows.length} OTPs from PostgreSQL`);
    }

    console.log(`\n🎉 Successfully deleted all data for user with phone: ${phoneNumber}`);

    // Close connections
    await mongoose.connection.close();
    await pool.end();

  } catch (error) {
    console.error("❌ Error deleting user:", error);
  }
}

// Run the deletion
deleteUserByPhone("9937175521");
