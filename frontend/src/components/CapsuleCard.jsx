import React from "react";

export default function CapsuleCard({ capsule, onEdit, onDelete }) {
  return (
    <div className="capsule-card">
      <div className="capsule-card-header">
        <div>
          <h3>{capsule.prompt_title}</h3>
          <span className="capsule-meta">
            {capsule.project_name} · {capsule.prompt_version}
          </span>
        </div>
        <div className="capsule-card-actions">
          <button onClick={() => onEdit(capsule)}>Edit</button>
          <button className="danger" onClick={() => onDelete(capsule.id)}>
            Delete
          </button>
        </div>
      </div>

      <p className="capsule-text">{capsule.prompt_text}</p>

      {capsule.response_summary && (
        <p className="capsule-summary">
          <strong>Response:</strong> {capsule.response_summary}
        </p>
      )}

      <div className="tag-list">
        {capsule.category && <span className="tag">{capsule.category}</span>}
        {capsule.usefulness && <span className="tag">{capsule.usefulness}</span>}
        {capsule.reviewed && <span className="tag tag-good">Reviewed</span>}
        {capsule.improved && <span className="tag tag-good">Improved</span>}
      </div>

      {capsule.screenshot_url && (
        <a className="screenshot-link" href={capsule.screenshot_url} target="_blank" rel="noreferrer">
          View screenshot
        </a>
      )}

      {capsule.notes && <p className="capsule-notes">{capsule.notes}</p>}
    </div>
  );
}
