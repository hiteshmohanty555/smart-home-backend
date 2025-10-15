// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();

const { registerUser, sendOtp, verifyOtp } = require("../controllers/authController");
const normalizePhone = require("../middleware/normalizePhone");

// Register a new user
router.post("/register", normalizePhone, registerUser);

// Send OTP (for registration)
router.post("/send-otp", normalizePhone, sendOtp);

// Login (send OTP)
router.post("/login", normalizePhone, sendOtp);

// Verify OTP
router.post("/verify-otp", normalizePhone, verifyOtp);

module.exports = router;
