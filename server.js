const WebSocket = require("ws");

// Create WebSocket server
const server = new WebSocket.Server({ port: 8080 });

// Store active hosts
const hosts = new Map();

// WebSocket connection handling
server.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Received:", data);

      switch (data.type) {
        case "register_host":
          // Store host information
          hosts.set(ws, {
            ip: data.ip,
            port: data.port,
            player_name: data.player_name,
            timestamp: Date.now(),
          });
          console.log("Host registered:", data.ip, data.port);

          // Send confirmation to host
          ws.send(
            JSON.stringify({
              type: "host_registered",
              success: true,
            })
          );
          break;

        case "get_hosts":
          // Send list of available hosts
          const hostList = Array.from(hosts.values()).map((host) => ({
            ip: host.ip,
            port: host.port,
            player_name: host.player_name,
          }));

          ws.send(
            JSON.stringify({
              type: "host_list",
              hosts: hostList,
            })
          );
          break;

        case "look_for_game":
          // Find first available host
          if (hosts.size > 0) {
            const [hostWs, hostInfo] = hosts.entries().next().value;
            console.log("Found host:", hostInfo);

            // Send host info to the joining player
            ws.send(
              JSON.stringify({
                type: "host_info",
                ip: hostInfo.ip,
                port: hostInfo.port,
                player_name: hostInfo.player_name,
              })
            );
          } else {
            // No hosts available
            ws.send(
              JSON.stringify({
                type: "no_hosts",
              })
            );
          }
          break;
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        })
      );
    }
  });

  ws.on("close", () => {
    // Remove host if this connection was hosting
    if (hosts.has(ws)) {
      const hostInfo = hosts.get(ws);
      console.log("Host disconnected:", hostInfo.ip, hostInfo.port);
      hosts.delete(ws);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Clean up stale hosts every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ws, hostInfo] of hosts.entries()) {
    if (now - hostInfo.timestamp > 5 * 60 * 1000) {
      // 5 minutes
      console.log("Removing stale host:", hostInfo.ip, hostInfo.port);
      hosts.delete(ws);
      ws.close();
    }
  }
}, 5 * 60 * 1000);

console.log("Signaling server started on port 8080");
