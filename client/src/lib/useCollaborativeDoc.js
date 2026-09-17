import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';
import { WS_BASE } from './api.js';

/**
 * Wires up one Yjs document for a given docId with two persistence/sync
 * layers that work together:
 *
 *  - IndexeddbPersistence: every edit is written to the browser's local
 *    IndexedDB immediately, synchronously with the in-memory CRDT update.
 *    This is what makes editing work fully offline — there is no network
 *    dependency in this path at all.
 *
 *  - WebsocketProvider: connects to the server room when a network is
 *    available. On (re)connect it exchanges Yjs state vectors with the
 *    server (sync protocol), so only the deltas missing on either side are
 *    sent — this is the actual conflict-free merge: both sides just apply
 *    each other's CRDT operations and converge, regardless of how long the
 *    client was offline or in what order edits happened.
 *
 * Status flags exposed: `localReady` (offline storage loaded), `connected`
 * (socket open), `synced` (server confirmed state exchange complete).
 *
 * IMPORTANT: All Yjs instances (Y.Doc, IndexeddbPersistence, WebsocketProvider)
 * are created inside a useEffect so that they are properly re-created after
 * cleanup (e.g. React Strict Mode double-mount). Using useMemo for
 * constructor-like objects that have .destroy() methods is unsafe because
 * useMemo caches values across re-renders but cleanup effects destroy them.
 */
export function useCollaborativeDoc(docId, identity) {
  const [ydoc, setYdoc] = useState(null);
  const [provider, setProvider] = useState(null);
  const [localReady, setLocalReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const doc = new Y.Doc();
    const persistence = new IndexeddbPersistence(`inkwell-doc-${docId}`, doc);
    const ws = new WebsocketProvider(`${WS_BASE}/ws`, docId, doc, {
      connect: navigator.onLine,
    });

    setYdoc(doc);
    setProvider(ws);
    setLocalReady(false);
    setConnected(false);
    setSynced(false);

    // --- Local persistence (IndexedDB) readiness ---
    const onLocalSynced = () => setLocalReady(true);

    if (persistence.synced) {
      setLocalReady(true);
    }
    persistence.on('synced', onLocalSynced);
    persistence.whenSynced.then(onLocalSynced).catch(() => {
      setLocalReady(true);
    });

    // Fallback timer: if IndexedDB doesn't emit synced within 300ms (e.g. empty DB or immediate sync), proceed
    const fallbackTimer = setTimeout(() => {
      setLocalReady(true);
    }, 300);

    // --- WebSocket status ---
    ws.awareness.setLocalStateField('user', {
      id: identity.id,
      name: identity.name,
      color: identity.color,
    });

    const onStatus = ({ status }) => setConnected(status === 'connected');
    const onSync = (isSynced) => setSynced(isSynced);
    ws.on('status', onStatus);
    ws.on('synced', onSync);

    // Track the browser's own connectivity signal to drive reconnect
    // attempts; the WebsocketProvider itself only retries a live socket.
    const goOnline = () => ws.connect();
    const goOffline = () => ws.disconnect();
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      ws.off('status', onStatus);
      ws.off('synced', onSync);
      persistence.off('synced', onLocalSynced);

      ws.destroy();
      persistence.destroy();
      doc.destroy();

      setYdoc(null);
      setProvider(null);
    };
  }, [docId, identity.id, identity.name, identity.color]);

  return { ydoc, provider, localReady, connected, synced };
}
