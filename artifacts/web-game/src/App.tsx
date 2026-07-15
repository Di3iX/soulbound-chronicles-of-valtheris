import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

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
  { id: 1, name: 'Удар',    emoji: '⚔️', damage: 28, healSelf: 0,  maxCd: 25 },
  { id: 2, name: 'Огонь',   emoji: '🔥', damage: 42, healSelf: 0,  maxCd: 45 },
  { id: 3, name: 'Лечение', emoji: '💚', damage: 0,  healSelf: 30, maxCd: 55 },
  { id: 4, name: 'Молния',  emoji: '⚡', damage: 38, healSelf: 0,  maxCd: 40 },
  { id: 5, name: 'Щит',     emoji: '🛡️', damage: 0,  healSelf: 0,  maxCd: 35 },
];

const INITIAL_PLAYER_HP = 100;

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Phase = 'explore' | 'combat' | 'victory' | 'final-victory' | 'defeat';

interface Enemy {
  id: number;
  name: string;
  emoji: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attackInterval: number; // ms between enemy attacks
  dmgMin: number;
  dmgMax: number;
  dead: boolean;
}

type FloatingNum = {
  id: number;
  value: string;
  col: number;
  row: number;
  type: 'player-dmg' | 'enemy-dmg' | 'heal';
  timestamp: number;
};

type LogEntry = { id: number; msg: string };

// ─── INITIAL ENEMY FACTORY ────────────────────────────────────────────────────

