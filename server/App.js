import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:3001'); // Connect to your server

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 15;

function App() {
  const [gameState, setGameState] = useState(null);
  const [playerRole, setPlayerRole] = useState('');
  const gameAreaRef = useRef(null);

  useEffect(() => {
    // Listen for the initial player assignment
    socket.on('playerAssigned', (role) => {
      console.log(`You are ${role}`);
      setPlayerRole(role);
    });

    // Listen for game state updates from the server
    socket.on('gameState', (newGameState) => {
      setGameState(newGameState);
    });

    // Handle mouse movement to control the paddle
    const handleMouseMove = (e) => {
      if (gameAreaRef.current) {
        const gameArea = gameAreaRef.current.getBoundingClientRect();
        // Calculate paddle position relative to the game area
        let newY = e.clientY - gameArea.top - PADDLE_HEIGHT / 2;

        // Constrain paddle within game bounds
        if (newY < 0) newY = 0;
        if (newY > GAME_HEIGHT - PADDLE_HEIGHT) newY = GAME_HEIGHT - PADDLE_HEIGHT;

        socket.emit('paddleMove', { y: newY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      socket.disconnect();
    };
  }, []);

  if (!gameState) {
    return <div>Waiting for another player to join...</div>;
  }

  return (
    <div className="game-container">
      <h1>Pong Game</h1>
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