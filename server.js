// signaling-server.js (Node.js)
const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 8080 });

let hostInfo = null; // { ip: '123.45.67.89', port: 2450, player_name: 'HostName' }

server.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.action === "looking_for_game") {
        if (hostInfo) {
          socket.send(JSON.stringify({ host: hostInfo }));
        } else {
          socket.send(JSON.stringify({ action: "no_hosts" }));
        }
      }

      if (data.register_host) {
        hostInfo = data.register_host;
        console.log("Host registered:", hostInfo);
      }

      if (data.action === "unregister_host") {
        hostInfo = null;
        console.log("Host unregistered");
      }
    } catch (e) {
      console.error("Invalid message", e);
    }
  });

  socket.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log("WebSocket signaling server running on ws://localhost:8080");
