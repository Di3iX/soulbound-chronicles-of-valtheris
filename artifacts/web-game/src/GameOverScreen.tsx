import { useState, useEffect } from "react";

interface GameOverScreenProps {
  score: number;
  highScore: number;
  onRestart: () => void;
}

export function GameOverScreen({ score, highScore, onRestart }: GameOverScreenProps) {
  const [mounted, setMounted] = useState(false);
  const isNewHighScore = score > 0 && score >= highScore;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[100dvh] bg-background/90 backdrop-blur-sm relative overflow-hidden z-10">
      
      <div 
        className={`relative z-10 flex flex-col items-center p-12 bg-card/50 border border-secondary/30 rounded-3xl shadow-[0_0_50px_rgba(255,0,60,0.1)] transition-all duration-700 transform ${
          mounted ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
      >
        <h2 className="text-5xl md:text-6xl font-black mb-8 tracking-tighter text-white neon-text-pink text-center">
          SYSTEM<br />FAILURE
        </h2>
        
        <div className="flex flex-col items-center gap-6 mb-12 w-full max-w-sm">
          <div className="flex flex-col items-center w-full bg-black/40 p-6 rounded-xl border border-primary/20">
            <span className="text-muted-foreground font-mono text-sm tracking-widest uppercase mb-1">Final Score</span>
            <span className="text-4xl font-mono font-bold text-primary neon-text">{score}</span>
          </div>
          
          <div className="flex flex-col items-center w-full bg-black/40 p-4 rounded-xl border border-secondary/20 relative overflow-hidden">
            {isNewHighScore && (
              <div className="absolute top-0 inset-x-0 h-1 bg-secondary animate-pulse" />
            )}
            <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase mb-1">
              {isNewHighScore ? (
                <span className="text-secondary animate-pulse">New High Score!</span>
              ) : "High Score"}
            </span>
            <span className="text-2xl font-mono font-bold text-white">{highScore}</span>
          </div>
        </div>
        
        <button
          onClick={onRestart}
          className="group relative px-10 py-5 font-mono text-xl uppercase font-bold text-secondary tracking-wider transition-all hover:text-white"
        >
          {/* Button border & glow */}
          <div className="absolute inset-0 border-2 border-secondary shadow-[0_0_15px_hsl(var(--secondary))] transition-all group-hover:bg-secondary group-hover:shadow-[0_0_30px_hsl(var(--secondary))] z-0" />
          
          <span className="relative z-10 flex items-center gap-3">
            Reboot <span className="text-primary group-hover:text-white transition-colors">↻</span>
          </span>
        </button>
      </div>
    </div>
  );
}
