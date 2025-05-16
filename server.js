const WebSocket = require("ws");

// Create WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

// Store active hosts
const hosts = new Map();

// WebSocket connection handling
wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Received:", data);

      if (data.register_host) {
        // Register a new host
        const hostInfo = data.register_host;
        hosts.set(ws, {
          ip: hostInfo.ip,
          port: hostInfo.port,
          playerName: hostInfo.player_name,
        });
        console.log("Host registered:", hostInfo);
        ws.send(JSON.stringify({ status: "host_registered" }));
      } else if (data.looking_for_game) {
        // Client is looking for a game
        if (hosts.size > 0) {
          // Send the first available host
          const [hostWs, hostInfo] = hosts.entries().next().value;
          ws.send(JSON.stringify({ host: hostInfo }));
        } else {
          ws.send(JSON.stringify({ status: "no_hosts" }));
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(JSON.stringify({ error: "Invalid message format" }));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    // Remove host if this connection was hosting
    if (hosts.has(ws)) {
      hosts.delete(ws);
      console.log("Host removed");
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

console.log("WebSocket server is running on ws://localhost:8080");
