const pool = require("../config/db");

class OTP {
  static async saveOTP(userId, otp, expiresAt) {
    await pool.query(
      "INSERT INTO otps (user_id, otp, expires_at) VALUES ($1, $2, $3)",
      [userId, otp, expiresAt]
    );
  }

  static async verifyOTP(userId, otp) {
    const result = await pool.query(
      "SELECT * FROM otps WHERE user_id=$1 AND otp=$2 AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
      [userId, otp]
    );
    return result.rows[0];
  }
}

module.exports = OTP;
