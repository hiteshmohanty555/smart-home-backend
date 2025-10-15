// config/otp.js
const crypto = require("crypto");

// 6-digit numeric
function generateOtp() {
  return ("" + (Math.floor(Math.random() * 900000) + 100000));
}

// Mock sender (replace with Twilio later)
async function sendOtpSMS(phone, otp) {
  // TODO: integrate Twilio/MSG91; for now, just log
  console.log(`[SMS] OTP for ${phone}: ${otp}`);
  return true;
}

module.exports = { generateOtp, sendOtpSMS };
