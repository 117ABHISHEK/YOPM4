import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:3001'); // Connect to your server

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 15;
const PADDLE_SPEED = 10;

function App() {
  const [gameState, setGameState] = useState(null);
  const [gameMode, setGameMode] = useState(null); // null, 'online', or 'offline'
  const gameAreaRef = useRef(null);
  const keysPressedRef = useRef({});
  const gameLoopId = useRef(null);

  useEffect(() => {
    if (gameMode === 'online') {
      // --- ONLINE MODE LOGIC ---
      socket.connect();
      socket.on('playerAssigned', (role) => console.log(`You are ${role}`));
      socket.on('gameState', setGameState);

      const handleMouseMove = (e) => {
        if (gameAreaRef.current) {
          const gameArea = gameAreaRef.current.getBoundingClientRect();
          let newY = e.clientY - gameArea.top - PADDLE_HEIGHT / 2;
          if (newY < 0) newY = 0;
          if (newY > GAME_HEIGHT - PADDLE_HEIGHT) newY = GAME_HEIGHT - PADDLE_HEIGHT;
          socket.emit('paddleMove', { y: newY });
        }
      };
      window.addEventListener('mousemove', handleMouseMove);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        socket.off('playerAssigned');
        socket.off('gameState');
        socket.disconnect();
      };
    } else if (gameMode === 'offline') {
      // --- OFFLINE MODE LOGIC ---
      const resetBall = (direction) => ({
        x: GAME_WIDTH / 2 - BALL_SIZE / 2,
        y: GAME_HEIGHT / 2 - BALL_SIZE / 2,
        vx: direction * 5, // Initial speed
        vy: (Math.random() * 2 - 1) * 5,
      });

      const initialState = {
        paddles: {
          player1: { y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
          player2: { y: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
        },
        ball: resetBall(1),
        score: { player1: 0, player2: 0 },
      };
      setGameState(initialState);

      const handleKeyDown = (e) => { keysPressedRef.current[e.key.toLowerCase()] = true; };
      const handleKeyUp = (e) => { keysPressedRef.current[e.key.toLowerCase()] = false; };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      const gameLoop = () => {
        setGameState((prev) => {
          if (!prev) return prev;

          // More performant state update than JSON.parse(JSON.stringify())
          const newState = {
            ...prev,
            paddles: { ...prev.paddles },
            ball: { ...prev.ball },
          };
          let { paddles, ball, score } = newState;

          // Paddle 1 Movement (W, S)
          if (keysPressedRef.current['w']) paddles.player1.y -= PADDLE_SPEED;
          if (keysPressedRef.current['s']) paddles.player1.y += PADDLE_SPEED;

          // Paddle 2 Movement (Arrow Keys)
          if (keysPressedRef.current['arrowup']) paddles.player2.y -= PADDLE_SPEED;
          if (keysPressedRef.current['arrowdown']) paddles.player2.y += PADDLE_SPEED;

          // Constrain paddles
          paddles.player1.y = Math.max(0, Math.min(paddles.player1.y, GAME_HEIGHT - PADDLE_HEIGHT));
          paddles.player2.y = Math.max(0, Math.min(paddles.player2.y, GAME_HEIGHT - PADDLE_HEIGHT));

          // Ball movement
          ball.x += ball.vx;
          ball.y += ball.vy;

          // Wall collision (top/bottom)
          if (ball.y <= 0 || ball.y >= GAME_HEIGHT - BALL_SIZE) {
            ball.vy *= -1;
          }

          // Paddle collision
          // Player 1
          if (ball.vx < 0 && ball.x <= PADDLE_WIDTH && ball.y + BALL_SIZE >= paddles.player1.y && ball.y <= paddles.player1.y + PADDLE_HEIGHT) {
            ball.vx *= -1.1; // Increase speed on hit
          }
          // Player 2
          if (ball.vx > 0 && ball.x >= GAME_WIDTH - PADDLE_WIDTH - BALL_SIZE && ball.y + BALL_SIZE >= paddles.player2.y && ball.y <= paddles.player2.y + PADDLE_HEIGHT) {
            ball.vx *= -1.1; // Increase speed on hit
          }

          // Score
          if (ball.x < 0) { // Player 2 scores
            score.player2++;
            newState.ball = resetBall(1); // Serve to player 1
          } else if (ball.x > GAME_WIDTH) { // Player 1 scores
            score.player1++;
            newState.ball = resetBall(-1); // Serve to player 2
          }

          return newState;
        });
        gameLoopId.current = requestAnimationFrame(gameLoop);
      };

      gameLoopId.current = requestAnimationFrame(gameLoop);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        cancelAnimationFrame(gameLoopId.current);
      };
    }
  }, [gameMode]);

  if (!gameMode) {
    return (
      <div className="game-container">
        <h1>Pong Game</h1>
        <div className="menu">
          <h2>Select Game Mode</h2>
          <button onClick={() => setGameMode('online')}>Online Multiplayer</button>
          <button onClick={() => setGameMode('offline')}>Offline 2-Player</button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="game-container">
        <h1>Pong Game</h1>
        <div>
          {gameMode === 'online'
            ? 'Waiting for another player to join...'
            : 'Loading game...'}
        </div>
      </div>
    );
  }

  const goBackToMenu = () => {
    setGameMode(null);
    setGameState(null);
  };

  return (
    <div className="game-container">
      <div className="header">
        <h1>Pong Game</h1>
        <button onClick={goBackToMenu} className="menu-button">Back to Menu</button>
      </div>
      <div className="score">
        {gameState.score.player1} - {gameState.score.player2}
      </div>
      <div ref={gameAreaRef} className="game-area" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
        <div
          className="paddle"
          style={{
            left: 0,
            top: gameState.paddles.player1.y,
            height: PADDLE_HEIGHT,
            width: PADDLE_WIDTH,
          }}
        />
        <div
          className="ball"
          style={{ left: gameState.ball.x, top: gameState.ball.y, width: BALL_SIZE, height: BALL_SIZE }}
        />
        <div
          className="paddle"
          style={{
            right: 0,
            top: gameState.paddles.player2.y,
            height: PADDLE_HEIGHT,
            width: PADDLE_WIDTH,
          }}
        />
      </div>
    </div>
  );
}


export default App;