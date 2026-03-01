const { pool } = require("../config/db");

class Device {
  static async createDevice(userId, espId, name, type, status = "OFF") {
    if (!pool) {
      throw new Error("PostgreSQL pool not initialized");
    }
    const result = await pool.query(
      "INSERT INTO devices (user_id, esp_id, name, type, status) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [userId, espId, name, type, status]
    );
    return result.rows[0].id;
  }

  static async getDevicesByUser(userId) {
    if (!pool) {
      throw new Error("PostgreSQL pool not initialized");
    }
    const result = await pool.query("SELECT * FROM devices WHERE user_id = $1", [
      userId,
    ]);
    return result.rows;
  }

  static async updateStatus(deviceId, status) {
    if (!pool) {
      throw new Error("PostgreSQL pool not initialized");
    }
    await pool.query("UPDATE devices SET status=$1 WHERE id=$2", [
      status,
      deviceId,
    ]);
  }

  static async getDeviceById(deviceId) {
    if (!pool) {
      throw new Error("PostgreSQL pool not initialized");
    }
    const result = await pool.query("SELECT * FROM devices WHERE id = $1", [
      deviceId,
    ]);
    return result.rows[0];
  }

  static async updateHeartbeatByEsp(espId) {
    if (!pool) {
      throw new Error("PostgreSQL pool not initialized");
    }
    await pool.query("UPDATE devices SET last_heartbeat = NOW() WHERE esp_id = $1", [
      espId,
    ]);
  }

  static async setDeviceStatus(deviceId, userId, status) {
    if (!pool) {
      throw new Error("PostgreSQL pool not initialized");
    }
    await pool.query("UPDATE devices SET status=$1 WHERE id=$2 AND user_id=$3", [
      status,
      deviceId,
      userId,
    ]);
  }
}

module.exports = Device;
