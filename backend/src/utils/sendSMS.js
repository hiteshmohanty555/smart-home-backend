const twilio = require("twilio");
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = require("../config/env");

// Check if Twilio credentials are properly configured
const isTwilioConfigured = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER;

let client;
if (isTwilioConfigured) {
  try {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  } catch (e) {
    console.warn("Twilio client initialization failed:", e.message);
  }
}

async function sendSMS(to, body) {
  // For development/testing: log OTP to console if Twilio is not properly configured
  if (!isTwilioConfigured) {
    console.log("=".repeat(50));
    console.log("SMS (Development Mode - Not sent to phone)");
    console.log("=".repeat(50));
    console.log("To:", to);
    console.log("Message:", body);
    console.log("=".repeat(50));
    // In development, simulate successful SMS send
    return { success: true, devMode: true, message: "OTP logged to console (dev mode)" };
  }
  
  try {
    const message = await client.messages.create({
      body,
      from: TWILIO_PHONE_NUMBER,
      to,
    });
    console.log("SMS sent:", message.sid);
    return { success: true };
  } catch (error) {
    console.error("SMS send failed:", error.message);
    
    // If Twilio fails (e.g., invalid phone number), fall back to console log
    if (error.message.includes("is not a Twilio phone number")) {
      console.log("=".repeat(50));
      console.log("SMS (Fallback to Console - Twilio phone number invalid)");
      console.log("=".repeat(50));
      console.log("To:", to);
      console.log("Message:", body);
      console.log("=".repeat(50));
      return { success: true, devMode: true, message: "OTP logged to console (fallback)" };
    }
    
    return { success: false, message: error.message };
  }
}

module.exports = sendSMS;
