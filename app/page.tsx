'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from './page.module.css';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

export default function Page() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * 20),
      y: Math.floor(Math.random() * 20),
    };
    setFood(newFood);
  }, []);

  const moveSnake = useCallback(() => {
    if (gameOver) return;

    setSnake((prevSnake) => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      switch (direction) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) {
        setGameOver(true);
        return prevSnake;
      }

      // Check self collision
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        return prevSnake;
      }

      newSnake.unshift(head);

      // Check if snake ate food
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 1);
        generateFood();
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, generateFood]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          setDirection(prev => prev !== 'DOWN' ? 'UP' : prev);
          break;
        case 'ArrowDown':
          setDirection(prev => prev !== 'UP' ? 'DOWN' : prev);
          break;
        case 'ArrowLeft':
          setDirection(prev => prev !== 'RIGHT' ? 'LEFT' : prev);
          break;
        case 'ArrowRight':
          setDirection(prev => prev !== 'LEFT' ? 'RIGHT' : prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    const gameInterval = setInterval(moveSnake, 150);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearInterval(gameInterval);
    };
  }, [moveSnake]);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 5, y: 5 });
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>贪吃蛇</h1>
      <div className={styles.score}>得分: {score}</div>
      <div className={styles.gameBoard}>
        {Array.from({ length: 20 }, (_, y) =>
          Array.from({ length: 20 }, (_, x) => {
            const isSnake = snake.some(segment => segment.x === x && segment.y === y);
            const isFood = food.x === x && food.y === y;
            return (
              <div
                key={`${x}-${y}`}
                className={`${styles.cell} ${isSnake ? styles.snake : ''} ${
                  isFood ? styles.food : ''
                }`}
              />
            );
          })
        )}
      </div>
      {gameOver && (
        <div className={styles.gameOver}>
          <h2>游戏结束!</h2>
          <button onClick={resetGame}>重新开始</button>
        </div>
      )}
    </div>
  );
}
