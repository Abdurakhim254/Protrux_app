// Uses Node's built-in `node:sqlite` (available since Node 22.5, no npm
// install, no native compilation) instead of a native addon like
// better-sqlite3. This avoids requiring a C++ toolchain (Visual Studio
// Build Tools on Windows, Xcode CLT on macOS) just to run the server —
// the single most common source of setup pain for a project like this.
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const dbPath = path.join(DATA_DIR, 'inkwell.sqlite3');
export const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// documents: metadata only (title, timestamps). The actual rich content
// lives as a Yjs document, reconstructed from `doc_snapshots` + `doc_updates`.
db.exec(`
CREATE TABLE IF NOT EXISTS documents (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT 'Без названия',
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- Compacted Yjs state (binary CRDT snapshot). One row per document.
-- Whenever the incremental update log grows past a threshold we merge
-- everything into this snapshot and clear the log (see persistence.js).
CREATE TABLE IF NOT EXISTS doc_snapshots (
  doc_id      TEXT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  state       BLOB NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- Append-only log of incremental Yjs updates since the last snapshot.
-- This is what makes persistence crash-safe: every change a client makes
-- is durably appended here before it is ever considered "saved".
CREATE TABLE IF NOT EXISTS doc_updates (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_id      TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  update_data BLOB NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_doc_updates_doc_id ON doc_updates(doc_id);
`);

export default db;
