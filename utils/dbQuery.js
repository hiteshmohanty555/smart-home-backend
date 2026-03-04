const mongoose = require("mongoose");

async function printUsers() {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb+srv://infosmartvyapaar_db_user:teamAlpha%4012345@cluster0.qvrg7rl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(mongoURI);
    const users = await mongoose.connection.db.collection("users").find().toArray();
    console.log("Users in DB:", JSON.stringify(users, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error fetching users from DB:", err);
  }
}

printUsers();
