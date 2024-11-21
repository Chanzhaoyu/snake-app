import { useEffect, useState, useCallback, useRef } from 'react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };
type GameState = 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

interface GameHistory {
  score: number;
  date: string;
}

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

export default function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameState, setGameState] = useState<GameState>('READY');
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<GameHistory[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('snakeGameHistory');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const gameLoopRef = useRef<NodeJS.Timeout>();

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    setFood(newFood);
  }, []);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setDirection('RIGHT');
    setScore(0);
    generateFood();
  }, [generateFood]);

  const moveSnake = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    setSnake((prevSnake) => {
      const head = { ...prevSnake[0] };

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

      // Check collision with walls
      if (
        head.x < 0 ||
        head.x >= GRID_SIZE ||
        head.y < 0 ||
        head.y >= GRID_SIZE
      ) {
        setGameState('GAME_OVER');
        return prevSnake;
      }

      // Check collision with self
      if (prevSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        setGameState('GAME_OVER');
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Check if food is eaten
      if (head.x === food.x && head.y === food.y) {
        setScore((prev) => prev + 1);
        generateFood();
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food.x, food.y, gameState, generateFood]);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
        case ' ': // Space bar
          event.preventDefault();
          if (gameState === 'READY' || gameState === 'GAME_OVER') {
            resetGame();
            setGameState('PLAYING');
          } else if (gameState === 'PLAYING') {
            setGameState('PAUSED');
          } else if (gameState === 'PAUSED') {
            setGameState('PLAYING');
          }
          break;
      }
    },
    [direction, gameState, resetGame]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      gameLoopRef.current = setInterval(moveSnake, 150);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState, moveSnake]);

  useEffect(() => {
    if (gameState === 'GAME_OVER') {
      const newHistory: GameHistory = {
        score,
        date: new Date().toLocaleString(),
      };
      const updatedHistory = [...history, newHistory].sort((a, b) => b.score - a.score).slice(0, 5);
      setHistory(updatedHistory);
      localStorage.setItem('snakeGameHistory', JSON.stringify(updatedHistory));
    }
  }, [gameState, score, history]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex gap-4 items-center">
        <button
          onClick={() => {
            resetGame();
            setGameState('PLAYING');
          }}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={gameState === 'PLAYING'}
        >
          Start (Space)
        </button>
        <button
          onClick={() => setGameState(gameState === 'PLAYING' ? 'PAUSED' : 'PLAYING')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={gameState === 'READY' || gameState === 'GAME_OVER'}
        >
          {gameState === 'PLAYING' ? 'Pause (Space)' : 'Resume (Space)'}
        </button>
        <div className="ml-4 text-lg font-bold">Score: {score}</div>
      </div>

      <div
        className="relative border-2 border-gray-300"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
        }}
      >
        {/* Snake */}
        {snake.map((segment, index) => (
          <div
            key={index}
            className="absolute bg-green-500"
            style={{
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
              borderRadius: index === 0 ? '4px' : '0',
            }}
          />
        ))}

        {/* Food */}
        <div
          className="absolute bg-red-500 rounded-full"
          style={{
            width: CELL_SIZE - 2,
            height: CELL_SIZE - 2,
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
          }}
        />

        {/* Game Over Overlay */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-2xl font-bold">Game Over!</div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="mt-4">
        <h3 className="text-xl font-bold mb-2">High Scores</h3>
        <div className="bg-gray-100 p-4 rounded">
          {history.map((record, index) => (
            <div key={index} className="flex justify-between gap-4">
              <span>Score: {record.score}</span>
              <span>{record.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
