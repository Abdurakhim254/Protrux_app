import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness.js';
import { loadIntoYDoc, appendUpdate, snapshotYDoc, getDocumentMeta, createDocument } from '../db/persistence.js';

/**
 * A Room holds the single source-of-truth Y.Doc for one document on this
 * server process, plus the Awareness state (who's online, cursors, colors)
 * and the set of currently connected sockets. Every socket editing the same
 * document shares this one Y.Doc — the CRDT itself guarantees that whatever
 * order updates arrive in, all clients converge to the same content.
 */
class Room {
  constructor(docId) {
    this.docId = docId;
    this.ydoc = new Y.Doc();
    this.awareness = new Awareness(this.ydoc);
    this.awareness.setLocalState(null); // server itself has no cursor
    this.conns = new Set();
    this.persistTimer = null;

    if (!getDocumentMeta(docId)) {
      createDocument(docId, 'Без названия');
    }
    loadIntoYDoc(docId, this.ydoc);

    // Persist every incremental change immediately (durable log), and also
    // batch a full snapshot shortly after activity settles.
    this.ydoc.on('update', (update, origin) => {
      if (origin === 'persistence') return; // avoid re-persisting what we just loaded
      appendUpdate(docId, update);
      this._scheduleIdleSnapshot();
    });
  }

  _scheduleIdleSnapshot() {
    clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      snapshotYDoc(this.docId, this.ydoc);
    }, 4000);
  }

  addConn(conn) {
    this.conns.add(conn);
  }

  removeConn(conn) {
    // Awareness state for this connection's clientIDs is already cleared by
    // the caller (see connection.js `cleanup`) before this runs.
    this.conns.delete(conn);
    if (this.conns.size === 0) {
      clearTimeout(this.persistTimer);
      snapshotYDoc(this.docId, this.ydoc);
      rooms.delete(this.docId);
      this.ydoc.destroy();
    }
  }
}

export const rooms = new Map();

export function getRoom(docId) {
  let room = rooms.get(docId);
  if (!room) {
    room = new Room(docId);
    rooms.set(docId, room);
  }
  return room;
}
