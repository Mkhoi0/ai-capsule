import React, { useState, useEffect } from "react";

const emptyForm = {
  project_name: "",
  prompt_title: "",
  prompt_version: "v1",
  prompt_text: "",
  response_summary: "",
  category: "Coding",
  usefulness: "Good",
  reviewed: false,
  improved: false,
  screenshot_url: "",
  notes: "",
};

export default function CapsuleForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || emptyForm);

  useEffect(() => {
    setForm(initial || emptyForm);
  }, [initial]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form className="capsule-form" onSubmit={handleSubmit}>
      <label>
        Project name
        <input
          value={form.project_name}
          onChange={(e) => update("project_name", e.target.value)}
          required
        />
      </label>

      <label>
        Prompt title
        <input
          value={form.prompt_title}
          onChange={(e) => update("prompt_title", e.target.value)}
          required
        />
      </label>

      <label>
        Version
        <input
          value={form.prompt_version}
          onChange={(e) => update("prompt_version", e.target.value)}
          placeholder="v1"
        />
      </label>

      <label>
        Prompt text
        <textarea
          rows={4}
          value={form.prompt_text}
          onChange={(e) => update("prompt_text", e.target.value)}
          required
        />
      </label>

      <label>
        Response summary
        <textarea
          rows={2}
          value={form.response_summary}
          onChange={(e) => update("response_summary", e.target.value)}
        />
      </label>

      <div className="form-row">
        <label>
          Category
          <select value={form.category} onChange={(e) => update("category", e.target.value)}>
            <option>Coding</option>
            <option>Writing</option>
            <option>Research</option>
            <option>Other</option>
          </select>
        </label>

        <label>
          Usefulness
          <select value={form.usefulness} onChange={(e) => update("usefulness", e.target.value)}>
            <option>Good</option>
            <option>Needs Improvement</option>
          </select>
        </label>
      </div>

      <div className="form-row checkboxes">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={Boolean(form.reviewed)}
            onChange={(e) => update("reviewed", e.target.checked)}
          />
          Reviewed
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={Boolean(form.improved)}
            onChange={(e) => update("improved", e.target.checked)}
          />
          Improved
        </label>
      </div>

      <label>
        Screenshot URL (optional)
        <input
          value={form.screenshot_url}
          onChange={(e) => update("screenshot_url", e.target.value)}
          placeholder="https://..."
        />
      </label>

      <label>
        Notes
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
      </label>

      <div className="form-actions">
        <button type="submit">{initial ? "Save changes" : "Add capsule"}</button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
