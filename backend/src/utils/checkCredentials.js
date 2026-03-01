const mongoose = require("mongoose");
const User = require("../models/User");
const Profile = require("../models/Profile");

// MongoDB connection string
const mongoURI = process.env.MONGO_URI || "mongodb+srv://infosmartvyapaar_db_user:teamAlpha%4012345@cluster0.qvrg7rl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

/**
 * Connect to MongoDB
 */
async function connectToMongoDB() {
  try {
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

/**
 * Check user credentials by phone number
 * @param {string} phone - Phone number to check (with or without country code)
 * @returns {Object} User credentials if found, null otherwise
 */
async function checkUserByPhone(phone) {
  try {
    // Normalize phone for storage (remove country code)
    const { normalizeForStorage } = require("./phoneUtils");
    const normalizedPhone = normalizeForStorage(phone);
    
    const user = await User.findOne({ phone: normalizedPhone });
    
    if (user) {
      return {
        found: true,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address,
          createdAt: user.createdAt
        }
      };
    }
    
    return { found: false, message: "User not found with this phone number" };
  } catch (err) {
    console.error("Error checking user by phone:", err);
    return { found: false, error: err.message };
  }
}

/**
 * Check user credentials by email
 * @param {string} email - Email address to check
 * @returns {Object} User credentials if found, null otherwise
 */
async function checkUserByEmail(email) {
  try {
    const user = await User.findOne({ email: email });
    
    if (user) {
      return {
        found: true,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address,
          createdAt: user.createdAt
        }
      };
    }
    
    return { found: false, message: "User not found with this email" };
  } catch (err) {
    console.error("Error checking user by email:", err);
    return { found: false, error: err.message };
  }
}

/**
 * Check user credentials and get profiles
 * @param {string} identifier - Phone number or email address
 * @returns {Object} Complete user credentials with profiles
 */
async function checkUserCredentials(identifier) {
  try {
    // Determine if identifier is phone or email
    const isEmail = identifier.includes("@");
    
    let result;
    if (isEmail) {
      result = await checkUserByEmail(identifier);
    } else {
      result = await checkUserByPhone(identifier);
    }
    
    if (result.found) {
      // Get user profiles
      const profiles = await Profile.find({ userId: result.user.id });
      result.profiles = profiles.map(p => ({
        id: p._id,
        name: p.name,
        backgroundPreference: p.backgroundPreference,
        photo: p.photo,
        isDefault: p.isDefault,
        createdAt: p.createdAt
      }));
      result.profileCount = profiles.length;
    }
    
    return result;
  } catch (err) {
    console.error("Error checking user credentials:", err);
    return { found: false, error: err.message };
  }
}

/**
 * Get all users from database
 * @returns {Array} Array of all users
 */
async function getAllUsers() {
  try {
    const users = await User.find({}, { name: 1, phone: 1, email: 1, address: 1, createdAt: 1 });
    return { success: true, count: users.length, users };
  } catch (err) {
    console.error("Error getting all users:", err);
    return { success: false, error: err.message };
  }
}

// Main execution for command line usage
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  await connectToMongoDB();
  
  switch (command) {
    case "phone":
      if (!args[1]) {
        console.error("Please provide a phone number");
        process.exit(1);
      }
      const phoneResult = await checkUserByPhone(args[1]);
      console.log("Phone lookup result:", JSON.stringify(phoneResult, null, 2));
      break;
      
    case "email":
      if (!args[1]) {
        console.error("Please provide an email address");
        process.exit(1);
      }
      const emailResult = await checkUserByEmail(args[1]);
      console.log("Email lookup result:", JSON.stringify(emailResult, null, 2));
      break;
      
    case "check":
      if (!args[1]) {
        console.error("Please provide a phone number or email");
        process.exit(1);
      }
      const result = await checkUserCredentials(args[1]);
      console.log("Credential check result:", JSON.stringify(result, null, 2));
      break;
      
    case "all":
      const allUsers = await getAllUsers();
      console.log("All users:", JSON.stringify(allUsers, null, 2));
      break;
      
    default:
      console.log(`
Usage: node checkCredentials.js <command> [argument]

Commands:
  phone <number>   - Check user by phone number
  email <address>  - Check user by email address
  check <id>      - Check user by phone or email (auto-detect)
  all             - Get all users

Examples:
  node checkCredentials.js phone +917608045737
  node checkCredentials.js email user@example.com
  node checkCredentials.js check +917608045737
  node checkCredentials.js all
      `);
  }
  
  await mongoose.disconnect();
  console.log("MongoDB disconnected");
  process.exit(0);
}

// Export functions for use in other modules
module.exports = {
  checkUserByPhone,
  checkUserByEmail,
  checkUserCredentials,
  getAllUsers,
  connectToMongoDB
};

// Run main if this is the main module
if (require.main === module) {
  main();
}
