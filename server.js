const WebSocket = require("ws");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

// Create WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

// Store active hosts
const hosts = new Map();

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.register_host) {
        // Register a new host
        const hostInfo = {
          ip: data.register_host.ip,
          port: data.register_host.port,
          playerName: data.register_host.player_name,
          ws: ws,
        };
        hosts.set(ws, hostInfo);
        console.log(
          `Host registered: ${hostInfo.playerName} at ${hostInfo.ip}:${hostInfo.port}`
        );
        ws.send(JSON.stringify({ status: "host_registered" }));
      } else if (data.looking_for_game) {
        // Client is looking for a game
        if (hosts.size > 0) {
          // Get the first available host
          const [hostWs, hostInfo] = hosts.entries().next().value;
          ws.send(
            JSON.stringify({
              host: {
                ip: hostInfo.ip,
                port: hostInfo.port,
                playerName: hostInfo.playerName,
              },
            })
          );
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
    // Remove host if this connection was hosting
    if (hosts.has(ws)) {
      const hostInfo = hosts.get(ws);
      console.log(`Host disconnected: ${hostInfo.playerName}`);
      hosts.delete(ws);
    }
  });
});

// Simple HTTP server for health checks
app.get("/", (req, res) => {
  res.send("Signaling server is running");
});

app.listen(port, () => {
  console.log(`HTTP server listening on port ${port}`);
  console.log(`WebSocket server listening on port 8080`);
});
