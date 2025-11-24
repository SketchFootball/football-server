const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let rooms = {};

io.on("connection", (socket) => {
    console.log("Baglanti:", socket.id);

    socket.on("create_room", (username) => {
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        rooms[roomCode] = { host: username, players: [socket.id] };
        socket.join(roomCode);
        socket.emit("room_created", roomCode, "home");
        console.log(`Oda: ${roomCode}`);
    });

    socket.on("join_room", (code, username) => {
        if (rooms[code]) {
            rooms[code].players.push(socket.id);
            socket.join(code);
            socket.emit("room_joined", code, "away");
            io.to(code).emit("player_joined", username);
            io.to(code).emit("start_game_online");
        } else {
            socket.emit("error", "Oda yok");
        }
    });

    socket.on("game_action", (code, state) => {
        socket.to(code).emit("sync_game_state", state);
    });

    socket.on("leave_room", (code) => {
         socket.leave(code);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda calisiyor`);
});
