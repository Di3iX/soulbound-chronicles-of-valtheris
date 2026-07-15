import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- CONSTANTS ---
const COLS = 10;
const ROWS = 10;

const MAP: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0, 0, 1, 0, 0],
  [0, 1, 0, 2, 0, 0, 0, 1, 1, 0],
  [0, 0, 0, 2, 2, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 3, 3, 0, 0],
  [0, 0, 1, 0, 0, 0, 3, 0, 0, 0],
  [0, 0, 1, 0, 2, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 2, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const SKILLS = [
  { id: 1, name: 'Удар', emoji: '⚔️', damage: 28, healSelf: 0, maxCd: 25, desc: 'Мощный удар мечом' },
  { id: 2, name: 'Огонь', emoji: '🔥', damage: 42, healSelf: 0, maxCd: 45, desc: 'Огненный шар' },
  { id: 3, name: 'Лечение', emoji: '💚', damage: 0, healSelf: 30, maxCd: 55, desc: 'Восстановление HP' },
  { id: 4, name: 'Молния', emoji: '⚡', damage: 38, healSelf: 0, maxCd: 40, desc: 'Удар молнии' },
  { id: 5, name: 'Щит', emoji: '🛡️', damage: 0, healSelf: 0, maxCd: 35, desc: 'Блок на 5 сек' },
];

const INITIAL_PLAYER_HP = 100;
const INITIAL_ENEMY_HP = 150;

type Phase = 'explore' | 'combat' | 'victory' | 'defeat';

type FloatingNum = {
  id: number;
  value: string;
  col: number;
  row: number;
  type: 'player-dmg' | 'enemy-dmg' | 'heal';
  timestamp: number;
};

type LogEntry = {
  id: number;
  msg: string;
};

export default function App() {
  // --- STATE ---
  const [phase, setPhase] = useState<Phase>('explore');

  const [playerPos, setPlayerPos] = useState({ x: 1, y: 8 });
  const [enemyPos, setEnemyPos] = useState({ x: 7, y: 1 });

  const [playerHp, setPlayerHp] = useState(INITIAL_PLAYER_HP);
  const [enemyHp, setEnemyHp] = useState(INITIAL_ENEMY_HP);

  const [shieldActive, setShieldActive] = useState(false);
  const [skillsCd, setSkillsCd] = useState<Record<number, number>>({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0
  });

  const [logs, setLogs] = useState<LogEntry[]>([{ id: 0, msg: "Тёмные подземелья ждут..." }]);
  const [floatingNums, setFloatingNums] = useState<FloatingNum[]>([]);

  // Refs for combat logic to avoid stale closures
  const playerHpRef = useRef(playerHp);
  const enemyHpRef = useRef(enemyHp);
  const shieldRef = useRef(shieldActive);
  const phaseRef = useRef(phase);

  useEffect(() => { playerHpRef.current = playerHp; }, [playerHp]);
  useEffect(() => { enemyHpRef.current = enemyHp; }, [enemyHp]);
  useEffect(() => { shieldRef.current = shieldActive; }, [shieldActive]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // --- HELPERS ---
  const addLog = useCallback((msg: string) => {
    setLogs(prev => {
      const newLogs = [{ id: Date.now() + Math.random(), msg }, ...prev];
      return newLogs.slice(0, 12);
    });
  }, []);

  const spawnFloat = useCallback((value: string, col: number, row: number, type: FloatingNum['type']) => {
    const newNum: FloatingNum = { id: Date.now() + Math.random(), value, col, row, type, timestamp: Date.now() };
    setFloatingNums(prev => [...prev, newNum]);
  }, []);

  // --- EXPLORE SYSTEM ---
  const movePlayer = (dx: number, dy: number) => {
    if (phase !== 'explore') return;

    const nx = playerPos.x + dx;
    const ny = playerPos.y + dy;

    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
      addLog("Путь заблокирован!");
      return;
    }

    const tile = MAP[ny][nx];
    if (tile !== 0) { // 1=Tree, 2=Rock, 3=Water
      addLog("Путь заблокирован!");
      return;
    }

    setPlayerPos({ x: nx, y: ny });

    if (nx === enemyPos.x && ny === enemyPos.y) {
      setPhase('combat');
      addLog("⚔️ Бой начался!");
    }
  };

  // --- COMBAT SYSTEM ---
  useEffect(() => {
    if (phase !== 'combat') return;

    const playerAttackInterval = setInterval(() => {
      if (phaseRef.current !== 'combat') return;
      const dmg = Math.floor(Math.random() * (16 - 8 + 1)) + 8;
      
      setEnemyHp(prev => {
        const newHp = Math.max(0, prev - dmg);
        if (newHp === 0 && enemyHpRef.current > 0) {
          setPhase('victory');
          addLog("💀 Гоблин повержен!");
        }
        return newHp;
      });
      spawnFloat(dmg.toString(), enemyPos.x, enemyPos.y, 'enemy-dmg');
      addLog(`⚔️ Воин наносит ${dmg} урона!`);
    }, 1500);

    const enemyAttackInterval = setInterval(() => {
      if (phaseRef.current !== 'combat') return;
      let dmg = Math.floor(Math.random() * (12 - 5 + 1)) + 5;
      
      if (shieldRef.current) {
        dmg = Math.ceil(dmg / 2);
      }

      setPlayerHp(prev => {
        const newHp = Math.max(0, prev - dmg);
        if (newHp === 0 && playerHpRef.current > 0) {
          setPhase('defeat');
          addLog("☠️ Вы погибли...");
        }
        return newHp;
      });
      spawnFloat(dmg.toString(), playerPos.x, playerPos.y, 'player-dmg');
      addLog(`👺 Гоблин атакует на ${dmg} урона!`);
    }, 2200);

    return () => {
      clearInterval(playerAttackInterval);
      clearInterval(enemyAttackInterval);
    };
  }, [phase, enemyPos.x, enemyPos.y, playerPos.x, playerPos.y, addLog, spawnFloat]);

  // Cooldown ticking
  useEffect(() => {
    if (phase !== 'combat') return;
    const cdInterval = setInterval(() => {
      setSkillsCd(prev => {
        let changed = false;
        const next = { ...prev };
        for (const k in next) {
          if (next[k] > 0) {
            next[k] = Math.max(0, next[k] - 1);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 100);
    return () => clearInterval(cdInterval);
  }, [phase]);

  // Clean floating numbers
  useEffect(() => {
    if (floatingNums.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setFloatingNums(prev => prev.filter(f => now - f.timestamp < 1300));
    }, 200);
    return () => clearInterval(timer);
  }, [floatingNums]);

  // --- SKILLS ---
  const useSkill = (skill: typeof SKILLS[0]) => {
    if (phase !== 'combat') return;
    if (skillsCd[skill.id] > 0) return;

    setSkillsCd(prev => ({ ...prev, [skill.id]: skill.maxCd }));

    if (skill.damage > 0) {
      setEnemyHp(prev => {
        const newHp = Math.max(0, prev - skill.damage);
        if (newHp === 0 && enemyHpRef.current > 0) {
          setPhase('victory');
          addLog("💀 Гоблин повержен!");
        }
        return newHp;
      });
      spawnFloat(skill.damage.toString(), enemyPos.x, enemyPos.y, 'enemy-dmg');
      addLog(`✨ Воин использует ${skill.name} на ${skill.damage} урона!`);
    }

    if (skill.healSelf > 0) {
      setPlayerHp(prev => Math.min(INITIAL_PLAYER_HP, prev + skill.healSelf));
      spawnFloat(`+${skill.healSelf}`, playerPos.x, playerPos.y, 'heal');
      addLog(`💚 Воин лечится на ${skill.healSelf} HP!`);
    }

    if (skill.id === 5) { // Shield
      setShieldActive(true);
      addLog("🛡️ Щит активирован!");
      setTimeout(() => {
        setShieldActive(false);
        addLog("🛡️ Действие щита закончилось.");
      }, 5000);
    }
  };

  // --- RESTART ---
  const handleRestart = () => {
    setPhase('explore');
    setPlayerPos({ x: 1, y: 8 });
    setEnemyPos({ x: 7, y: 1 });
    setPlayerHp(INITIAL_PLAYER_HP);
    setEnemyHp(INITIAL_ENEMY_HP);
    setShieldActive(false);
    setSkillsCd({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    setLogs([{ id: Date.now(), msg: "Вы возродились. Тёмные подземелья ждут..." }]);
    setFloatingNums([]);
  };

  // --- RENDER HELPERS ---
  const renderTileContent = (x: number, y: number, tileType: number) => {
    if (x === playerPos.x && y === playerPos.y) {
      return <div className="w-full h-full tile-player rounded flex items-center justify-center text-lg z-10 relative">🧝</div>;
    }
    if (x === enemyPos.x && y === enemyPos.y) {
      return <div className="w-full h-full tile-enemy rounded flex items-center justify-center text-lg z-10 relative">👺</div>;
    }
    if (tileType === 1) return <div className="w-full h-full tile-tree flex items-center justify-center text-sm">🌲</div>;
    if (tileType === 2) return <div className="w-full h-full tile-rock flex items-center justify-center text-sm">🪨</div>;
    if (tileType === 3) return <div className="w-full h-full tile-water flex items-center justify-center text-blue-400 text-xs font-bold tracking-tighter opacity-80">〰</div>;
    return <div className="w-full h-full tile-grass"></div>;
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-[420px] mx-auto bg-background text-foreground flex flex-col relative select-none">
      
      {/* 1. Status Header (~50px) */}
      <div className="h-[55px] shrink-0 border-b border-tile-border flex items-center px-4 justify-between bg-[#111116]">
        <div className="flex flex-col w-[45%]">
          <div className="flex justify-between items-end mb-1">
            <span className="text-sm font-bold text-white tracking-wide">Воин {shieldActive && '🛡️'}</span>
            <span className="text-xs text-primary font-mono">{playerHp}/{INITIAL_PLAYER_HP}</span>
          </div>
          <div className="h-2 w-full bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(playerHp / INITIAL_PLAYER_HP) * 100}%` }}
            />
          </div>
        </div>

        <div className="text-lg font-bold text-[#444] mb-2 text-center w-[10%]">VS</div>

        <div className="flex flex-col w-[45%]">
          <div className="flex justify-between items-end mb-1">
            <span className="text-xs text-destructive font-mono">{enemyHp}/{INITIAL_ENEMY_HP}</span>
            <span className="text-sm font-bold text-white tracking-wide">Гоблин</span>
          </div>
          <div className="h-2 w-full bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border flex justify-end">
            <div 
              className="h-full bg-destructive transition-all duration-300"
              style={{ width: `${(enemyHp / INITIAL_ENEMY_HP) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Map Grid */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] p-2">
        <div className="relative" style={{ width: 'min(90vw, 360px)', height: 'min(90vw, 360px)' }}>
          <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 gap-[1px] bg-tile-border p-[1px] border border-tile-border rounded shadow-lg shadow-black/50 overflow-hidden">
            {MAP.map((row, y) => 
              row.map((tileType, x) => (
                <div key={`${x}-${y}`} className="relative bg-map-bg">
                  {renderTileContent(x, y, tileType)}
                </div>
              ))
            )}
          </div>
          
          {/* Map HP Bars */}
          {phase !== 'explore' && playerHp > 0 && (
            <div 
              className="absolute pointer-events-none z-20 flex justify-center"
              style={{
                top: `${(playerPos.y / 10) * 100}%`,
                left: `${(playerPos.x / 10) * 100}%`,
                width: '10%',
                height: '10%',
                marginTop: '-6px'
              }}
            >
              <div className="w-[80%] h-[4px] bg-[#1a1a1f] border border-black rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(playerHp / INITIAL_PLAYER_HP) * 100}%` }} />
              </div>
            </div>
          )}
          {phase !== 'explore' && enemyHp > 0 && (
            <div 
              className="absolute pointer-events-none z-20 flex justify-center"
              style={{
                top: `${(enemyPos.y / 10) * 100}%`,
                left: `${(enemyPos.x / 10) * 100}%`,
                width: '10%',
                height: '10%',
                marginTop: '-6px'
              }}
            >
              <div className="w-[80%] h-[4px] bg-[#1a1a1f] border border-black rounded-full overflow-hidden">
                <div className="h-full bg-destructive" style={{ width: `${(enemyHp / INITIAL_ENEMY_HP) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Floating Numbers */}
          {floatingNums.map(num => (
            <div 
              key={num.id}
              className={`absolute pointer-events-none z-30 font-bold text-base md:text-lg text-center animate-float w-[10%] h-[10%] flex items-center justify-center drop-shadow-md`}
              style={{
                top: `${(num.row / 10) * 100}%`,
                left: `${(num.col / 10) * 100}%`,
                color: num.type === 'player-dmg' ? 'hsl(var(--destructive))' : num.type === 'heal' ? 'hsl(var(--success))' : 'hsl(var(--primary))'
              }}
            >
              <span className="text-shadow-sm shadow-black/80">{num.value}</span>
            </div>
          ))}

          {/* Victory / Defeat Overlay */}
          {(phase === 'victory' || phase === 'defeat') && (
            <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-6 text-center rounded backdrop-blur-sm animate-in fade-in duration-500">
              {phase === 'victory' ? (
                <>
                  <h2 className="text-3xl font-bold text-primary mb-2 shadow-black drop-shadow-lg">⚔️ ПОБЕДА!</h2>
                  <p className="text-white/80 mb-6 font-medium">Гоблин повержен!</p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-destructive mb-2 shadow-black drop-shadow-lg">☠️ ПОРАЖЕНИЕ</h2>
                  <p className="text-white/80 mb-6 font-medium">Вы пали в бою...</p>
                </>
              )}
              <button 
                onClick={handleRestart}
                className="px-6 py-3 bg-[#1e1e28] border-2 border-primary text-primary font-bold rounded-lg shadow-[0_0_15px_rgba(200,150,42,0.3)] active:scale-95 transition-transform"
              >
                Играть снова
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. D-Pad Movement (~120px) */}
      <div className="h-[140px] shrink-0 flex flex-col items-center justify-center border-t border-tile-border/50 bg-[#0c0c10]">
        <span className="text-[10px] uppercase tracking-widest text-[#666] mb-2 font-bold">Движение</span>
        <div className="grid grid-cols-3 gap-[6px]">
          <div />
          <button 
            disabled={phase !== 'explore'}
            onClick={() => movePlayer(0, -1)}
            className="dpad-btn w-[56px] h-[56px] bg-[#1e1e28] border-2 border-primary rounded-lg flex items-center justify-center text-primary disabled:opacity-30 disabled:border-tile-border disabled:text-tile-border transition-colors shadow-black/50 shadow-sm"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          </button>
          <div />
          
          <button 
            disabled={phase !== 'explore'}
            onClick={() => movePlayer(-1, 0)}
            className="dpad-btn w-[56px] h-[56px] bg-[#1e1e28] border-2 border-primary rounded-lg flex items-center justify-center text-primary disabled:opacity-30 disabled:border-tile-border disabled:text-tile-border transition-colors shadow-black/50 shadow-sm"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          
          <button 
            disabled={phase !== 'explore'}
            onClick={() => movePlayer(0, 1)}
            className="dpad-btn w-[56px] h-[56px] bg-[#1e1e28] border-2 border-primary rounded-lg flex items-center justify-center text-primary disabled:opacity-30 disabled:border-tile-border disabled:text-tile-border transition-colors shadow-black/50 shadow-sm"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>

          <button 
            disabled={phase !== 'explore'}
            onClick={() => movePlayer(1, 0)}
            className="dpad-btn w-[56px] h-[56px] bg-[#1e1e28] border-2 border-primary rounded-lg flex items-center justify-center text-primary disabled:opacity-30 disabled:border-tile-border disabled:text-tile-border transition-colors shadow-black/50 shadow-sm"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* 4. Skill Bar (~70px) */}
      <div className="h-[80px] shrink-0 bg-[#111116] border-t border-tile-border p-2 flex justify-center gap-2 overflow-x-auto">
        {SKILLS.map(skill => {
          const cd = skillsCd[skill.id] || 0;
          const isOnCd = cd > 0;
          const isUsable = phase === 'combat' && !isOnCd;
          
          return (
            <button
              key={skill.id}
              disabled={!isUsable}
              onClick={() => useSkill(skill)}
              className={`relative flex flex-col items-center justify-center w-[60px] h-[60px] rounded bg-[#1e1e28] border 
                ${isUsable ? 'border-skill shadow-[0_0_10px_rgba(26,74,139,0.5)] cursor-pointer active:scale-95 transition-all' : 'border-tile-border opacity-60 cursor-not-allowed'}`}
            >
              <span className="text-xl mb-1">{skill.emoji}</span>
              <span className="text-[10px] font-bold text-white/80">{skill.name}</span>
              
              {isOnCd && (
                <div className="absolute inset-0 bg-black/70 rounded flex items-center justify-center backdrop-blur-[1px]">
                  <span className="text-white font-mono font-bold text-sm">{(cd / 10).toFixed(1)}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 5. Combat Log (~90px) */}
      <div className="h-[90px] shrink-0 bg-[#0a0a0f] border-t border-tile-border/80 overflow-y-auto p-2 combat-log-scroll">
        <div className="flex flex-col-reverse justify-end min-h-full">
          {logs.map((log, i) => (
            <div 
              key={log.id} 
              className={`text-[12px] leading-[18px] font-mono 
                ${i === 0 ? 'text-white/90 font-bold' : 'text-[#888]'}`}
            >
              {log.msg}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
