// backend/src/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 5000;
const LAT = process.env.LAT || 20.2961;
const LON = process.env.LON || 85.8245;
const WEATHER_TTL = 10 * 60 * 1000;

const app = express();
const corsOptions = {
  origin: 'http://localhost:3000'||'https://vercel.com/hitesh-mohantys-projects/smart-home-frontend/DjFUrqKXqQUE6sDhEE6xnuPEgFhm',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

const { connectDB } = require("./config/db");
connectDB();

// Auth routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// User routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/user", userRoutes);

// Device routes
const deviceRoutes = require("./routes/deviceRoutes");
app.use("/api/device", deviceRoutes);

// ESP routes
const espRoutes = require("./routes/espRoutes");
app.use("/api/esp", espRoutes);

/* In-memory state */
let state = {
  lightOn: false,
  fanSpeed: 0,
  tankLevel: 60,
  pumpOn: false,
  smokeDetected: false,
  climate: { tempC: null, humidity: null, updatedAt: null },
};

let lastWeatherFetch = 0;

/* Use global fetch (Node 18+) */
// improved fetchWeather() — paste into backend/src/server.js, replacing the old function
async function fetchWeather() {
  try {
    // request comprehensive weather data
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
                `&current_weather=true&hourly=relativehumidity_2m,pressure_msl,visibility&timezone=UTC`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    // temperature from current_weather
    const cur = json.current_weather;
    const hourly = json.hourly || {};
    const times = hourly.time || [];
    const humidityArr = hourly.relativehumidity_2m || [];
    const pressureArr = hourly.pressure_msl || [];
    const visibilityArr = hourly.visibility || [];

    // set temperature if present
    if (cur && typeof cur.temperature === "number") {
      state.climate.tempC = Number.isFinite(cur.temperature) ? Math.round(cur.temperature) : null;
    }

    // calculate feels-like temperature (simple approximation)
    let feelsLike = state.climate.tempC;
    if (state.climate.tempC !== null && state.climate.humidity !== null) {
      // Basic heat index calculation for temperatures above 27°C
      if (state.climate.tempC > 27) {
        const t = state.climate.tempC;
        const h = state.climate.humidity;
        feelsLike = Math.round(t + 0.348 * h - 0.7 * t * h / 100 - 5.666 + 0.0036 * h * h);
      }
    }

    // pick humidity for current UTC hour (or nearest)
    let humidity = null;
    let idx = -1; // Initialize idx to -1

    if (times.length && humidityArr.length && typeof times[0] === "string") {
      const nowUtc = new Date();
      const nowIsoHour = new Date(Date.UTC(
        nowUtc.getUTCFullYear(),
        nowUtc.getUTCMonth(),
        nowUtc.getUTCDate(),
        nowUtc.getUTCHours(),
        0, 0, 0
      )).toISOString().slice(0, 13);

      idx = times.findIndex(t => t.startsWith(nowIsoHour));
      if (idx === -1) {
        let best = 0, bestDiff = Infinity;
        const nowMs = Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate(), nowUtc.getUTCHours(), 0, 0, 0);
        for (let i = 0; i < times.length; i++) {
          const t = times[i];
          const tm = Date.parse(t);
          if (Number.isFinite(tm)) {
            const diff = Math.abs(tm - nowMs);
            if (diff < bestDiff) { bestDiff = diff; best = i; }
          }
        }
        idx = best;
      }

      const h = humidityArr[idx];
      if (typeof h === "number") humidity = Math.round(h);
    }

    // get pressure and visibility for current hour
    let pressure = null;
    let visibility = null;
    if (idx >= 0 && idx < pressureArr.length && idx < visibilityArr.length) {
      const p = pressureArr[idx];
      const v = visibilityArr[idx];
      if (typeof p === "number") pressure = Math.round(p);
      if (typeof v === "number") visibility = Math.round(v / 1000); // Convert to km
    }

    // determine weather condition based on temperature and humidity
    let condition = "Unknown";
    if (state.climate.tempC !== null && humidity !== null) {
      if (state.climate.tempC <= 0) {
        condition = "Snow";
      } else if (humidity > 85) {
        condition = "Rain";
      } else if (humidity > 70) {
        condition = "Cloudy";
      } else if (humidity > 40) {
        condition = "Partly Cloudy";
      } else {
        condition = "Clear";
      }
    }

    // update climate state with all data
    state.climate = {
      tempC: state.climate.tempC,
      humidity: humidity,
      feelsLike: feelsLike,
      pressure: pressure,
      visibility: visibility,
      condition: condition,
      updatedAt: new Date().toISOString()
    };

    lastWeatherFetch = Date.now();
    console.log("Weather updated:", state.climate);
  } catch (err) {
    console.error("Weather fetch failed:", err && err.message ? err.message : err);
  }
}

