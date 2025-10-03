// /app/(site)/minecraft-zone/game/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";

const CANVAS_SIZE = { x: 400, y: 400 };
const SCALE = 20;
const INITIAL_SNAKE = [
  [8, 7],
  [8, 8],
];
const INITIAL_DIRECTION = [0, -1];
const INITIAL_FOOD = [10, 10];

export default function SnakeGamePage() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [speed, setSpeed] = useState(150);
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle keyboard input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          setDirection([0, -1]);
          break;
        case "ArrowDown":
          setDirection([0, 1]);
          break;
        case "ArrowLeft":
          setDirection([-1, 0]);
          break;
        case "ArrowRight":
          setDirection([1, 0]);
          break;
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameOver) return;

    const moveSnake = () => {
      const newSnake = [...snake];
      const head = [
        newSnake[0][0] + direction[0],
        newSnake[0][1] + direction[1],
      ];
      newSnake.unshift(head);

      // Check food collision
      if (head[0] === food[0] && head[1] === food[1]) {
        setFood([
          Math.floor(Math.random() * (CANVAS_SIZE.x / SCALE)),
          Math.floor(Math.random() * (CANVAS_SIZE.y / SCALE)),
        ]);
        setSpeed((s) => Math.max(s - 5, 50));
      } else {
        newSnake.pop();
      }

      // Check wall or self collision
      if (
        head[0] < 0 ||
        head[1] < 0 ||
        head[0] >= CANVAS_SIZE.x / SCALE ||
        head[1] >= CANVAS_SIZE.y / SCALE ||
        newSnake
          .slice(1)
          .some((s) => s[0] === head[0] && s[1] === head[1])
      ) {
        setGameOver(true);
        return;
      }

      setSnake(newSnake);
    };

    const gameLoop = setInterval(moveSnake, speed);
    return () => clearInterval(gameLoop);
  }, [snake, direction, food, speed, gameOver]);

  // Draw on canvas
  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    // background
    context.fillStyle = "#4CAF50"; // Minecraft grass green
    context.fillRect(0, 0, CANVAS_SIZE.x, CANVAS_SIZE.y);

    // snake
    context.fillStyle = "#2E2E2E"; // dark body
    snake.forEach(([x, y]) => {
      context.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
    });

    // food
    context.fillStyle = "#FF0000"; // red apple
    context.fillRect(food[0] * SCALE, food[1] * SCALE, SCALE, SCALE);
  }, [snake, food]);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    setSpeed(150);
    setGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <h1 className="font-mc text-2xl">🐍 Minecraft Snake</h1>

      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE.x}
        height={CANVAS_SIZE.y}
        className="border-4 border-mc-stone shadow-lg"
      />

      {gameOver ? (
        <div className="text-center">
          <p className="font-bold text-red-600">Game Over!</p>
          <button onClick={startGame} className="btn-mc mt-2">
            Restart
          </button>
        </div>
      ) : (
        <p className="text-sm opacity-80">
          Use arrow keys to move. Eat red squares to grow!
        </p>
      )}
    </div>
  );
}