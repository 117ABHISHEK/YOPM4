const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();

const Match = require("./models/Match");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not defined in the .env file. Please add it.");
    process.exit(1); // Exit the process with an error code
}

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB connected successfully"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

app.use(express.static("client"));

// Store game states per room
const rooms = {};

io.on("connection", (socket) => {
    console.log("⚡ Player connected:", socket.id);

    // Join/create a room
    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        if (!rooms[roomId]) {
            rooms[roomId] = createNewGameState();
        }
        socket.emit("init", rooms[roomId]);
    });

    // Paddle movement
    socket.on("movePaddle", ({ roomId, player, y }) => {
        if (rooms[roomId]) {
            rooms[roomId].paddles[player] = y;
            io.to(roomId).emit("update", rooms[roomId]);
        }
    });

    socket.on("disconnect", () => {
        console.log("❌ Player disconnected:", socket.id);
    });
});

// Game loop for all rooms
setInterval(() => {
    for (let roomId in rooms) {
        const game = rooms[roomId];
        updateGameState(game);

        io.to(roomId).emit("update", game);

        // Check win condition
        if (game.scores.p1 >= 10 || game.scores.p2 >= 10) {
            const winner = game.scores.p1 >= 10 ? "Player 1" : "Player 2";
            saveMatch(roomId, game, winner);
            rooms[roomId] = createNewGameState(); // reset
        }
    }
}, 1000 / 60);

function createNewGameState() {
    return {
        ball: { x: 300, y: 200, vx: 4, vy: 4 },
        paddles: { p1: 150, p2: 150 },
        scores: { p1: 0, p2: 0 }
    };
}

function updateGameState(game) {
    game.ball.x += game.ball.vx;
    game.ball.y += game.ball.vy;

    // Bounce top/bottom
    if (game.ball.y <= 0 || game.ball.y >= 400) game.ball.vy *= -1;

    // Paddle collision
    if (game.ball.x <= 30 && game.ball.y >= game.paddles.p1 && game.ball.y <= game.paddles.p1 + 60) {
        game.ball.vx *= -1;
    }
    if (game.ball.x >= 560 && game.ball.y >= game.paddles.p2 && game.ball.y <= game.paddles.p2 + 60) {
        game.ball.vx *= -1;
    }

    // Scoring
    if (game.ball.x <= 0) {
        game.scores.p2++;
        resetBall(game);
    }
    if (game.ball.x >= 600) {
        game.scores.p1++;
        resetBall(game);
    }
}

function resetBall(game) {
    game.ball = { x: 300, y: 200, vx: 4 * (Math.random() > 0.5 ? 1 : -1), vy: 4 };
}

async function saveMatch(roomId, game, winner) {
    const match = new Match({
        players: ["Player 1", "Player 2"], // replace with real usernames later
        scores: game.scores,
        winner: winner
    });
    await match.save();
    console.log(`💾 Match saved for room ${roomId}`);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