/* Simple REST endpoints */
app.get("/", (_, res) => res.send("Smart Home backend ✅"));

app.get("/api/status", async (req, res) => {
  if (!state.climate.tempC || Date.now() - lastWeatherFetch > WEATHER_TTL) {
    await fetchWeather();
  }
  res.json({ ...state });
});

app.post("/api/light", async (req, res) => {
  const { status } = req.body;
  if (typeof status !== "boolean") return res.status(400).json({ error: "Invalid status. Expected boolean." });
  state.lightOn = status;
  broadcastWS({ type: "device", device: "light", state: status });

  // Also update device status in database if device exists
  try {
    const { pool } = require("./config/db");
    if (pool) {
      await pool.query("UPDATE devices SET status = ? WHERE esp_id = ? AND type = 'light'", [status ? "ON" : "OFF", "esp32"]);
    }
  } catch (e) {
    console.warn("Failed to update device status:", e.message);
  }

  return res.json({ success: true, lightOn: state.lightOn });
});

app.post("/api/fan", async (req, res) => {
  const { speed } = req.body;
  if (!Number.isInteger(speed) || speed < 0 || speed > 5) return res.status(400).json({ error: "Invalid speed. Expected integer 0..5." });
  state.fanSpeed = speed;
  broadcastWS({ type: "device", device: "fan", speed });

  // Update fan device in database
  try {
    const { pool } = require("./config/db");
    if (pool) {
      const fanStatus = speed > 0 ? "ON" : "OFF";
      await pool.query("UPDATE devices SET status = ?, speed = ? WHERE esp_id = ? AND type = 'fan'", [fanStatus, speed, "esp32"]);
    }
  } catch (e) {
    console.warn("Failed to update fan device:", e.message);
  }

  return res.json({ success: true, fanSpeed: state.fanSpeed });
});

app.post("/api/update", (req, res) => {
  const { tankLevel, pumpOn, smokeDetected } = req.body;
  if (typeof tankLevel === "number") state.tankLevel = Math.max(0, Math.min(100, Math.round(tankLevel)));
  if (typeof pumpOn === "boolean") state.pumpOn = pumpOn;
  if (typeof smokeDetected === "boolean") state.smokeDetected = smokeDetected;
  // Note: lightOn and fanSpeed are controlled by frontend, not updated from ESP

  broadcastWS({ type: "status_update", ...state });
  return res.json({ success: true });
});

/* HTTP + WebSocket server */
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function broadcastWS(obj) {
  const msg = JSON.stringify(obj);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

wss.on("connection", (ws) => {
  console.log("✅ Client connected");
  // send initial state
  ws.send(JSON.stringify({ type: "status_update", ...state }));

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);
      console.log("📩 Received:", msg);

      // optional: accept commands from web client (echo to other clients)
      if (msg && msg.type === "command") {
        // update state locally for demo (so REST + WS stay consistent)
        if (msg.device === "light" && typeof msg.state === "boolean") {
          state.lightOn = msg.state;
          broadcastWS({ type: "device", device: "light", state: state.lightOn });
        }
        if (msg.device === "fan" && Number.isInteger(msg.speed)) {
          state.fanSpeed = Math.max(0, Math.min(5, msg.speed));
          broadcastWS({ type: "device", device: "fan", speed: state.fanSpeed });
        }
      }
    } catch (e) {
      // ignore invalid JSON
      console.warn("WS message parse failed");
    }
  });

  ws.on("close", () => console.log("❌ Client disconnected"));
});

/* periodic weather fetch */
fetchWeather();
setInterval(fetchWeather, WEATHER_TTL);

/* start */
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on http://0.0.0.0:${PORT}`);
});

