const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

// Store connected clients and their rooms
const clients = new Map();
const rooms = new Map();

wss.on("connection", (ws) => {
  const clientId = generateId();
  clients.set(clientId, ws);

  console.log(`Client ${clientId} connected`);

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case "create_room":
        createRoom(clientId, data.roomId);
        break;
      case "join_room":
        joinRoom(clientId, data.roomId);
        break;
      case "offer":
      case "answer":
      case "ice_candidate":
        forwardMessage(clientId, data);
        break;
    }
  });

  ws.on("close", () => {
    console.log(`Client ${clientId} disconnected`);
    removeClient(clientId);
  });
});

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function createRoom(clientId, roomId) {
  rooms.set(roomId, new Set([clientId]));
  clients.get(clientId).send(
    JSON.stringify({
      type: "room_created",
      roomId: roomId,
    })
  );
}

function joinRoom(clientId, roomId) {
  const room = rooms.get(roomId);
  if (room) {
    room.add(clientId);
    // Notify all clients in the room about the new peer
    room.forEach((peerId) => {
      if (peerId !== clientId) {
        clients.get(peerId).send(
          JSON.stringify({
            type: "peer_joined",
            peerId: clientId,
          })
        );
      }
    });
  }
}

function forwardMessage(senderId, data) {
  const room = Array.from(rooms.values()).find((r) => r.has(senderId));
  if (room) {
    room.forEach((peerId) => {
      if (peerId !== senderId) {
        clients.get(peerId).send(
          JSON.stringify({
            ...data,
            senderId: senderId,
          })
        );
      }
    });
  }
}

function removeClient(clientId) {
  clients.delete(clientId);
  // Remove client from all rooms
  rooms.forEach((room, roomId) => {
    if (room.has(clientId)) {
      room.delete(clientId);
      if (room.size === 0) {
        rooms.delete(roomId);
      } else {
        // Notify remaining peers
        room.forEach((peerId) => {
          clients.get(peerId).send(
            JSON.stringify({
              type: "peer_left",
              peerId: clientId,
            })
          );
        });
      }
    }
  });
}

console.log("Signaling server running on port 8080");
