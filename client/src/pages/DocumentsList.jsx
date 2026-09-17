import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { getIdentity } from '../lib/user.js';
import DocumentCard from '../components/DocumentCard.jsx';

const CACHE_KEY = 'inkwell:documents-cache';

export default function DocumentsList() {
  const navigate = useNavigate();
  const identity = getIdentity();
  const [docs, setDocs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [loadError, setLoadError] = useState(false);
  const [creating, setCreating] = useState(false);

  function refresh() {
    api
      .listDocuments()
      .then((list) => {
        setDocs(list);
        localStorage.setItem(CACHE_KEY, JSON.stringify(list));
        setLoadError(false);
      })
      .catch(() => setLoadError(true));
  }

  useEffect(refresh, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const doc = await api.createDocument('Без названия');
      navigate(`/d/${doc.id}`);
    } catch {
      // Offline: still let the person start writing. A local-only id is
      // created; it will register itself with the server once reconnected
      // (the editor room is created lazily on first WebSocket connection).
      const localId = `local-${crypto.randomUUID().slice(0, 12)}`;
      navigate(`/d/${localId}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleRename(id, title) {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, title } : d)));
    try {
      await api.renameDocument(id, title);
    } catch {
      /* offline — the card already reflects the new title locally; the
         document's own Yjs title field will pick it up once it's opened */
    }
    refresh();
  }

  async function handleDelete(id) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    try {
      await api.deleteDocument(id);
    } catch {
      /* offline: nothing more we can do here until reconnected */
    }
  }

  return (
    <div className="ledger-shell">
      <header className="ledger-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ✒
          </span>
          <span className="brand-name">Inkwell</span>
        </div>
        <div className="identity-chip">
          <span className="identity-dot" style={{ background: identity.color }} />
          {identity.name}
        </div>
      </header>

      <main className="ledger-main">
        <div className="ledger-title-row">
          <h1>Документы</h1>
        </div>

        {loadError && docs.length === 0 && (
          <p className="ledger-note">
            Не удалось связаться с сервером. Показываю пусто — как только соединение
            появится, список обновится.
          </p>
        )}
        {loadError && docs.length > 0 && (
          <p className="ledger-note">
            Нет связи с сервером — список ниже сохранён с прошлого посещения.
          </p>
        )}

        <div className="doc-grid">
          <button className="doc-card doc-card--new" onClick={handleCreate} disabled={creating}>
            <span className="doc-card-new-plus" aria-hidden="true">
              +
            </span>
            <span>Новый документ</span>
          </button>

          {docs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onOpen={(id) => navigate(`/d/${id}`)}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {docs.length === 0 && !loadError && (
          <p className="ledger-empty-sub" style={{ marginTop: 24 }}>
            Пока нет ни одного документа — создайте первый и пригласите соавтора.
          </p>
        )}
      </main>
    </div>
  );
}
