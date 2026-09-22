import React from "react";

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-card">
        <h1>AI Capsule</h1>
        <p>
          Your private library for AI prompts. Save the prompts you use for
          coding, writing and study, track whether the response was useful,
          and keep notes for next time — all tied to your own GitHub account.
        </p>
        {/* Full page navigation on purpose — /login is an Express route
            that redirects straight to GitHub, not a React Router route. */}
        <a className="btn-github" href="/login">
          Sign in with GitHub
        </a>
      </div>
    </div>
  );
}
