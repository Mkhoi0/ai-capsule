// middleware/auth.js — verifies the application JWT from the "token" cookie.
// Per spec: the JWT must come from a Secure, HttpOnly cookie named "token" —
// never from localStorage or an Authorization header.
const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const token = req.cookies ? req.cookies.token : undefined;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // userId comes from the verified JWT only — never trust a client-supplied value.
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = requireAuth;
