import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import CapsuleCard from "../components/CapsuleCard.jsx";
import CapsuleForm from "../components/CapsuleForm.jsx";

export default function Dashboard() {
  const [capsules, setCapsules] = useState([]);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = existing
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  async function load() {
    try {
      const data = await api.getCapsules();
      setCapsules(data);
      setCheckingAuth(false);
    } catch (err) {
      if (err.status === 401) {
        // Not logged in (no valid JWT cookie) — bounce back to the public landing page.
        window.location.href = "/";
        return;
      }
      setError(err.message);
      setCheckingAuth(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(data) {
    try {
      if (editing?.id) {
        await api.updateCapsule(editing.id, data);
      } else {
        await api.createCapsule(data);
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this capsule?")) return;
    try {
      await api.deleteCapsule(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (checkingAuth) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>AI Capsule</h1>
        <a href="/logout" className="btn-logout">
          Log out
        </a>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-toolbar">
        <button className="primary" onClick={() => setEditing({})}>
          + New capsule
        </button>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing.id ? "Edit capsule" : "New capsule"}</h2>
            <CapsuleForm
              initial={editing.id ? editing : null}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}

      <div className="capsule-grid">
        {capsules.length === 0 && (
          <p className="empty-state">No capsules yet. Add your first one!</p>
        )}
        {capsules.map((c) => (
          <CapsuleCard key={c.id} capsule={c} onEdit={setEditing} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
