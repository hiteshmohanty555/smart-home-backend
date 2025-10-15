// controllers/userController.js
const pool = require("../config/db");
const { findUserByPhone } = require("../models/User");
const Profile = require("../models/Profile");
const upload = require("../middleware/uploadMiddleware");
const path = require("path");

exports.me = async (req, res) => {
  try {
    const user = await findUserByPhone(req.user.phone);
    const profiles = await Profile.find({ userId: req.user.id });

    return res.json({
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      address: user.address,
      createdAt: user.createdAt,
      profiles: profiles,
      profileCount: profiles.length
    });
  } catch {
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query("UPDATE users SET name = ? WHERE id = ?", [name || null, req.user.id]);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Failed to update profile" });
  }
};

// Create a new profile under the logged-in user
exports.createProfile = async (req, res) => {
  try {
    const { name, backgroundPreference, isDefault } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Profile name is required" });
    }

    // Handle photo upload if provided
    let photoPath = null;
    if (req.file) {
      photoPath = `/uploads/profiles/${req.file.filename}`;
    }

    const profile = new Profile({
      userId: req.user.id,
      phone: req.user.phone,
      name,
      backgroundPreference: backgroundPreference || "#f5f5f5",
      photo: photoPath,
      isDefault: isDefault || false,
    });

    await profile.save();

    // If this is set as default, update other profiles
    if (isDefault) {
      await Profile.setDefaultProfile(profile._id);
    }

    res.json({ success: true, profile });
  } catch (err) {
    console.error("Create profile error:", err);
    res.status(500).json({ success: false, message: "Failed to create profile" });
  }
};

// Upload profile photo
exports.uploadProfilePhoto = [
  upload.single('photo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No photo uploaded" });
      }

      const photoPath = `/uploads/profiles/${req.file.filename}`;
      res.json({
        success: true,
        message: "Photo uploaded successfully",
        photoPath: photoPath
      });
    } catch (err) {
      console.error("Photo upload error:", err);
      res.status(500).json({ success: false, message: "Failed to upload photo" });
    }
  }
];

exports.getProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find({ userId: req.user.id });
    res.json({ success: true, profiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch profiles" });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    const profileId = req.params.id;
    const profile = await Profile.findOne({ _id: profileId, userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }
    await Profile.deleteOne({ _id: profileId });
    res.json({ success: true, message: "Profile deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete profile" });
  }
};

// Get all users for debugging
const User = require("../models/User");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { name: 1, phone: 1, email: 1, address: 1, _id: 0 });
    res.json({ success: true, users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
};

// Set active profile for user
exports.setActiveProfile = async (req, res) => {
  try {
    const { profileId } = req.body;
    if (!profileId) {
      return res.status(400).json({ success: false, message: "Profile ID is required" });
    }

    const profile = await Profile.findOne({ _id: profileId, userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // Set this profile as active (you can add an isActive field to Profile model if needed)
    // For now, we'll just return the profile as confirmation
    res.json({ success: true, profile });
  } catch (err) {
    console.error("Error setting active profile:", err);
    res.status(500).json({ success: false, message: "Failed to set active profile" });
  }
};
