import { useEffect, useRef, useState } from 'react';

type Point = { x: number; y: number };
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
};

const CANVAS_SIZE = 800;
const GRID_SIZE = 40;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
const BASE_SPEED = 120;
const MIN_SPEED = 40;
const SPEED_DECREMENT = 2;

const COLORS = {
  bg: '#040410',
  primary: '#00ffff',
  secondary: '#ff0080',
  grid: 'rgba(0, 255, 255, 0.05)'
};

interface GameProps {
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  highScore: number;
}

export function Game({ onGameOver, onScoreUpdate, highScore }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localScore, setLocalScore] = useState(0);
  
  const onGameOverRef = useRef(onGameOver);
  const onScoreUpdateRef = useRef(onScoreUpdate);
  
  useEffect(() => {
    onGameOverRef.current = onGameOver;
    onScoreUpdateRef.current = onScoreUpdate;
  }, [onGameOver, onScoreUpdate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isGameOver = false;

    const state = {
      snake: [
        { x: 10, y: 20 },
        { x: 9, y: 20 },
        { x: 8, y: 20 }
      ],
      direction: { dx: 1, dy: 0 },
      pellet: { x: 30, y: 20 },
      particles: [] as Particle[],
      score: 0,
      lastMoveTime: 0,
      lastFrameTime: 0,
    };

    const inputQueue: { dx: number; dy: number }[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      let dx = 0;
      let dy = 0;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dy = -1;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dy = 1;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dx = -1;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dx = 1;
          break;
      }
      
      if (dx !== 0 || dy !== 0) {
        const lastInput = inputQueue[inputQueue.length - 1] || state.direction;
        if (lastInput.dx !== dx || lastInput.dy !== dy) {
          inputQueue.push({ dx, dy });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const spawnPellet = () => {
      while (true) {
        const newPellet = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE)
        };
        if (!state.snake.some(segment => segment.x === newPellet.x && segment.y === newPellet.y)) {
          return newPellet;
        }
      }
    };

    state.pellet = spawnPellet();

    const createExplosion = (x: number, y: number, color: string) => {
      const numParticles = 25;
      for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        state.particles.push({
          x: x * CELL_SIZE + CELL_SIZE / 2,
          y: y * CELL_SIZE + CELL_SIZE / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 400 + Math.random() * 400,
          maxLife: 800,
          color
        });
      }
    };

    const updateParticles = (dt: number) => {
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * dt * 0.06;
        p.y += p.vy * dt * 0.06;
        p.life -= dt;
        if (p.life <= 0) {
          state.particles.splice(i, 1);
        }
      }
    };

    const draw = (time: number) => {
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
      }

      state.particles.forEach(p => {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 + alpha * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1;

      const pulse = (Math.sin(time / 150) + 1) / 2;
      const pelletRadius = CELL_SIZE / 3 + pulse * 2;
      const px = state.pellet.x * CELL_SIZE + CELL_SIZE / 2;
      const py = state.pellet.y * CELL_SIZE + CELL_SIZE / 2;

      ctx.fillStyle = COLORS.secondary;
      ctx.shadowBlur = 25;
      ctx.shadowColor = COLORS.secondary;
      ctx.beginPath();
      ctx.arc(px, py, pelletRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(px, py, pelletRadius * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 15;
      
      state.snake.forEach((segment, index) => {
        const isHead = index === 0;
        const padding = isHead ? 2 : 4;
        
        ctx.fillStyle = isHead ? '#ffffff' : COLORS.primary;
        ctx.shadowColor = isHead ? '#ffffff' : COLORS.primary;
        ctx.shadowBlur = isHead ? 25 : 12;

        const x = segment.x * CELL_SIZE + padding;
        const y = segment.y * CELL_SIZE + padding;
        const size = CELL_SIZE - padding * 2;
        
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, size, size, isHead ? 4 : 2);
        } else {
          ctx.rect(x, y, size, size); // fallback
        }
        ctx.fill();
      });
      
      ctx.shadowBlur = 0;
    };

    const loop = (time: number) => {
      if (isGameOver) return;

      if (state.lastMoveTime === 0) state.lastMoveTime = time;
      
      const dt = time - (state.lastFrameTime || time);
      state.lastFrameTime = time;
      const safeDt = Math.min(dt, 50);

      updateParticles(safeDt);

      const currentSpeed = Math.max(MIN_SPEED, BASE_SPEED - state.score * SPEED_DECREMENT);

      if (time - state.lastMoveTime >= currentSpeed) {
        if (inputQueue.length > 0) {
          let nextInput = inputQueue.shift()!;
          while (nextInput && nextInput.dx === -state.direction.dx && nextInput.dy === -state.direction.dy) {
            nextInput = inputQueue.shift()!;
          }
          if (nextInput) {
            state.direction = nextInput;
          }
        }

        const head = state.snake[0];
        const newHead = {
          x: head.x + state.direction.dx,
          y: head.y + state.direction.dy
        };

        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          isGameOver = true;
          onGameOverRef.current(state.score);
          return;
        }

        const isEating = (newHead.x === state.pellet.x && newHead.y === state.pellet.y);
        const tailOffset = isEating ? 0 : 1;
        
        if (state.snake.slice(0, state.snake.length - tailOffset).some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          isGameOver = true;
          onGameOverRef.current(state.score);
          return;
        }

        state.snake.unshift(newHead);

        if (isEating) {
          createExplosion(state.pellet.x, state.pellet.y, COLORS.secondary);
          state.score += 10;
          setLocalScore(state.score);
          onScoreUpdateRef.current(state.score);
          state.pellet = spawnPellet();
        } else {
          state.snake.pop();
        }

        const tail = state.snake[state.snake.length - 1];
        if (Math.random() > 0.4) {
          state.particles.push({
            x: tail.x * CELL_SIZE + CELL_SIZE / 2 + (Math.random() - 0.5) * CELL_SIZE,
            y: tail.y * CELL_SIZE + CELL_SIZE / 2 + (Math.random() - 0.5) * CELL_SIZE,
            vx: 0,
            vy: 0,
            life: 200 + Math.random() * 300,
            maxLife: 500,
            color: 'rgba(0, 255, 255, 0.4)'
          });
        }

        state.lastMoveTime = time;
      }

      draw(time);
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[100dvh] bg-background relative z-10 p-4 sm:p-8">
      
      <div className="w-full max-w-[800px] flex justify-between items-end mb-6 px-2 sm:px-6">
        <div className="flex flex-col">
          <span className="text-muted-foreground font-mono text-xs sm:text-sm uppercase tracking-widest mb-1">Score</span>
          <span className="text-4xl sm:text-5xl font-mono font-bold text-primary neon-text leading-none">{localScore}</span>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-muted-foreground font-mono text-[10px] sm:text-xs uppercase tracking-widest mb-1">High Score</span>
          <span className="text-xl sm:text-2xl font-mono text-white/80 leading-none">{Math.max(localScore, highScore)}</span>
        </div>
      </div>

      <div className="relative w-full max-w-[800px] aspect-square bg-card rounded-2xl border border-primary/20 shadow-[0_0_60px_rgba(0,255,255,0.08)] overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="absolute inset-0 w-full h-full"
        />
        
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.9)] rounded-2xl" />
        <div className="absolute inset-0 pointer-events-none border-[3px] border-primary/10 rounded-2xl mix-blend-screen" />
      </div>
      
    </div>
  );
}