// All positions verified as MAP value 0 (walkable grass).
const makeEnemies = (): Enemy[] => [
  { id: 1, name: 'Гоблин', emoji: '👺', x: 8, y: 0, hp: 150, maxHp: 150, attackInterval: 2200, dmgMin: 5,  dmgMax: 12, dead: false },
  { id: 2, name: 'Гоблин', emoji: '👺', x: 5, y: 3, hp: 150, maxHp: 150, attackInterval: 2200, dmgMin: 5,  dmgMax: 12, dead: false },
  { id: 3, name: 'Гоблин', emoji: '👺', x: 0, y: 5, hp: 150, maxHp: 150, attackInterval: 2200, dmgMin: 5,  dmgMax: 12, dead: false },
  { id: 4, name: 'Волк',   emoji: '🐺', x: 9, y: 6, hp: 100, maxHp: 100, attackInterval: 900,  dmgMin: 3,  dmgMax: 8,  dead: false },
  { id: 5, name: 'Орк',    emoji: '👹', x: 0, y: 0, hp: 300, maxHp: 300, attackInterval: 3500, dmgMin: 15, dmgMax: 25, dead: false },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function App() {

  // ── State ──────────────────────────────────────────────────────────────────

  const [phase, setPhase]               = useState<Phase>('explore');
  const [playerPos, setPlayerPos]       = useState({ x: 1, y: 8 });
  const [playerHp, setPlayerHp]         = useState(INITIAL_PLAYER_HP);
  const [enemies, setEnemies]           = useState<Enemy[]>(makeEnemies);
  const [activeEnemyId, setActiveEnemyId] = useState<number | null>(null);
  const [shieldActive, setShieldActive] = useState(false);
  const [skillsCd, setSkillsCd]         = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [logs, setLogs]                 = useState<LogEntry[]>([{ id: 0, msg: 'Тёмные подземелья ждут...' }]);
  const [floatingNums, setFloatingNums] = useState<FloatingNum[]>([]);

  // ── Refs (stale-closure-safe reads inside intervals) ───────────────────────

  const playerHpRef       = useRef(INITIAL_PLAYER_HP);
  const shieldRef         = useRef(false);
  const phaseRef          = useRef<Phase>('explore');
  const playerPosRef      = useRef({ x: 1, y: 8 });
  const enemiesRef        = useRef<Enemy[]>(makeEnemies());
  const activeEnemyIdRef  = useRef<number | null>(null);
  const enemyAttackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync with state after every render
  useEffect(() => { playerHpRef.current     = playerHp;      }, [playerHp]);
  useEffect(() => { shieldRef.current       = shieldActive;  }, [shieldActive]);
  useEffect(() => { phaseRef.current        = phase;         }, [phase]);
  useEffect(() => { playerPosRef.current    = playerPos;     }, [playerPos]);
  useEffect(() => { enemiesRef.current      = enemies;       }, [enemies]);
  useEffect(() => { activeEnemyIdRef.current = activeEnemyId; }, [activeEnemyId]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [{ id: Date.now() + Math.random(), msg }, ...prev].slice(0, 12));
  }, []);

  const spawnFloat = useCallback((value: string, col: number, row: number, type: FloatingNum['type']) => {
    setFloatingNums(prev => [...prev, { id: Date.now() + Math.random(), value, col, row, type, timestamp: Date.now() }]);
  }, []);

  // ── Enemy death handler ────────────────────────────────────────────────────

  const handleEnemyDeath = useCallback((id: number, ex: number, ey: number, name: string) => {
    // Stop combat immediately via ref so in-flight intervals bail out
    phaseRef.current = 'victory';
    if (enemyAttackTimeout.current) {
      clearTimeout(enemyAttackTimeout.current);
      enemyAttackTimeout.current = null;
    }

    // Mark enemy dead in ref first, then sync to state
    enemiesRef.current = enemiesRef.current.map(e =>
      e.id === id ? { ...e, dead: true, hp: 0 } : e
    );
    setEnemies(prev => prev.map(e => e.id === id ? { ...e, dead: true, hp: 0 } : e));

    // Move player onto the defeated enemy's tile
    playerPosRef.current = { x: ex, y: ey };
    setPlayerPos({ x: ex, y: ey });

    addLog(`💀 ${name} повержен!`);

    const allDead = enemiesRef.current.every(e => e.dead);
    if (allDead) {
      phaseRef.current = 'final-victory';
      setPhase('final-victory');
      setActiveEnemyId(null);
      activeEnemyIdRef.current = null;
      addLog('🏆 Все враги побеждены!');
    } else {
      setPhase('victory');
      // Auto-dismiss the per-kill overlay and resume exploration
      setTimeout(() => {
        if (phaseRef.current === 'victory') {
          phaseRef.current = 'explore';
          setPhase('explore');
          setActiveEnemyId(null);
          activeEnemyIdRef.current = null;
        }
      }, 1500);
    }
  }, [addLog]);

  // ── Movement ──────────────────────────────────────────────────────────────

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (phaseRef.current !== 'explore') return;

    const { x, y } = playerPosRef.current;
    const nx = x + dx;
    const ny = y + dy;

    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
      addLog('Путь заблокирован!');
      return;
    }

    // Enemy-tile check BEFORE obstacle check — enemies are not obstacles
    const hitEnemy = enemiesRef.current.find(e => !e.dead && e.x === nx && e.y === ny);
    if (hitEnemy) {
      phaseRef.current = 'combat';
      activeEnemyIdRef.current = hitEnemy.id;
      setActiveEnemyId(hitEnemy.id);
      setPhase('combat');
      addLog(`⚔️ Бой с ${hitEnemy.name}!`);
      return;
    }

    // Terrain obstacle check (tree / rock / water)
    if (MAP[ny][nx] !== 0) {
      addLog('Путь заблокирован!');
      return;
    }

    playerPosRef.current = { x: nx, y: ny };
    setPlayerPos({ x: nx, y: ny });
  }, [addLog]);

  // ── Combat intervals ──────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'combat') return;

    // Player attacks every 1500 ms (fixed)
    const playerAttackInterval = setInterval(() => {
      if (phaseRef.current !== 'combat') return;

      const id = activeEnemyIdRef.current;
      if (id === null) return;
      const enemy = enemiesRef.current.find(e => e.id === id);
      if (!enemy || enemy.dead || enemy.hp <= 0) return;

      const dmg = Math.floor(Math.random() * 9) + 8; // 8–16
      const newHp = Math.max(0, enemy.hp - dmg);

      // Update ref before state so subsequent reads are consistent
      enemiesRef.current = enemiesRef.current.map(e => e.id === id ? { ...e, hp: newHp } : e);
      setEnemies(prev => prev.map(e => e.id === id ? { ...e, hp: newHp } : e));
      spawnFloat(dmg.toString(), enemy.x, enemy.y, 'enemy-dmg');
      addLog(`⚔️ Воин наносит ${dmg} урона!`);

      if (newHp === 0) handleEnemyDeath(id, enemy.x, enemy.y, enemy.name);
    }, 1500);

    // Enemy attacks on its own attackInterval (different per type) — use recursive setTimeout
    const doEnemyAttack = () => {
      if (phaseRef.current !== 'combat') return;

      const id = activeEnemyIdRef.current;
      const enemy = enemiesRef.current.find(e => e.id === id);
      if (!enemy || enemy.dead || enemy.hp <= 0) return;

      let dmg = Math.floor(Math.random() * (enemy.dmgMax - enemy.dmgMin + 1)) + enemy.dmgMin;
      if (shieldRef.current) dmg = Math.ceil(dmg / 2);

      const pp = playerPosRef.current;
      spawnFloat(dmg.toString(), pp.x, pp.y, 'player-dmg');
      addLog(`${enemy.emoji} ${enemy.name} атакует на ${dmg} урона!`);

      // Avoid side effects inside the React updater — compute outside
      const prevHp = playerHpRef.current;
      const newHp  = Math.max(0, prevHp - dmg);
      playerHpRef.current = newHp;
      setPlayerHp(newHp);

      if (prevHp > 0 && newHp === 0) {
        phaseRef.current = 'defeat';
        setPhase('defeat');
        addLog('☠️ Вы погибли...');
        return; // don't reschedule
      }

      // Reschedule next attack only if still in combat
      if (phaseRef.current === 'combat') {
        enemyAttackTimeout.current = setTimeout(doEnemyAttack, enemy.attackInterval);
      }
    };

    // Schedule first enemy attack after its own interval
    const startEnemy = enemiesRef.current.find(e => e.id === activeEnemyIdRef.current);
    if (startEnemy) {
      enemyAttackTimeout.current = setTimeout(doEnemyAttack, startEnemy.attackInterval);
    }

    return () => {
      clearInterval(playerAttackInterval);
      if (enemyAttackTimeout.current) {
        clearTimeout(enemyAttackTimeout.current);
        enemyAttackTimeout.current = null;
      }
    };
  }, [phase, addLog, spawnFloat, handleEnemyDeath]);

  // ── Skill cooldown ticking ─────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'combat') return;
    const t = setInterval(() => {
      setSkillsCd(prev => {
        const next = { ...prev };
        let changed = false;
        for (const k in next) {
          if (next[k] > 0) { next[k] = Math.max(0, next[k] - 1); changed = true; }
        }
        return changed ? next : prev;
      });
    }, 100);
    return () => clearInterval(t);
  }, [phase]);

  // ── Floating number cleanup ────────────────────────────────────────────────

  useEffect(() => {
    if (floatingNums.length === 0) return;
    const t = setInterval(() => {
      const now = Date.now();
      setFloatingNums(prev => prev.filter(f => now - f.timestamp < 1300));
    }, 200);
    return () => clearInterval(t);
  }, [floatingNums]);

  // ── Skills ────────────────────────────────────────────────────────────────

  const useSkill = useCallback((skill: typeof SKILLS[0]) => {
    if (phaseRef.current !== 'combat') return;
    if (skillsCd[skill.id] > 0) return;

    setSkillsCd(prev => ({ ...prev, [skill.id]: skill.maxCd }));

    if (skill.damage > 0) {
      const id = activeEnemyIdRef.current;
      if (id === null) return;
      const enemy = enemiesRef.current.find(e => e.id === id);
      if (!enemy || enemy.dead || enemy.hp <= 0) return;

      const newHp = Math.max(0, enemy.hp - skill.damage);
      enemiesRef.current = enemiesRef.current.map(e => e.id === id ? { ...e, hp: newHp } : e);
      setEnemies(prev => prev.map(e => e.id === id ? { ...e, hp: newHp } : e));
      spawnFloat(skill.damage.toString(), enemy.x, enemy.y, 'enemy-dmg');
      addLog(`✨ Воин использует ${skill.name} на ${skill.damage} урона!`);

      if (newHp === 0) handleEnemyDeath(id, enemy.x, enemy.y, enemy.name);
    }

    if (skill.healSelf > 0) {
      const pp = playerPosRef.current;
      const newHp = Math.min(INITIAL_PLAYER_HP, playerHpRef.current + skill.healSelf);
      playerHpRef.current = newHp;
      setPlayerHp(newHp);
      spawnFloat(`+${skill.healSelf}`, pp.x, pp.y, 'heal');
      addLog(`💚 Воин лечится на ${skill.healSelf} HP!`);
    }

    if (skill.id === 5) { // Shield
      setShieldActive(true);
      shieldRef.current = true;
      addLog('🛡️ Щит активирован!');
      setTimeout(() => {
        setShieldActive(false);
        shieldRef.current = false;
        addLog('🛡️ Действие щита закончилось.');
      }, 5000);
    }
  }, [skillsCd, addLog, spawnFloat, handleEnemyDeath]);

  // ── Restart ───────────────────────────────────────────────────────────────

  const handleRestart = useCallback(() => {
    // Clear any pending combat timers
    if (enemyAttackTimeout.current) {
      clearTimeout(enemyAttackTimeout.current);
      enemyAttackTimeout.current = null;
    }
    const fresh = makeEnemies();
    phaseRef.current        = 'explore';
    playerHpRef.current     = INITIAL_PLAYER_HP;
    shieldRef.current       = false;
    playerPosRef.current    = { x: 1, y: 8 };
    enemiesRef.current      = fresh;
    activeEnemyIdRef.current = null;
    setPhase('explore');
    setPlayerPos({ x: 1, y: 8 });
    setPlayerHp(INITIAL_PLAYER_HP);
    setEnemies(fresh);
    setActiveEnemyId(null);
    setShieldActive(false);
    setSkillsCd({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    setLogs([{ id: Date.now(), msg: 'Вы возродились. Тёмные подземелья ждут...' }]);
    setFloatingNums([]);
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────

  const activeEnemy   = activeEnemyId !== null ? enemies.find(e => e.id === activeEnemyId) ?? null : null;
  const livingEnemies = enemies.filter(e => !e.dead);

  // ── Tile renderer ──────────────────────────────────────────────────────────

  const renderTileContent = (x: number, y: number, tileType: number) => {
    if (x === playerPos.x && y === playerPos.y) {
      return <div className="w-full h-full tile-player rounded flex items-center justify-center text-lg z-10 relative">🧝</div>;
    }
    const enemy = livingEnemies.find(e => e.x === x && e.y === y);
    if (enemy) {
      const isActive = enemy.id === activeEnemyId;
      return (
        <div className={`w-full h-full rounded flex items-center justify-center text-lg z-10 relative ${isActive ? 'tile-enemy' : 'tile-enemy-idle'}`}>
          {enemy.emoji}
        </div>
      );
    }
    if (tileType === 1) return <div className="w-full h-full tile-tree  flex items-center justify-center text-sm">🌲</div>;
    if (tileType === 2) return <div className="w-full h-full tile-rock  flex items-center justify-center text-sm">🪨</div>;
    if (tileType === 3) return <div className="w-full h-full tile-water flex items-center justify-center text-blue-400 text-xs font-bold tracking-tighter opacity-80">〰</div>;
    return <div className="w-full h-full tile-grass" />;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[100dvh] w-full max-w-[420px] mx-auto bg-background text-foreground flex flex-col relative select-none">

      {/* ── 1. Status Header ── */}
      <div className="h-[55px] shrink-0 border-b border-tile-border flex items-center px-4 justify-between bg-[#111116]">

        {/* Player side */}
        <div className="flex flex-col w-[45%]">
          <div className="flex justify-between items-end mb-1">
            <span className="text-sm font-bold text-white tracking-wide">Воин {shieldActive && '🛡️'}</span>
            <span className="text-xs text-primary font-mono">{playerHp}/{INITIAL_PLAYER_HP}</span>
          </div>
          <div className="h-2 w-full bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(playerHp / INITIAL_PLAYER_HP) * 100}%` }} />
          </div>
        </div>

        <div className="text-sm font-bold text-[#444] text-center w-[10%]">VS</div>

        {/* Enemy side — shows active enemy during combat, remaining count otherwise */}
        <div className="flex flex-col w-[45%]">
          {activeEnemy ? (
            <>
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs text-destructive font-mono">{activeEnemy.hp}/{activeEnemy.maxHp}</span>
                <span className="text-sm font-bold text-white tracking-wide">{activeEnemy.emoji} {activeEnemy.name}</span>
              </div>
              <div className="h-2 w-full bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border flex justify-end">
                <div className="h-full bg-destructive transition-all duration-300" style={{ width: `${(activeEnemy.hp / activeEnemy.maxHp) * 100}%` }} />
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-end items-end mb-1">
                <span className="text-xs text-[#666] font-mono">Врагов: {livingEnemies.length} / 5</span>
              </div>
              <div className="h-2 w-full bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border" />
            </>
          )}
        </div>
      </div>

      {/* ── 2. Map Grid ── */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] p-2">
        <div className="relative" style={{ width: 'min(90vw, 360px)', height: 'min(90vw, 360px)' }}>

          {/* Tile grid */}
          <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 gap-[1px] bg-tile-border p-[1px] border border-tile-border rounded shadow-lg shadow-black/50 overflow-hidden">
            {MAP.map((row, y) =>
              row.map((tileType, x) => (
                <div key={`${x}-${y}`} className="relative bg-map-bg">
                  {renderTileContent(x, y, tileType)}
                </div>
              ))
            )}
          </div>

          {/* HP bars on map — player bar */}
          {phase === 'combat' && playerHp > 0 && (
            <div className="absolute pointer-events-none z-20 flex justify-center"
              style={{ top: `${(playerPos.y / 10) * 100}%`, left: `${(playerPos.x / 10) * 100}%`, width: '10%', height: '10%', marginTop: '-6px' }}>
              <div className="w-[80%] h-[4px] bg-[#1a1a1f] border border-black rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(playerHp / INITIAL_PLAYER_HP) * 100}%` }} />
              </div>
            </div>
          )}

          {/* HP bars on map — active enemy bar */}
          {phase === 'combat' && activeEnemy && activeEnemy.hp > 0 && (
            <div className="absolute pointer-events-none z-20 flex justify-center"
              style={{ top: `${(activeEnemy.y / 10) * 100}%`, left: `${(activeEnemy.x / 10) * 100}%`, width: '10%', height: '10%', marginTop: '-6px' }}>
              <div className="w-[80%] h-[4px] bg-[#1a1a1f] border border-black rounded-full overflow-hidden">
                <div className="h-full bg-destructive" style={{ width: `${(activeEnemy.hp / activeEnemy.maxHp) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Floating damage / heal numbers */}
          {floatingNums.map(num => (
            <div key={num.id}
              className="absolute pointer-events-none z-30 font-bold text-base text-center animate-float w-[10%] h-[10%] flex items-center justify-center drop-shadow-md"
              style={{
                top:   `${(num.row / 10) * 100}%`,
                left:  `${(num.col / 10) * 100}%`,
                color: num.type === 'player-dmg' ? 'hsl(var(--destructive))' : num.type === 'heal' ? 'hsl(var(--success))' : 'hsl(var(--primary))',
              }}>
              {num.value}
            </div>
          ))}

          {/* Per-kill flash overlay — no button, auto-dismisses in 1.5 s */}
          {phase === 'victory' && (
            <div className="absolute inset-0 z-50 bg-black/70 flex flex-col items-center justify-center rounded backdrop-blur-sm animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold text-primary drop-shadow-lg">⚔️ ПОБЕДА!</h2>
              <p className="text-white/70 mt-1 text-sm">Враг повержен!</p>
            </div>
          )}

          {/* Final victory overlay */}
          {phase === 'final-victory' && (
            <div className="absolute inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded backdrop-blur-sm animate-in fade-in duration-500">
              <h2 className="text-3xl font-bold text-primary mb-2 drop-shadow-lg">🏆 ПОБЕДА!</h2>
              <p className="text-white/80 mb-1 font-medium">Все враги повержены!</p>
              <p className="text-[#666] text-sm mb-6">Вы — герой подземелья</p>
              <button onClick={handleRestart}
                className="px-6 py-3 bg-[#1e1e28] border-2 border-primary text-primary font-bold rounded-lg shadow-[0_0_15px_rgba(200,150,42,0.3)] active:scale-95 transition-transform">
                Играть снова
              </button>
            </div>
          )}

          {/* Defeat overlay */}
          {phase === 'defeat' && (
            <div className="absolute inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded backdrop-blur-sm animate-in fade-in duration-500">
              <h2 className="text-3xl font-bold text-destructive mb-2 drop-shadow-lg">☠️ ПОРАЖЕНИЕ</h2>
              <p className="text-white/80 mb-6 font-medium">Вы пали в бою...</p>
              <button onClick={handleRestart}
                className="px-6 py-3 bg-[#1e1e28] border-2 border-primary text-primary font-bold rounded-lg shadow-[0_0_15px_rgba(200,150,42,0.3)] active:scale-95 transition-transform">
                Играть снова
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── 3. D-Pad ── */}
      <div className="h-[140px] shrink-0 flex flex-col items-center justify-center border-t border-tile-border/50 bg-[#0c0c10]">
        <span className="text-[10px] uppercase tracking-widest text-[#666] mb-2 font-bold">Движение</span>
        <div className="grid grid-cols-3 gap-[6px]">
          <div />
          <button disabled={phase !== 'explore'} onClick={() => movePlayer(0, -1)}
            className="dpad-btn w-[56px] h-[56px] bg-[#1e1e28] border-2 border-primary rounded-lg flex items-center justify-center text-primary disabled:opacity-30 disabled:border-tile-border disabled:text-tile-border transition-colors shadow-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          </button>
          <div />
          <button disabled={phase !== 'explore'} onClick={() => movePlayer(-1, 0)}
            className="dpad-btn w-[56px] h-[56px] bg-[#1e1e28] border-2 border-primary rounded-lg flex items-center justify-center text-primary disabled:opacity-30 disabled:border-tile-border disabled:text-tile-border transition-colors shadow-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button disabled={phase !== 'explore'} onClick={() => movePlayer(0, 1)}
            className="dpad-btn w-[56px] h-[56px] bg-[#1e1e28] border-2 border-primary rounded-lg flex items-center justify-center text-primary disabled:opacity-30 disabled:border-tile-border disabled:text-tile-border transition-colors shadow-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <button disabled={phase !== 'explore'} onClick={() => movePlayer(1, 0)}
            className="dpad-btn w-[56px] h-[56px] bg-[#1e1e28] border-2 border-primary rounded-lg flex items-center justify-center text-primary disabled:opacity-30 disabled:border-tile-border disabled:text-tile-border transition-colors shadow-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* ── 4. Skill Bar ── */}
      <div className="h-[80px] shrink-0 bg-[#111116] border-t border-tile-border p-2 flex justify-center gap-2 overflow-x-auto">
        {SKILLS.map(skill => {
          const cd       = skillsCd[skill.id] || 0;
          const isOnCd   = cd > 0;
          const isUsable = phase === 'combat' && !isOnCd;
          return (
            <button key={skill.id} disabled={!isUsable} onClick={() => useSkill(skill)}
              className={`relative flex flex-col items-center justify-center w-[60px] h-[60px] rounded bg-[#1e1e28] border
                ${isUsable ? 'border-skill shadow-[0_0_10px_rgba(26,74,139,0.5)] cursor-pointer active:scale-95 transition-all' : 'border-tile-border opacity-60 cursor-not-allowed'}`}>
              <span className="text-xl mb-1">{skill.emoji}</span>
              <span className="text-[10px] font-bold text-white/80">{skill.name}</span>
              {isOnCd && (
                <div className="absolute inset-0 bg-black/70 rounded flex items-center justify-center">
                  <span className="text-white font-mono font-bold text-sm">{(cd / 10).toFixed(1)}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── 5. Combat Log ── */}
      <div className="h-[90px] shrink-0 bg-[#0a0a0f] border-t border-tile-border/80 overflow-y-auto p-2 combat-log-scroll">
        <div className="flex flex-col-reverse justify-end min-h-full">
          {logs.map((log, i) => (
            <div key={log.id} className={`text-[12px] leading-[18px] font-mono ${i === 0 ? 'text-white/90 font-bold' : 'text-[#888]'}`}>
              {log.msg}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
