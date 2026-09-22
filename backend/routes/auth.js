// routes/auth.js — GitHub OAuth login flow.
// After a successful OAuth exchange, we issue our OWN application JWT
// (not the GitHub access token) and store it in a Secure, HttpOnly cookie
// named "token", per the assignment spec.
const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;

// GET /login — starts the OAuth flow by redirecting to GitHub.
router.get("/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    scope: "read:user",
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

// GET /auth/github/callback — GitHub redirects here with a ?code=... param.
router.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Missing OAuth code from GitHub.");
  }

  try {
    // Step 1: exchange the code for a GitHub access token.
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: CALLBACK_URL,
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("GitHub token exchange failed:", tokenData);
      return res.status(401).send("GitHub OAuth failed: could not obtain access token.");
    }

    // Step 2: use that access token to fetch the GitHub profile.
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${tokenData.access_token}`,
        "User-Agent": "ai-capsule-app",
      },
    });
    const githubUser = await userRes.json();

    if (!githubUser.id) {
      console.error("GitHub user fetch failed:", githubUser);
      return res.status(401).send("GitHub OAuth failed: could not fetch user profile.");
    }

    // Step 3: issue our OWN application JWT — this is what protects /api/capsules,
    // not the GitHub access token itself.
    const appToken = jwt.sign(
      { userId: String(githubUser.id), username: githubUser.login },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Step 4: store it in a Secure, HttpOnly cookie named "token".
    res.cookie("token", appToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.redirect("/dashboard");
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("Something went wrong during GitHub login.");
  }
});

// GET /logout — clears the session cookie.
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;
