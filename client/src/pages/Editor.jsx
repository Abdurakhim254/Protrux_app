import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

import { useCollaborativeDoc } from '../lib/useCollaborativeDoc.js';
import { usePresence } from '../lib/usePresence.js';
import { useOutline } from '../lib/useOutline.js';
import { getIdentity } from '../lib/user.js';
import { api } from '../lib/api.js';
import Toolbar from '../components/Toolbar.jsx';
import PresenceBar from '../components/PresenceBar.jsx';
import ConnectionStatus from '../components/ConnectionStatus.jsx';
import OutlineSidebar from '../components/OutlineSidebar.jsx';

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

export default function EditorPage() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const identity = useMemo(() => getIdentity(), []);
  const online = useOnlineStatus();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { ydoc, provider, localReady, connected, synced } = useCollaborativeDoc(docId, identity);
  const peers = usePresence(provider);

  // Document title lives inside the Yjs doc itself (a small shared map), so
  // renames sync in real time and survive offline edits just like the body.
  // ydoc may be null briefly while the effect initialises, so guard access.
  const meta = useMemo(() => ydoc?.getMap('meta') ?? null, [ydoc]);
  const [title, setTitle] = useState('');
  const titleSaveTimer = useRef(null);

  useEffect(() => {
    if (!meta) return;
    // Initialise title from the Yjs map once it becomes available
    setTitle(meta.get('title') || '');
    const onMetaChange = () => setTitle(meta.get('title') || '');
    meta.observe(onMetaChange);
    return () => meta.unobserve(onMetaChange);
  }, [meta]);

  // If this document was renamed from the list page before anyone ever
  // opened it, the REST title and the Yjs title can briefly disagree (the
  // list only patches SQLite). Once we're locally synced, adopt the REST
  // title into the shared doc if the doc itself has no title of its own yet.
  useEffect(() => {
    if (!localReady || !meta || meta.get('title')) return;
    api
      .getDocument(docId)
      .then((doc) => {
        if (doc?.title && !meta.get('title')) meta.set('title', doc.title);
      })
      .catch(() => {
        /* offline or a brand-new local-only doc: nothing to reconcile yet */
      });
  }, [localReady, meta, docId]);

  function handleTitleChange(value) {
    if (!meta) return;
    meta.set('title', value);
    clearTimeout(titleSaveTimer.current);
    titleSaveTimer.current = setTimeout(() => {
      api.renameDocument(docId, value || 'Без названия').catch(() => {
        /* offline: the Yjs update above already persisted locally via
           IndexedDB and will reach the server's document record once the
           title field is next read by a connected client */
      });
    }, 500);
  }

  const extensions = useMemo(() => {
    const list = [
      StarterKit.configure({ history: false }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Начните писать…' }),
    ];
    if (ydoc && provider) {
      list.push(
        Collaboration.configure({ document: ydoc }),
        CollaborationCaret.configure({
          provider,
          user: { name: identity.name, color: identity.color },
        })
      );
    }
    return list;
  }, [ydoc, provider, identity.name, identity.color]);

  const editor = useEditor(
    {
      extensions,
      editorProps: {
        attributes: {
          class: 'sheet-content',
          spellCheck: 'true',
        },
      },
    },
    [ydoc, provider]
  );

  const headings = useOutline(editor);

  return (
    <div className="editor-shell">
      <header className="editor-header">
        <button className="btn-icon" onClick={() => navigate('/')} title="К списку документов" aria-label="К списку документов">
          ←
        </button>
        <button
          className={`btn-icon${sidebarOpen ? ' is-active' : ''}`}
          onClick={() => setSidebarOpen((v) => !v)}
          title="Оглавление"
          aria-label="Показать/скрыть оглавление"
          aria-pressed={sidebarOpen}
        >
          ☰
        </button>
        <input
          className="doc-title-input"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Без названия"
        />
        <div className="editor-header-right">
          <ConnectionStatus online={online} connected={connected} synced={synced} />
          <PresenceBar peers={peers} me={identity} />
        </div>
      </header>

      <Toolbar editor={editor} />

      <div className="editor-body">
        {sidebarOpen && <OutlineSidebar editor={editor} headings={headings} />}

        <main className="sheet-wrap">
          {!localReady ? (
            <div className="sheet-loading">Открываю документ…</div>
          ) : (
            <div className="sheet">
              <EditorContent editor={editor} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
