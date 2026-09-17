import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { documentsRouter } from './api/documents.js';
import { handleConnection } from './ws/connection.js';
import { rooms } from './ws/rooms.js';
import { snapshotYDoc } from './db/persistence.js';

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/documents', documentsRouter);

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const match = url.pathname.match(/^\/ws\/([A-Za-z0-9_-]+)$/);
  if (!match) {
    socket.destroy();
    return;
  }
  const docId = match[1];
  wss.handleUpgrade(req, socket, head, (ws) => {
    handleConnection(ws, docId, req);
  });
});

server.listen(PORT, () => {
  console.log(`Inkwell server listening on http://localhost:${PORT}`);
  console.log(`WebSocket sync endpoint: ws://localhost:${PORT}/ws/:docId`);
});

function shutdown() {
  console.log('\nShutting down — persisting all open documents…');
  for (const room of rooms.values()) {
    snapshotYDoc(room.docId, room.ydoc);
  }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
