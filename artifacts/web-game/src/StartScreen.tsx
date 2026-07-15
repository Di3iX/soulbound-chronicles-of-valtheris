import { useState, useEffect } from "react";

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[100dvh] bg-background relative overflow-hidden z-10">
      {/* Decorative grid background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(to right, hsl(var(--primary)/0.3) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary)/0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      
      <div 
        className={`relative z-10 flex flex-col items-center transition-all duration-1000 transform ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
        }`}
      >
        <div className="mb-4 font-mono text-sm tracking-[0.3em] text-secondary animate-pulse uppercase">
          Insert Coin
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black mb-12 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-primary to-primary/50 neon-text leading-tight text-center">
          NEON<br />SNAKE
        </h1>
        
        <button
          onClick={onStart}
          className="group relative px-10 py-5 font-mono text-xl uppercase font-bold text-primary tracking-wider transition-all hover:text-white"
        >
          {/* Button border & glow */}
          <div className="absolute inset-0 border-2 border-primary neon-box transition-all group-hover:bg-primary group-hover:shadow-[0_0_30px_hsl(var(--primary))] z-0" />
          
          <span className="relative z-10 flex items-center gap-3">
            Play <span className="text-secondary group-hover:text-white transition-colors">▶</span>
          </span>
        </button>

        <div className="mt-16 flex gap-8 text-muted-foreground font-mono text-xs md:text-sm uppercase tracking-widest text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              <span className="w-8 h-8 border border-border flex items-center justify-center rounded">W</span>
            </div>
            <div className="flex gap-1">
              <span className="w-8 h-8 border border-border flex items-center justify-center rounded">A</span>
              <span className="w-8 h-8 border border-border flex items-center justify-center rounded">S</span>
              <span className="w-8 h-8 border border-border flex items-center justify-center rounded">D</span>
            </div>
            <span className="mt-2 text-primary/70">Move</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              <span className="w-8 h-8 border border-border flex items-center justify-center rounded">↑</span>
            </div>
            <div className="flex gap-1">
              <span className="w-8 h-8 border border-border flex items-center justify-center rounded">←</span>
              <span className="w-8 h-8 border border-border flex items-center justify-center rounded">↓</span>
              <span className="w-8 h-8 border border-border flex items-center justify-center rounded">→</span>
            </div>
            <span className="mt-2 text-primary/70">Arrows</span>
          </div>
        </div>
      </div>
    </div>
  );
}
