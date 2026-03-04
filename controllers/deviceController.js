// controllers/deviceController.js
const {
  getDevicesByUser,
  createDevice,
  setDeviceStatus,
  getDeviceById,
  updateHeartbeatByEsp,
} = require("../models/Device");

exports.listMyDevices = async (req, res) => {
  try {
    const rows = await getDevicesByUser(req.user.id);
    return res.json(rows);
  } catch {
    return res.status(500).json({ error: "Failed to fetch devices" });
  }
};

exports.addDevice = async (req, res) => {
  try {
    const { espId, name, type } = req.body;
    if (!espId) return res.status(400).json({ error: "espId required" });

    const device = await createDevice(req.user.id, espId, name, type);
    return res.status(201).json(device);
  } catch (e) {
    if (e && e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "espId already registered" });
    }
    return res.status(500).json({ error: "Failed to add device" });
  }
};

exports.toggleDevice = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body; // "ON"/"OFF"
    if (!["ON", "OFF"].includes(status)) return res.status(400).json({ error: "Bad status" });

    const updated = await setDeviceStatus(id, req.user.id, status);
    if (!updated) return res.status(404).json({ error: "Device not found" });
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Failed to toggle device" });
  }
};

// --- ESP32 endpoints ---
exports.espHeartbeat = async (req, res) => {
  const { espId } = req.body;
  if (!espId) return res.status(400).json({ error: "espId required" });
  await updateHeartbeatByEsp(espId);
  return res.json({ ok: true });
};

exports.getCommandForEsp = async (req, res) => {
  const { espId } = req.query;
  if (!espId) return res.status(400).json({ error: "espId required" });

  const devices = await new Promise(async (resolve) => {
    const { pool } = require("../config/db");
    if (!pool) {
      // Return dummy devices to avoid crashing when MySQL is disabled
      resolve([{ type: "light", status: "off" }, { type: "fan", status: "off", speed: 0 }]);
      return;
    }
    const [rows] = await pool.query("SELECT * FROM devices WHERE esp_id = ?", [espId]);
    resolve(rows);
  });

  if (!devices || devices.length === 0) return res.status(404).json({ error: "Not registered" });

  // Group by type (assume 'type' field; fallback to first as light, second as fan)
  let lightStatus = "off";
  let fanStatus = "off";
  let fanSpeed = 0;

  const lightDevice = devices.find(d => d.type === "light" || d.name?.toLowerCase().includes("light"));
  if (lightDevice) lightStatus = lightDevice.status || "off";

  const fanDevice = devices.find(d => d.type === "fan" || d.name?.toLowerCase().includes("fan"));
  if (fanDevice) {
    fanStatus = fanDevice.status || "off";
    fanSpeed = fanDevice.speed || 0;
  }

  return res.json({ 
    lightStatus, 
    fanStatus, 
    fanSpeed 
  });
};
