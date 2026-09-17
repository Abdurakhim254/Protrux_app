import * as Y from 'yjs';
import { db } from './database.js';

const COMPACT_THRESHOLD = 150;

const stmts = {
  getDoc: db.prepare('SELECT * FROM documents WHERE id = ?'),
  listDocs: db.prepare('SELECT id, title, created_at, updated_at FROM documents ORDER BY updated_at DESC'),
  insertDoc: db.prepare('INSERT INTO documents (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)'),
  touchDoc: db.prepare('UPDATE documents SET updated_at = ? WHERE id = ?'),
  renameDoc: db.prepare('UPDATE documents SET title = ?, updated_at = ? WHERE id = ?'),
  deleteDoc: db.prepare('DELETE FROM documents WHERE id = ?'),

  getSnapshot: db.prepare('SELECT state FROM doc_snapshots WHERE doc_id = ?'),
  upsertSnapshot: db.prepare(`
    INSERT INTO doc_snapshots (doc_id, state, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(doc_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at
  `),

  getUpdates: db.prepare('SELECT update_data AS "update" FROM doc_updates WHERE doc_id = ? ORDER BY id ASC'),
  countUpdates: db.prepare('SELECT COUNT(*) AS n FROM doc_updates WHERE doc_id = ?'),
  insertUpdate: db.prepare('INSERT INTO doc_updates (doc_id, update_data, created_at) VALUES (?, ?, ?)'),
  clearUpdates: db.prepare('DELETE FROM doc_updates WHERE doc_id = ?'),
};

function inTransaction(fn) {
  db.exec('BEGIN');
  try {
    fn();
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function listDocuments() {
  return stmts.listDocs.all();
}

export function getDocumentMeta(id) {
  return stmts.getDoc.get(id);
}

export function createDocument(id, title) {
  const now = Date.now();
  stmts.insertDoc.run(id, title || 'Без названия', now, now);
  return stmts.getDoc.get(id);
}

export function renameDocument(id, title) {
  stmts.renameDoc.run(title, Date.now(), id);
  return stmts.getDoc.get(id);
}

export function deleteDocument(id) {
  stmts.deleteDoc.run(id);
}

export function touchDocument(id) {
  stmts.touchDoc.run(Date.now(), id);
}


export function loadIntoYDoc(docId, ydoc) {
  const snapshot = stmts.getSnapshot.get(docId);
  if (snapshot) {
    Y.applyUpdate(ydoc, new Uint8Array(snapshot.state), 'persistence');
  }
  const rows = stmts.getUpdates.all(docId);
  for (const row of rows) {
    Y.applyUpdate(ydoc, new Uint8Array(row.update), 'persistence');
  }
  return ydoc;
}


export function appendUpdate(docId, update) {
  stmts.insertUpdate.run(docId, Buffer.from(update), Date.now());
  touchDocument(docId);
  const { n } = stmts.countUpdates.get(docId);
  if (n >= COMPACT_THRESHOLD) {
    compact(docId);
  }
}


export function compact(docId) {
  const tmp = new Y.Doc();
  loadIntoYDoc(docId, tmp);
  const state = Y.encodeStateAsUpdate(tmp);
  inTransaction(() => {
    stmts.upsertSnapshot.run(docId, Buffer.from(state), Date.now());
    stmts.clearUpdates.run(docId);
  });
  tmp.destroy();
}


export function snapshotYDoc(docId, ydoc) {
  const state = Y.encodeStateAsUpdate(ydoc);
  inTransaction(() => {
    stmts.upsertSnapshot.run(docId, Buffer.from(state), Date.now());
    stmts.clearUpdates.run(docId);
  });
}


export function getPreviewText(docId, maxLen = 180) {
  const tmp = new Y.Doc();
  loadIntoYDoc(docId, tmp);
  const fragment = tmp.getXmlFragment('default');

  let text = '';
  function walk(node) {
    if (text.length >= maxLen) return;
    if (node instanceof Y.XmlText) {
      for (const op of node.toDelta()) {
        if (typeof op.insert === 'string') text += op.insert;
      }
    } else if (node && typeof node.toArray === 'function') {
      for (const child of node.toArray()) {
        walk(child);
        if (text.length >= maxLen) return;
      }
      text += ' ';
    }
  }
  walk(fragment);
  tmp.destroy();

  text = text.replace(/\s+/g, ' ').trim();
  return text.length > maxLen ? `${text.slice(0, maxLen).trim()}…` : text;
}
