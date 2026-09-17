import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness.js';
import { loadIntoYDoc, appendUpdate, snapshotYDoc, getDocumentMeta, createDocument } from '../db/persistence.js';


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
    this.ydoc.on('update', (update, origin) => {
      if (origin === 'persistence') return;
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
