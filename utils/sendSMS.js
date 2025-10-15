const twilio = require("twilio");
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = require("../config/env");

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function sendSMS(to, body) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn("Twilio credentials missing, SMS not sent");
    return { success: false, message: "Twilio credentials missing" };
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
    return { success: false, message: error.message };
  }
}

module.exports = sendSMS;
