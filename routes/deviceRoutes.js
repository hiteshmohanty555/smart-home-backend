// routes/deviceRoutes.js
const router = require("express").Router();
const { authRequired } = require("../middleware/authMiddleware");
const { listMyDevices, addDevice, toggleDevice } = require("../controllers/deviceController");

router.get("/", authRequired, listMyDevices);
router.post("/", authRequired, addDevice);
router.post("/:id/toggle", authRequired, toggleDevice);

module.exports = router;
