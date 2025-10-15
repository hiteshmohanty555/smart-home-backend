const { pool } = require("../config/db");

class Device {
  static async createDevice(userId, espId, name, type, status = "OFF") {
    if (!pool) {
      throw new Error("MySQL pool not initialized");
    }
    const [rows] = await pool.query(
      "INSERT INTO devices (user_id, esp_id, name, status) VALUES (?, ?, ?, ?)",
      [userId, espId, name, status]
    );
    return rows.insertId;
  }

  static async getDevicesByUser(userId) {
    if (!pool) {
      throw new Error("MySQL pool not initialized");
    }
    const [rows] = await pool.query("SELECT * FROM devices WHERE user_id = ?", [
      userId,
    ]);
    return rows;
  }

  static async updateStatus(deviceId, status) {
    if (!pool) {
      throw new Error("MySQL pool not initialized");
    }
    await pool.query("UPDATE devices SET status=? WHERE id=?", [
      status,
      deviceId,
    ]);
  }

  static async getDeviceById(deviceId) {
    if (!pool) {
      throw new Error("MySQL pool not initialized");
    }
    const [rows] = await pool.query("SELECT * FROM devices WHERE id = ?", [
      deviceId,
    ]);
    return rows[0];
  }

  static async updateHeartbeatByEsp(espId) {
    if (!pool) {
      throw new Error("MySQL pool not initialized");
    }
    await pool.query("UPDATE devices SET last_heartbeat = NOW() WHERE esp_id = ?", [
      espId,
    ]);
  }

  static async setDeviceStatus(deviceId, userId, status) {
    if (!pool) {
      throw new Error("MySQL pool not initialized");
    }
    await pool.query("UPDATE devices SET status=? WHERE id=? AND user_id=?", [
      status,
      deviceId,
      userId,
    ]);
  }
}

module.exports = Device;
