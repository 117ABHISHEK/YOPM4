require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your frontend's URL
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// A simple health-check route
app.get('/', (req, res) => {
  res.send('<h1>YOPM4 Server is running!</h1>');
});

// --- Game Logic ---

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 15;

let gameState = {
  ball: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, dx: 5, dy: 5 },
  paddles: {
    player1: { y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
    player2: { y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2 }
  },
  score: { player1: 0, player2: 0 },
  gameActive: false
};

let players = {};
let gameInterval = null;

function gameLoop() {
  if (!gameState.gameActive) return;

  // Move ball
  gameState.ball.x += gameState.ball.dx;
  gameState.ball.y += gameState.ball.dy;

  // Wall collision (top/bottom)
  if (gameState.ball.y <= 0 || gameState.ball.y >= GAME_HEIGHT - BALL_SIZE) {
    gameState.ball.dy *= -1;
  }

  // TODO: Add paddle collision logic

  // Score detection
  if (gameState.ball.x <= 0) {
    gameState.score.player2++;
    resetBall();
  } else if (gameState.ball.x >= GAME_WIDTH - BALL_SIZE) {
    gameState.score.player1++;
    resetBall();
  }

  // Broadcast the state to all players
  io.emit('gameState', gameState);
}

function resetBall() {
  gameState.ball.x = GAME_WIDTH / 2;
  gameState.ball.y = GAME_HEIGHT / 2;
  // Flip direction for the next serve
  gameState.ball.dx *= -1;
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Assign player number
  let playerRole;
  if (Object.keys(players).length === 0) {
    playerRole = 'player1';
  } else if (Object.keys(players).length === 1) {
    playerRole = 'player2';
  } else {
    // Spectator
    socket.emit('spectator');
    return;
  }
  players[socket.id] = playerRole;
  socket.emit('playerAssigned', playerRole);

  // Start game when two players are connected
  if (Object.keys(players).length === 2) {
    gameState.gameActive = true;
    gameInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS
  }

  socket.on('paddleMove', (data) => {
    const role = players[socket.id];
    if (role && gameState.paddles[role]) {
      gameState.paddles[role].y = data.y;
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    // TODO: Add logic to stop the game and reset state
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});