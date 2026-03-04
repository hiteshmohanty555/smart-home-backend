const pool = require("../config/db");

class OTP {
  static async saveOTP(userId, otp, expiresAt) {
    await pool.query(
      "INSERT INTO otps (user_id, otp, expires_at) VALUES (?, ?, ?)",
      [userId, otp, expiresAt]
    );
  }

  static async verifyOTP(userId, otp) {
    const [rows] = await pool.query(
      "SELECT * FROM otps WHERE user_id=? AND otp=? AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
      [userId, otp]
    );
    return rows[0];
  }
}

module.exports = OTP;
