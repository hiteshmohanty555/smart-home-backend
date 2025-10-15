// routes/espRoutes.js
const router = require("express").Router();
const { espHeartbeat, getCommandForEsp } = require("../controllers/deviceController");

// ESP32 does NOT use JWT; authenticate later with a device token if needed
router.post("/heartbeat", espHeartbeat);
router.get("/command", getCommandForEsp);

module.exports = router;
