import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as syncProtocol from 'y-protocols/sync.js';
import * as awarenessProtocol from 'y-protocols/awareness.js';
import { getRoom } from './rooms.js';

const MSG_SYNC = 0;
const MSG_AWARENESS = 1;

const PING_INTERVAL = 25000;

function send(conn, encoder) {
  if (encoding.length(encoder) === 0) return;
  const buf = encoding.toUint8Array(encoder);
  if (conn.ws.readyState === conn.ws.OPEN) {
    try {
      conn.ws.send(buf);
    } catch (e) {
      conn.ws.close();
    }
  }
}

/**
 * One connection = one browser tab. Tracks which awareness clientIDs it
 * "owns" so we can clear cursors/presence for this tab the instant it
 * disconnects (see rooms.js removeConn).
 */
export function handleConnection(ws, docId, req) {
  const room = getRoom(docId);
  const conn = { ws, docId, controlledClientIDs: new Set() };
  room.addConn(conn);

  ws.binaryType = 'arraybuffer';

  // --- initial handshake: server sends SyncStep1 + current awareness ---
  {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    syncProtocol.writeSyncStep1(encoder, room.ydoc);
    send(conn, encoder);

    const states = room.awareness.getStates();
    if (states.size > 0) {
      const encoderAwareness = encoding.createEncoder();
      encoding.writeVarUint(encoderAwareness, MSG_AWARENESS);
      encoding.writeVarUint8Array(
        encoderAwareness,
        awarenessProtocol.encodeAwarenessUpdate(room.awareness, Array.from(states.keys()))
      );
      send(conn, encoderAwareness);
    }
  }

  const updateHandler = (update, origin) => {
    if (origin === conn) return; // don't echo back to the sender
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    send(conn, encoder);
  };
  room.ydoc.on('update', updateHandler);

  const awarenessChangeHandler = ({ added, updated, removed }, origin) => {
    const changed = added.concat(updated, removed);
    if (origin === conn) return;
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, changed)
    );
    send(conn, encoder);
  };
  room.awareness.on('update', awarenessChangeHandler);

  ws.on('message', (data) => {
    try {
      const decoder = decoding.createDecoder(new Uint8Array(data));
      const messageType = decoding.readVarUint(decoder);
      switch (messageType) {
        case MSG_SYNC: {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MSG_SYNC);
          syncProtocol.readSyncMessage(decoder, encoder, room.ydoc, conn);
          if (encoding.length(encoder) > 1) send(conn, encoder);
          break;
        }
        case MSG_AWARENESS: {
          const update = decoding.readVarUint8Array(decoder);
          awarenessProtocol.applyAwarenessUpdate(room.awareness, update, conn);
          // Track which clientIDs this connection introduced, so that if the
          // socket drops we know exactly which cursors/presence to clear.
          // Format written by encodeAwarenessUpdate: [numClients, (clientID, clock, stateJSON)...]
          const d = decoding.createDecoder(update);
          const numClients = decoding.readVarUint(d);
          for (let i = 0; i < numClients; i++) {
            const clientID = decoding.readVarUint(d);
            decoding.readVarUint(d); // clock, unused here
            decoding.readVarString(d); // state json, unused here
            conn.controlledClientIDs.add(clientID);
          }
          break;
        }
        default:
          break;
      }
    } catch (err) {
      console.error('[ws] message handling error', err);
    }
  });

  const pingInterval = setInterval(() => {
    if (ws.readyState !== ws.OPEN) {
      clearInterval(pingInterval);
      return;
    }
    try {
      ws.ping();
    } catch {
      clearInterval(pingInterval);
    }
  }, PING_INTERVAL);

  const cleanup = () => {
    clearInterval(pingInterval);
    room.ydoc.off('update', updateHandler);
    room.awareness.off('update', awarenessChangeHandler);
    awarenessProtocol.removeAwarenessStates(
      room.awareness,
      Array.from(conn.controlledClientIDs),
      conn
    );
    room.removeConn(conn);
  };

  ws.on('close', cleanup);
  ws.on('error', cleanup);
}
