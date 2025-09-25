const socket = io();
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = {};
let roomId = prompt("Enter Room ID to join (e.g. room1):") || "default";

// Join a room
socket.emit("joinRoom", roomId);

socket.on("init", (state) => {
    gameState = state;
    draw();
});

socket.on("update", (state) => {
    gameState = state;
    draw();
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ball
    ctx.fillStyle = "white";
    ctx.fillRect(gameState.ball.x, gameState.ball.y, 10, 10);

    // Paddles
    ctx.fillRect(20, gameState.paddles.p1, 10, 60);
    ctx.fillRect(570, gameState.paddles.p2, 10, 60);

    // Scores
    ctx.font = "20px monospace";
    ctx.fillText(gameState.scores.p1, 200, 30);
    ctx.fillText(gameState.scores.p2, 380, 30);
}

// Paddle controls
document.addEventListener("keydown", (e) => {
    if (e.key === "w") socket.emit("movePaddle", { roomId, player: "p1", y: gameState.paddles.p1 - 10 });
    if (e.key === "s") socket.emit("movePaddle", { roomId, player: "p1", y: gameState.paddles.p1 + 10 });
    if (e.key === "ArrowUp") socket.emit("movePaddle", { roomId, player: "p2", y: gameState.paddles.p2 - 10 });
    if (e.key === "ArrowDown") socket.emit("movePaddle", { roomId, player: "p2", y: gameState.paddles.p2 + 10 });
});
