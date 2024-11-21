'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from './page.module.css';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };
type HistoryRecord = {
  score: number;
  date: string;
  difficulty: string;
};

type Difficulty = 'easy' | 'normal' | 'hard';

const DIFFICULTY_SETTINGS = {
  easy: {
    speed: 200,
    scoreMultiplier: 1,
    label: '简单',
    boardSize: 15
  },
  normal: {
    speed: 150,
    scoreMultiplier: 2,
    label: '普通',
    boardSize: 20
  },
  hard: {
    speed: 100,
    scoreMultiplier: 3,
    label: '困难',
    boardSize: 25
  }
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
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [showDifficultySelect, setShowDifficultySelect] = useState(false);

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
    const newFood: Position = {
      x: Math.floor(Math.random() * DIFFICULTY_SETTINGS[difficulty].boardSize),
      y: Math.floor(Math.random() * DIFFICULTY_SETTINGS[difficulty].boardSize)
    };
    setFood(newFood);
  }, [difficulty]);

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
      const boardSize = DIFFICULTY_SETTINGS[difficulty].boardSize;
      if (head.x < 0 || head.x >= boardSize || head.y < 0 || head.y >= boardSize) {
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
        setScore(prev => prev + DIFFICULTY_SETTINGS[difficulty].scoreMultiplier);
        generateFood();
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, generateFood, gameStarted, isPaused, difficulty]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Handle Escape key first for modal closing
      if (e.key === 'Escape') {
        if (showHistory) {
          setShowHistory(false);
          return;
        }
        if (showDifficultySelect) {
          setShowDifficultySelect(false);
          return;
        }
        if (gameStarted && !gameOver) {
          setIsPaused(true);
        }
        return;
      }

      // Handle difficulty selection shortcuts
      if (showDifficultySelect) {
        switch (e.key) {
          case '1':
            startGameWithDifficulty('easy');
            return;
          case '2':
            startGameWithDifficulty('normal');
            return;
          case '3':
            startGameWithDifficulty('hard');
            return;
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
    const gameInterval = setInterval(moveSnake, DIFFICULTY_SETTINGS[difficulty].speed);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearInterval(gameInterval);
    };
  }, [moveSnake, gameStarted, gameOver, isPaused, showHistory, difficulty, showDifficultySelect]);

  const saveScore = () => {
    if (score === 0) return;
    
    const newRecord: HistoryRecord = {
      score,
      date: new Date().toLocaleString('zh-CN'),
      difficulty: DIFFICULTY_SETTINGS[difficulty].label
    };
    const updatedHistory = [...history, newRecord]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('snakeGameHistory', JSON.stringify(updatedHistory));
  };

  const startGame = () => {
    setShowDifficultySelect(true);
  };

  const startGameWithDifficulty = (selectedDifficulty: Difficulty) => {
    const boardSize = DIFFICULTY_SETTINGS[selectedDifficulty].boardSize;
    setDifficulty(selectedDifficulty);
    // Place snake in the middle of the board
    const startX = Math.floor(boardSize / 2);
    const startY = Math.floor(boardSize / 2);
    setSnake([{ x: startX, y: startY }]);
    // Place food away from the snake
    setFood({ 
      x: Math.floor(Math.random() * (boardSize / 2)), 
      y: Math.floor(Math.random() * (boardSize / 2))
    });
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setGameStarted(true);
    setIsPaused(false);
    setShowDifficultySelect(false);
  };

  const resetGame = () => {
    saveScore();
    setGameStarted(false);
    setShowDifficultySelect(true);
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
            <div className={styles.score}>
              <div>难度: {DIFFICULTY_SETTINGS[difficulty].label}</div>
              <div>得分: {score}</div>
            </div>
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
          <div className={styles.gameBoard} style={{
            gridTemplateColumns: `repeat(${DIFFICULTY_SETTINGS[difficulty].boardSize}, 1fr)`,
            width: `${Math.min(600, window.innerWidth - 40)}px`,
            height: `${Math.min(600, window.innerWidth - 40)}px`
          }}>
            {Array.from({ length: DIFFICULTY_SETTINGS[difficulty].boardSize * DIFFICULTY_SETTINGS[difficulty].boardSize }).map((_, index) => {
              const x = index % DIFFICULTY_SETTINGS[difficulty].boardSize;
              const y = Math.floor(index / DIFFICULTY_SETTINGS[difficulty].boardSize);
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
            })}
            {!gameStarted && !gameOver && !showDifficultySelect && (
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
            {showDifficultySelect && (
              <div className={styles.difficultyOverlay}>
                <div className={styles.difficultyContent}>
                  <h2>选择难度</h2>
                  <div className={styles.difficultyButtons}>
                    <button
                      className={`${styles.difficultyButton} ${styles.easyButton}`}
                      onClick={() => startGameWithDifficulty('easy')}
                    >
                      简单 <span className={styles.shortcutKey}>(1)</span>
                      <span className={styles.difficultyDesc}>速度慢 / 基础分数</span>
                    </button>
                    <button
                      className={`${styles.difficultyButton} ${styles.normalButton}`}
                      onClick={() => startGameWithDifficulty('normal')}
                    >
                      普通 <span className={styles.shortcutKey}>(2)</span>
                      <span className={styles.difficultyDesc}>中等速度 / 双倍分数</span>
                    </button>
                    <button
                      className={`${styles.difficultyButton} ${styles.hardButton}`}
                      onClick={() => startGameWithDifficulty('hard')}
                    >
                      困难 <span className={styles.shortcutKey}>(3)</span>
                      <span className={styles.difficultyDesc}>高速 / 三倍分数</span>
                    </button>
                  </div>
                  <p className={styles.difficultyHint}>按 1-3 选择难度 / Esc 返回</p>
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
              <p>难度: {DIFFICULTY_SETTINGS[difficulty].label}</p>
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
                        <span className={styles.historyDifficulty}>{record.difficulty}</span>
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
