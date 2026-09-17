const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listDocuments: () => request('/api/documents'),
  createDocument: (title) =>
    request('/api/documents', { method: 'POST', body: JSON.stringify({ title }) }),
  getDocument: (id) => request(`/api/documents/${id}`),
  getPreview: (id) => request(`/api/documents/${id}/preview`),
  renameDocument: (id, title) =>
    request(`/api/documents/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
  deleteDocument: (id) => request(`/api/documents/${id}`, { method: 'DELETE' }),
};

export const WS_BASE = BASE.replace(/^http/, 'ws');
