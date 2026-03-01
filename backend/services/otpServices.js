const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = require("../src/config/env");
const twilio = require("twilio");

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const sendOTP = async (phone) => {
  try {
    const verification = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to: phone, channel: "sms" });
    console.log("OTP sent via Twilio Verify:", verification.sid);
    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.error("Failed to send OTP via Twilio Verify:", error.message);
    return { success: false, message: error.message };
  }
};

const verifyOTP = async (phone, code) => {
  try {
    const verification_check = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code });
    if (verification_check.status === "approved") {
      return { success: true, message: "OTP verified successfully" };
    } else {
      return { success: false, message: "Invalid OTP" };
    }
  } catch (error) {
    console.error("Failed to verify OTP via Twilio Verify:", error.message);
    return { success: false, message: error.message };
  }
};

module.exports = { sendOTP, verifyOTP };
