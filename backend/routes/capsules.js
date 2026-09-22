// routes/capsules.js — CRUD for prompt "capsules", scoped to the authenticated user.
// user_id always comes from the verified JWT (req.userId) — never from the request body.
const express = require("express");
const db = require("../db");
const requireAuth = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

function rowToCapsule(row) {
  return {
    ...row,
    reviewed: Boolean(row.reviewed),
    improved: Boolean(row.improved),
  };
}

// GET /api/capsules — list only this user's own records
router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM capsules WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.userId);
  res.json(rows.map(rowToCapsule));
});

// GET /api/capsules/:id — get one, only if it belongs to this user
router.get("/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM capsules WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!row) return res.status(404).json({ error: "Capsule not found" });
  res.json(rowToCapsule(row));
});

// POST /api/capsules — create, owner is always the authenticated user
router.post("/", (req, res) => {
  const {
    project_name,
    prompt_title,
    prompt_version,
    prompt_text,
    response_summary,
    category,
    usefulness,
    reviewed,
    improved,
    screenshot_url,
    notes,
  } = req.body;

  if (!project_name || !prompt_title || !prompt_text) {
    return res.status(400).json({
      error: "project_name, prompt_title and prompt_text are required",
    });
  }

  const result = db
    .prepare(
      `INSERT INTO capsules
        (user_id, project_name, prompt_title, prompt_version, prompt_text, response_summary,
         category, usefulness, reviewed, improved, screenshot_url, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.userId,
      project_name,
      prompt_title,
      prompt_version || "",
      prompt_text,
      response_summary || "",
      category || "",
      usefulness || "",
      reviewed ? 1 : 0,
      improved ? 1 : 0,
      screenshot_url || "",
      notes || ""
    );

  const created = db
    .prepare("SELECT * FROM capsules WHERE id = ?")
    .get(result.lastInsertRowid);
  res.status(201).json(rowToCapsule(created));
});

// PUT /api/capsules/:id — update, only if owned by this user
router.put("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM capsules WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "Capsule not found" });

  const {
    project_name,
    prompt_title,
    prompt_version,
    prompt_text,
    response_summary,
    category,
    usefulness,
    reviewed,
    improved,
    screenshot_url,
    notes,
  } = req.body;

  db.prepare(
    `UPDATE capsules SET
      project_name = ?, prompt_title = ?, prompt_version = ?, prompt_text = ?,
      response_summary = ?, category = ?, usefulness = ?, reviewed = ?, improved = ?,
      screenshot_url = ?, notes = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    project_name ?? existing.project_name,
    prompt_title ?? existing.prompt_title,
    prompt_version ?? existing.prompt_version,
    prompt_text ?? existing.prompt_text,
    response_summary ?? existing.response_summary,
    category ?? existing.category,
    usefulness ?? existing.usefulness,
    reviewed !== undefined ? (reviewed ? 1 : 0) : existing.reviewed,
    improved !== undefined ? (improved ? 1 : 0) : existing.improved,
    screenshot_url ?? existing.screenshot_url,
    notes ?? existing.notes,
    req.params.id,
    req.userId
  );

  const updated = db.prepare("SELECT * FROM capsules WHERE id = ?").get(req.params.id);
  res.json(rowToCapsule(updated));
});

// DELETE /api/capsules/:id — delete, only if owned by this user
router.delete("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM capsules WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "Capsule not found" });

  db.prepare("DELETE FROM capsules WHERE id = ?").run(req.params.id);
  res.json({ deleted: true, id: Number(req.params.id) });
});

module.exports = router;
