const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

let rooms = {
    room1: [],
    room2: [],
    room3: []
};

function broadcastToRoom(room, data) {
    rooms[room].forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    });
}

wss.on("connection", ws => {

    ws.on("message", msg => {
        let data = JSON.parse(msg.toString());

        if (data.type === "joinRoom") {

            let room = data.room;

            if (!rooms[room]) return;

            if (rooms[room].length >= 10) {
                ws.send(JSON.stringify({ type: "full" }));
                return;
            }

            ws.room = room;
            rooms[room].push(ws);

            broadcastToRoom(room, {
                type: "update",
                count: rooms[room].length
            });
        }

        // WebRTC signaling messages
        if (data.type === "signal") {
            broadcastToRoom(ws.room, data);
        }
    });

    ws.on("close", () => {
        if (ws.room) {
            rooms[ws.room] = rooms[ws.room].filter(c => c !== ws);

            broadcastToRoom(ws.room, {
                type: "update",
                count: rooms[ws.room].length
            });
        }
    });

});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
