import { useState, useEffect, useCallback } from 'react';
import { StartScreen } from './StartScreen';
import { GameOverScreen } from './GameOverScreen';
import { Game } from './Game';

type GameState = 'start' | 'playing' | 'gameover';

function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('neonsnake_highscore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  const handleStart = useCallback(() => {
    setScore(0);
    setGameState('playing');
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    setGameState('gameover');
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('neonsnake_highscore', finalScore.toString());
    }
  }, [highScore]);

  const handleScoreUpdate = useCallback((newScore: number) => {
    setScore(newScore);
  }, []);

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground overflow-hidden relative">
      <div className="scanlines" />
      
      {gameState === 'start' && <StartScreen onStart={handleStart} />}
      
      {gameState === 'playing' && (
        <Game 
          onGameOver={handleGameOver} 
          onScoreUpdate={handleScoreUpdate} 
          highScore={highScore}
        />
      )}
      
      {gameState === 'gameover' && (
        <GameOverScreen 
          score={score} 
          highScore={highScore} 
          onRestart={handleStart} 
        />
      )}
    </div>
  );
}

export default App;
