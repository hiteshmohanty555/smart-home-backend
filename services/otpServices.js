const sendSMS = require("../utils/sendSMS");
const generateOTP = require("../utils/generateOTP");

const otpStore = new Map(); // In-memory store for OTPs, key: phone, value: { otp, expiresAt }

const OTP_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

async function sendOTP(phone) {
  try {
    const otp = generateOTP();
    console.log(`Generated OTP for phone ${phone}: ${otp}`);  // Added logging for OTP generation
    const message = `Your OTP code is: ${otp}`;
    await sendSMS(phone, message);
    const expiresAt = Date.now() + OTP_EXPIRY_MS;
    // Store OTP keyed by full phone number with country code
    otpStore.set(phone, { otp, expiresAt });
    console.log(`OTP stored for phone ${phone} with expiry at ${new Date(expiresAt).toISOString()}`);
    return { success: true, message: "OTP sent successfully" };
  } catch (err) {
    console.error("Error in sendOTP:", err);
    return { success: false, message: "Failed to send OTP" };
  }
}

async function verifyOTP(phone, otp, isRegistration = false) {
  try {
    const record = otpStore.get(phone);
    console.log(`Verifying OTP for phone ${phone}: found record? ${record ? "yes" : "no"}`);
    console.log(`Provided OTP: ${otp}, Stored OTP: ${record ? record.otp : "N/A"}`);
    if (!record) {
      return { success: false, message: "OTP not found or expired" };
    }
    if (record.expiresAt < Date.now()) {
      otpStore.delete(phone);
      return { success: false, message: "OTP expired" };
    }
    if (record.otp !== otp) {
      return { success: false, message: "Invalid OTP" };
    }
    if (!isRegistration) {
      otpStore.delete(phone);
    }
    return { success: true, message: "OTP verified successfully" };
  } catch (err) {
    console.error("Error in verifyOTP:", err);
    return { success: false, message: "OTP verification failed" };
  }
}

// Function to check if OTP exists for a phone number (without verification)
function hasValidOTP(phone) {
  try {
    const record = otpStore.get(phone);
    if (!record) {
      return false;
    }
    if (record.expiresAt < Date.now()) {
      otpStore.delete(phone);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error checking OTP validity:", err);
    return false;
  }
}

// Function to clear OTP for a phone number
function clearOTP(phone) {
  try {
    otpStore.delete(phone);
    console.log(`OTP cleared for phone ${phone}`);
  } catch (err) {
    console.error("Error clearing OTP:", err);
  }
}

module.exports = { sendOTP, verifyOTP, hasValidOTP, clearOTP };
