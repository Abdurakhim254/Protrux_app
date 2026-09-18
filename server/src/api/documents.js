import { Router } from 'express';
import { nanoid } from 'nanoid';
import {
  listDocuments,
  getDocumentMeta,
  createDocument,
  renameDocument,
  deleteDocument,
  getPreviewText,
} from '../db/persistence.js';
import { rooms } from '../ws/rooms.js';

export const documentsRouter = Router();

documentsRouter.get('/', (req, res) => {
  res.json(listDocuments());
});

documentsRouter.post('/', (req, res) => {
  const id = nanoid(12);
  const title = (req.body && req.body.title) || 'Без названия';
  const doc = createDocument(id, title);
  res.status(201).json(doc);
});

documentsRouter.get('/:id', (req, res) => {
  const doc = getDocumentMeta(req.params.id);
  if (!doc) return res.status(404).json({ error: 'not_found' });
  res.json(doc);
});

documentsRouter.get('/:id/preview', (req, res) => {
  const doc = getDocumentMeta(req.params.id);
  if (!doc) return res.status(404).json({ error: 'not_found' });
  try {
    res.json({ preview: getPreviewText(req.params.id) });
  } catch {
    res.json({ preview: '' });
  }
});

documentsRouter.patch('/:id', (req, res) => {
  const existing = getDocumentMeta(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const title = (req.body && req.body.title) ?? existing.title;
  const updatedDoc = renameDocument(req.params.id, title);

  // If document is open in an active room, update Y.Doc meta map
  // so Yjs broadcasts the title update in real-time to open editor tabs!
  const room = rooms.get(req.params.id);
  if (room) {
    const meta = room.ydoc.getMap('meta');
    if (meta.get('title') !== title) {
      meta.set('title', title);
    }
  }

  res.json(updatedDoc);
});

documentsRouter.delete('/:id', (req, res) => {
  deleteDocument(req.params.id);
  res.status(204).end();
});
