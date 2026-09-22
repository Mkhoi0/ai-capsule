// api.js — fetch wrapper. Auth is via the HttpOnly "token" cookie the browser
// sends automatically, so every request just needs credentials: "include".
async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    const err = new Error("Not authenticated");
    err.status = 401;
    throw err;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}

export const api = {
  getCapsules: () => request("/api/capsules"),
  createCapsule: (data) => request("/api/capsules", { method: "POST", body: data }),
  updateCapsule: (id, data) => request(`/api/capsules/${id}`, { method: "PUT", body: data }),
  deleteCapsule: (id) => request(`/api/capsules/${id}`, { method: "DELETE" }),
};
