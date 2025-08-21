const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let broadcaster = null;
let viewer = null;

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    let data;
    try { data = JSON.parse(message); } catch { return; }

    if (data.type === 'broadcaster') {
      broadcaster = ws;
      console.log('Broadcaster registered');
    } else if (data.type === 'viewer') {
      viewer = ws;
      console.log('Viewer registered');
    } else if (broadcaster && viewer) {
      const target = ws === broadcaster ? viewer : broadcaster;
      if (target && target.readyState === WebSocket.OPEN) {
        target.send(message);
      }
    }
  });

  ws.on('close', () => {
    if (ws === broadcaster) broadcaster = null;
    if (ws === viewer) viewer = null;
  });
});

server.listen(8080, () => {
  console.log('Signaling server listening on :8080');
});
