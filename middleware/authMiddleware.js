
// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    console.error("Auth middleware: Missing token");
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    console.log("Auth middleware: Verifying token:", token);
    console.log("Using JWT_SECRET:", JWT_SECRET);
    const payload = jwt.verify(token, JWT_SECRET);
    console.log("Token payload:", payload);
    req.user = { id: payload.sub, phone: payload.phone };
    next();
  } catch (e) {
    console.error("Auth middleware: Invalid token error:", e.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = { authRequired };
