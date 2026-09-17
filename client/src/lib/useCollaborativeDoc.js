import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';
import { WS_BASE } from './api.js';


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
    const onLocalSynced = () => setLocalReady(true);

    if (persistence.synced) {
      setLocalReady(true);
    }
    persistence.on('synced', onLocalSynced);
    persistence.whenSynced.then(onLocalSynced).catch(() => {
      setLocalReady(true);
    });
    const fallbackTimer = setTimeout(() => {
      setLocalReady(true);
    }, 300);
    ws.awareness.setLocalStateField('user', {
      id: identity.id,
      name: identity.name,
      color: identity.color,
    });

    const onStatus = ({ status }) => setConnected(status === 'connected');
    const onSync = (isSynced) => setSynced(isSynced);
    ws.on('status', onStatus);
    ws.on('synced', onSync);
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
