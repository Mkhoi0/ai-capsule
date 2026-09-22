// server.js — entry point.
// Serves the React frontend AND the Express API from the SAME origin
// (recommended by the assignment brief) to avoid CORS and cross-origin
// cookie complications.
require("dotenv").config();
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const capsuleRoutes = require("./routes/capsules");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET is not set — set it in .env before using auth.");
}

// Only needed in local dev when the Vite dev server (a different port) calls
// this API directly. In production, frontend + backend share one origin,
// so this middleware does nothing.
if (process.env.CLIENT_ORIGIN) {
  app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
}

app.use(cookieParser());
app.use(express.json());

// Public health check — must stay public and unauthenticated.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// OAuth routes: GET /login, GET /auth/github/callback, GET /logout
app.use("/", authRoutes);

// Protected capsule CRUD routes: /api/capsules
app.use("/api/capsules", capsuleRoutes);

// Serve the built React frontend (frontend/dist) for everything else.
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendDist));

// SPA fallback: any other GET request that isn't an API/OAuth route
// gets the React app, which handles client-side routing for "/" and "/dashboard".
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`AI Capsule server running on port ${PORT}`);
});
