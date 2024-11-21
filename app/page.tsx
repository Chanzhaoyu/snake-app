'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from './page.module.css';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };
type HistoryRecord = {
  score: number;
  date: string;
};

export default function Page() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('snakeGameHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Simulate loading progress
  useEffect(() => {
    if (!showWelcome) return;

    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [showWelcome]);

  // Hide welcome screen after loading
  useEffect(() => {
    if (loadingProgress === 100) {
      const timeout = setTimeout(() => {
        setShowWelcome(false);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [loadingProgress]);

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * 20),
      y: Math.floor(Math.random() * 20),
    };
    setFood(newFood);
  }, []);

  const moveSnake = useCallback(() => {
    if (gameOver || !gameStarted || isPaused) return;

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
  }, [direction, food, gameOver, generateFood, gameStarted, isPaused]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Handle Escape key first for modal closing
      if (e.key === 'Escape') {
        if (showHistory) {
          setShowHistory(false);
          return;
        }
        if (gameStarted && !gameOver) {
          setIsPaused(true);
        }
        return;
      }

      // Start game with 'S' key when not started
      if (e.key.toLowerCase() === 's' && !gameStarted && !gameOver) {
        startGame();
        return;
      }

      // Toggle history with 'H' key
      if (e.key.toLowerCase() === 'h') {
        setShowHistory(prev => !prev);
        return;
      }

      // Restart with 'R' key when game is over
      if (e.key.toLowerCase() === 'r' && gameOver) {
        resetGame();
        return;
      }

      if (!gameStarted) return;
      
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
        case ' ': // Spacebar
          e.preventDefault(); // Prevent page scrolling
          if (gameStarted && !gameOver) {
            setIsPaused(prev => !prev);
          }
          break;
        case 'Enter':
          if (gameStarted && !gameOver && isPaused) {
            setIsPaused(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    const gameInterval = setInterval(moveSnake, 150);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearInterval(gameInterval);
    };
  }, [moveSnake, gameStarted, gameOver, isPaused, showHistory]);

  const saveScore = () => {
    if (score === 0) return;
    
    const newRecord: HistoryRecord = {
      score,
      date: new Date().toLocaleString('zh-CN'),
    };
    const updatedHistory = [...history, newRecord]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Keep only top 10 scores
    setHistory(updatedHistory);
    localStorage.setItem('snakeGameHistory', JSON.stringify(updatedHistory));
  };

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 5, y: 5 });
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setGameStarted(true);
    setIsPaused(false);
  };

  const resetGame = () => {
    saveScore();
    setGameStarted(false);
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 5, y: 5 });
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  };

  const togglePause = () => {
    if (gameStarted && !gameOver) {
      setIsPaused(prev => !prev);
    }
  };

  return (
    <div className={styles.container}>
      {showWelcome ? (
        <div className={styles.welcomeScreen}>
          <div className={styles.welcomeContent}>
            <div className={styles.snakeAnimation}>
              <div className={styles.snakeHead} />
              <div className={styles.snakeBody} />
              <div className={styles.snakeBody} />
              <div className={styles.snakeBody} />
            </div>
            <h1 className={styles.welcomeTitle}>贪吃蛇</h1>
            <div className={styles.loadingBar}>
              <div 
                className={styles.loadingProgress} 
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className={styles.loadingText}>
              {loadingProgress < 100 ? '游戏加载中...' : '准备开始!'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <h1 className={styles.title}>贪吃蛇</h1>
          <div className={styles.header}>
            <div className={styles.score}>得分: {score}</div>
            <div className={styles.controls}>
              {gameStarted && !gameOver && (
                <button 
                  className={styles.controlButton}
                  onClick={togglePause}
                  title="空格键暂停/继续"
                >
                  {isPaused ? '继续 (Enter)' : '暂停 (Space)'}
                </button>
              )}
              <button 
                className={styles.historyButton}
                onClick={() => setShowHistory(true)}
                title="按 H 键查看历史记录"
              >
                历史记录 (H)
              </button>
            </div>
          </div>
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
            {!gameStarted && !gameOver && (
              <div className={styles.startOverlay}>
                <div className={styles.startContent}>
                  <button 
                    onClick={startGame} 
                    className={styles.startButton}
                    title="按 S 键开始游戏"
                  >
                    开始游戏 (S)
                  </button>
                  <div className={styles.keyboardHints}>
                    <p>⬆️⬇️⬅️➡️ 控制方向</p>
                    <p>Space 暂停/继续</p>
                    <p>H 历史记录</p>
                  </div>
                </div>
              </div>
            )}
            {isPaused && (
              <div className={styles.pauseOverlay}>
                <div className={styles.pauseContent}>
                  <h2>游戏暂停</h2>
                  <p>按 Enter 继续游戏</p>
                  <p>按 Esc 保持暂停</p>
                </div>
              </div>
            )}
          </div>
          {gameOver && (
            <div className={styles.gameOver}>
              <h2>游戏结束!</h2>
              <p>最终得分: {score}</p>
              <button 
                onClick={resetGame}
                title="按 R 键重新开始"
              >
                重新开始 (R)
              </button>
            </div>
          )}
          {showHistory && (
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <h2>历史最高分</h2>
                <div className={styles.historyList}>
                  {history.length > 0 ? (
                    history.map((record, index) => (
                      <div key={index} className={styles.historyItem}>
                        <span className={styles.rank}>#{index + 1}</span>
                        <span className={styles.historyScore}>{record.score}分</span>
                        <span className={styles.historyDate}>{record.date}</span>
                      </div>
                    ))
                  ) : (
                    <p>暂无记录</p>
                  )}
                </div>
                <p className={styles.modalHint}>按 Esc 关闭</p>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowHistory(false)}
                >
                  关闭
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
