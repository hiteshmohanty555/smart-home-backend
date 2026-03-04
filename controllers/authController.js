const { sendOTP, verifyOTP, hasValidOTP, clearOTP } = require("../services/otpServices");
const User = require("../models/User");
const { normalizeForStorage, formatForSending, parsePhoneNumber } = require("../utils/phoneUtils");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

// Register a new user (OTP verification required)
exports.registerUser = async (req, res) => {
  try {
    let { name, phone, email, address } = req.body;
    console.log("Register request received:", { name, phone, email, address });

    // Check if all required fields are provided
    if (!name || !phone || !email || !address) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }

    // Normalize phone for storage (remove country code)
    phone = normalizeForStorage(phone);

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      console.log("User already exists:", phone);
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Check if OTP was verified for this phone number
    const { formatForSending } = require("../utils/phoneUtils");

    // Get the full phone number with country code for OTP verification
    const { countryCode = '+91', localNumber } = require("../utils/phoneUtils").parsePhoneNumber(req.body.phone);
    const fullPhoneNumber = formatForSending(countryCode, localNumber);

    // Verify OTP exists and is valid for this phone number
    const isOtpValid = hasValidOTP(fullPhoneNumber);
    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "OTP verification required. Please verify your phone number first."
      });
    }

    // Create the new user
    const newUser = new User({ name, phone, email, address });
    await newUser.save();
    console.log("User registered successfully:", newUser);

    // Clear the OTP after successful registration
    clearOTP(fullPhoneNumber);

    res.json({ success: true, message: "User registered successfully", user: newUser });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ success: false, message: "Error registering user" });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    console.log("Fetched users:", users.length);
    res.json({ success: true, users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
};

// Send OTP (for registration or login)
exports.sendOtp = async (req, res) => {
  try {
    let { phone, email, isRegistration } = req.body;
    console.log("Send OTP request:", { phone, email, isRegistration });

    if (isRegistration) {
      // For registration, check if user already exists
      let normalizedPhone = normalizeForStorage(phone);
      const existingUser = await User.findOne({ phone: normalizedPhone });
      if (existingUser) {
        console.log("User already exists for registration:", normalizedPhone);
        return res.status(400).json({ success: false, message: "User already exists" });
      }
      // Send OTP
      const contact = phone || email;
      if (!contact) {
        return res.status(400).json({ success: false, message: "Phone or email required" });
      }
      // Use full phone number with country code for sending OTP
      const response = await sendOTP(contact);
      console.log("OTP sent response for registration:", response);
      return res.json(response);
    } else {
      // For login, normalize phone for DB query
      let normalizedPhone = normalizeForStorage(phone);
      const query = normalizedPhone ? { phone: normalizedPhone } : email ? { email } : null;
      if (!query) {
        return res.status(400).json({ success: false, message: "Phone or email required" });
      }
      const user = await User.findOne(query);
      if (!user) {
        console.log("User not found for login:", query);
        // Instead of error, send success with message to register first
        return res.json({ success: false, message: "User not found. Please register first." });
      }
      // Use full phone number with country code for sending OTP
      // Compose full phone number with country code
      const { countryCode = '+91', localNumber } = parsePhoneNumber(phone);
      const phoneToSend = formatForSending(countryCode, localNumber);
      const response = await sendOTP(phoneToSend);
      console.log("OTP sent response for login:", response);
      return res.json(response);
    }
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    let { phone, email, otp, isRegistration } = req.body;
    let contact = phone || email;
    console.log("Verify OTP request:", { contact, otp, isRegistration });

    if (!contact) {
      return res.status(400).json({ success: false, message: "Phone or email required" });
    }

    // Normalize phone for DB query
    let normalizedPhone = phone ? normalizeForStorage(phone) : null;

    // Use full phone number with country code for verifying OTP
    const response = await verifyOTP(contact, otp, isRegistration);
    console.log("OTP verify response:", response);
    if (response.success) {
      if (isRegistration) {
        // For registration, after OTP verified, user details will be added later on registration submit
        return res.json({ success: true, message: "OTP verified. Please complete registration." });
      } else {
        // For login, fetch user details
        const query = normalizedPhone ? { phone: normalizedPhone } : email ? { email } : null;
        const user = await User.findOne(query);
        if (!user) {
          console.log("User not found after OTP verify:", query);
          return res.status(404).json({ success: false, message: "User not found" });
        }
        // Generate JWT token
        const token = jwt.sign({ sub: user._id, phone: user.phone }, JWT_SECRET, { expiresIn: "1d" });

        // Fetch user's profiles
        const Profile = require("../models/Profile");
        const profiles = await Profile.find({ phone: user.phone }).sort({ createdAt: -1 });

        // Return user with token and profiles
        const userObj = user.toObject();
        userObj.token = token;
        userObj.profiles = profiles;
        return res.json({ success: true, user: userObj });
      }
    } else {
      res.json(response);
    }
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ success: false, message: "Error verifying OTP" });
  }
};
