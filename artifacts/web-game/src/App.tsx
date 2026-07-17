import React, { useState, useEffect, useCallback, useRef } from 'react';
import { saveGame, loadGame, clearSave, SaveData } from './save';
import {
  Item, ItemType, ItemBonuses, Rarity,
  ITEM_CATALOG, DROP_TABLES, RARITY_STYLE, TYPE_LABEL,
  makeItem, formatBonuses,
} from './inventory';
import {
  Equipment, EquipBonuses,
  EMPTY_EQUIPMENT, ZERO_EQUIP_BONUSES, SLOT_META,
  calcEquipBonuses,
} from './equipment';
import {
  LocationId, Phase, Enemy, KillReward,
  SKILLS, STAT_POINTS_PER_LEVEL, REWARD_TABLE,
  xpRequired, calcAttackInterval, makeLocationEnemies,
} from './combat';
import {
  MAP_COLS, MAP_ROWS, VP_COLS, VP_ROWS,
  LOCATION_META, LOCATION_SPAWN, LOCATION_EXITS, LOCATION_MAPS, LOCATION_NPCS,
  getLocation, moveToLocation, getAvailableExits,
} from './world/locations';

const INITIAL_PLAYER_HP      = 100;
const INITIAL_PLAYER_LVL     = 1;
const INITIAL_STATS          = { strength: 5, agility: 5, endurance: 5 };


// ─── PURE HELPERS ─────────────────────────────────────────────────────────────

/** Full player max HP. */
function calcMaxHp(levelHpBonus: number, endurance: number, equipHp = 0): number {
  return INITIAL_PLAYER_HP + levelHpBonus + endurance * 10 + equipHp;
}


// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Stats { strength: number; agility: number; endurance: number; }
type FloatingNum = { id: number; value: string; col: number; row: number; type: 'player-dmg' | 'enemy-dmg' | 'heal'; timestamp: number; };
type LogEntry = { id: number; msg: string };

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function App() {

  // ── Load saved game exactly once on mount ──────────────────────────────────
  const [sv] = useState<SaveData | null>(() => loadGame());

  // ── Core state ─────────────────────────────────────────────────────────────
  const [phase, setPhase]                 = useState<Phase>('explore');
  const [playerPos, setPlayerPos]         = useState(sv?.playerPos        ?? LOCATION_SPAWN.city);
  const [playerHp, setPlayerHp]           = useState(sv?.playerHp         ?? INITIAL_PLAYER_HP);
  const [playerMaxHp, setPlayerMaxHp]     = useState(sv?.playerMaxHp      ?? calcMaxHp(0, INITIAL_STATS.endurance));
  const [enemies, setEnemies]             = useState<Enemy[]>(sv?.enemies  ?? []);
  const [activeEnemyId, setActiveEnemyId] = useState<number | null>(null);
  const [shieldActive, setShieldActive]   = useState(false);
  const [skillsCd, setSkillsCd]           = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [logs, setLogs]                   = useState<LogEntry[]>([{ id: 0, msg: sv ? '💾 Игра загружена!' : 'Тёмные подземелья ждут...' }]);
  const [floatingNums, setFloatingNums]   = useState<FloatingNum[]>([]);

  // ── Progression state ──────────────────────────────────────────────────────
  const [playerLevel, setPlayerLevel]       = useState(sv?.playerLevel     ?? INITIAL_PLAYER_LVL);
  const [playerXp, setPlayerXp]             = useState(sv?.playerXp        ?? 0);
  const [xpToNext, setXpToNext]             = useState(sv?.xpToNext        ?? xpRequired(INITIAL_PLAYER_LVL));
  const [playerGold, setPlayerGold]         = useState(sv?.playerGold      ?? 0);
  const [playerBonusDmg, setPlayerBonusDmg] = useState(sv?.playerBonusDmg ?? 0);
  const [levelHpBonus, setLevelHpBonus]     = useState(sv?.levelHpBonus    ?? 0);
  const [lastKillReward, setLastKillReward] = useState<KillReward | null>(null);

  // ── Stats state ────────────────────────────────────────────────────────────
  const [stats, setStats]               = useState<Stats>(sv?.stats         ?? { ...INITIAL_STATS });
  const [statPoints, setStatPoints]     = useState(sv?.statPoints            ?? 0);
  const [showCharPanel, setShowCharPanel] = useState(false);

  // ── Inventory / equipment state ────────────────────────────────────────────
  const [equipment, setEquipment]         = useState<Equipment>(sv?.equipment       ?? { ...EMPTY_EQUIPMENT });
  const [inventory, setInventory]         = useState<Item[]>(sv?.inventory           ?? []);
  const [equipBonuses, setEquipBonuses]   = useState<EquipBonuses>(sv?.equipBonuses ?? { ...ZERO_EQUIP_BONUSES });
  const [showInventory, setShowInventory] = useState(false);
  const [selectedItem, setSelectedItem]   = useState<Item | null>(null);
  const [lootNotif, setLootNotif]         = useState<string | null>(null);

  // ── World map state ─────────────────────────────────────────────────────────
  const [currentLocation, setCurrentLocation] = useState<LocationId>(sv?.currentLocation ?? 'city');
  const [transitioning, setTransitioning]     = useState(false);
  const [npcDialog, setNpcDialog]             = useState<string | null>(null);

  // ── Refs (initialised from save so callbacks see correct values immediately) ─
  const playerHpRef        = useRef(sv?.playerHp         ?? calcMaxHp(0, INITIAL_STATS.endurance));
  const playerMaxHpRef     = useRef(sv?.playerMaxHp      ?? calcMaxHp(0, INITIAL_STATS.endurance));
  const shieldRef          = useRef(false);
  const phaseRef           = useRef<Phase>('explore');
  const playerPosRef       = useRef(sv?.playerPos         ?? LOCATION_SPAWN.city);
  const enemiesRef         = useRef<Enemy[]>(sv?.enemies  ?? []);
  const activeEnemyIdRef   = useRef<number | null>(null);
  const statsRef           = useRef<Stats>(sv?.stats      ?? { ...INITIAL_STATS });
  const playerBonusDmgRef  = useRef(sv?.playerBonusDmg   ?? 0);
  const levelHpBonusRef    = useRef(sv?.levelHpBonus      ?? 0);
  const playerLevelRef     = useRef(sv?.playerLevel       ?? INITIAL_PLAYER_LVL);
  const playerXpRef        = useRef(sv?.playerXp          ?? 0);
  const playerGoldRef      = useRef(sv?.playerGold        ?? 0);
  const statPointsRef      = useRef(sv?.statPoints        ?? 0);
  const equipmentRef       = useRef<Equipment>(sv?.equipment        ?? { ...EMPTY_EQUIPMENT });
  const equipBonusesRef    = useRef<EquipBonuses>(sv?.equipBonuses  ?? { ...ZERO_EQUIP_BONUSES });
  const currentLocationRef = useRef<LocationId>(sv?.currentLocation ?? 'city');
  const transitioningRef   = useRef(false);
  // These two have no paired state→ref sync in callbacks, so we track them explicitly:
  const inventoryRef       = useRef<Item[]>(sv?.inventory        ?? []);
  const xpToNextRef        = useRef(sv?.xpToNext                 ?? xpRequired(INITIAL_PLAYER_LVL));
  // Prevents the auto-save from firing on the very first render (initial mount).
  // On mount the game either restores a save (sv != null) or starts fresh —
  // either way there is nothing new to persist yet.
  const hasMountedRef      = useRef(false);
  const playerAttackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enemyAttackTimeout  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync
  useEffect(() => { playerHpRef.current       = playerHp;         }, [playerHp]);
  useEffect(() => { playerMaxHpRef.current     = playerMaxHp;     }, [playerMaxHp]);
  useEffect(() => { shieldRef.current          = shieldActive;    }, [shieldActive]);
  useEffect(() => { phaseRef.current           = phase;           }, [phase]);
  useEffect(() => { playerPosRef.current       = playerPos;       }, [playerPos]);
  useEffect(() => { enemiesRef.current         = enemies;         }, [enemies]);
  useEffect(() => { activeEnemyIdRef.current   = activeEnemyId;   }, [activeEnemyId]);
  useEffect(() => { currentLocationRef.current = currentLocation; }, [currentLocation]);
  useEffect(() => { transitioningRef.current   = transitioning;   }, [transitioning]);
  useEffect(() => { statsRef.current           = stats;         }, [stats]);
  useEffect(() => { playerBonusDmgRef.current  = playerBonusDmg; }, [playerBonusDmg]);
  useEffect(() => { levelHpBonusRef.current    = levelHpBonus;  }, [levelHpBonus]);
  useEffect(() => { playerLevelRef.current     = playerLevel;   }, [playerLevel]);
  useEffect(() => { playerXpRef.current        = playerXp;      }, [playerXp]);
  useEffect(() => { playerGoldRef.current      = playerGold;    }, [playerGold]);
  useEffect(() => { statPointsRef.current      = statPoints;    }, [statPoints]);
  useEffect(() => { equipmentRef.current       = equipment;     }, [equipment]);
  useEffect(() => { equipBonusesRef.current    = equipBonuses;  }, [equipBonuses]);
  useEffect(() => { inventoryRef.current       = inventory;     }, [inventory]);
  useEffect(() => { xpToNextRef.current        = xpToNext;      }, [xpToNext]);

  // ── Auto-save: immediate write on any meaningful state change ──────────────
  // Rules:
  //   1. Skip the very first render — nothing has changed yet, and we must not
  //      write an empty/default player over a just-loaded save.
  //   2. After mount, every dependency change (XP, gold, HP, position, level,
  //      inventory, equipment …) triggers an immediate localStorage write so the
  //      save is always current.  No debounce means no pending timeout that a
  //      page refresh could cancel.
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return; // first render — load path already handled by sv initializer
    }
    saveGame({
      playerLevel, playerXp, xpToNext, playerGold,
      playerBonusDmg, levelHpBonus,
      playerHp, playerMaxHp,
      stats, statPoints,
      inventory, equipment, equipBonuses,
      playerPos, currentLocation, enemies,
    });
  }, [playerLevel, playerXp, xpToNext, playerGold, playerBonusDmg, levelHpBonus,
      playerHp, playerMaxHp, stats, statPoints, inventory, equipment, equipBonuses,
      playerPos, currentLocation, enemies]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const addLog = useCallback((msg: string) => {
    setLogs(prev => [{ id: Date.now() + Math.random(), msg }, ...prev].slice(0, 12));
  }, []);

  const spawnFloat = useCallback((value: string, col: number, row: number, type: FloatingNum['type']) => {
    setFloatingNums(prev => [...prev, { id: Date.now() + Math.random(), value, col, row, type, timestamp: Date.now() }]);
  }, []);

  // ── Stat spending ──────────────────────────────────────────────────────────
  const spendStat = useCallback((stat: keyof Stats) => {
    if (statPointsRef.current <= 0) return;
    const newStats = { ...statsRef.current, [stat]: statsRef.current[stat] + 1 };
    statsRef.current = newStats;
    setStats(newStats);
    statPointsRef.current -= 1;
    setStatPoints(p => p - 1);
    if (stat === 'endurance') {
      const newMaxHp = calcMaxHp(levelHpBonusRef.current, newStats.endurance, equipBonusesRef.current.hp);
      playerMaxHpRef.current = newMaxHp;
      setPlayerMaxHp(newMaxHp);
    }
  }, []);

  // ── Equipment ─────────────────────────────────────────────────────────────
  const equipItem = useCallback((item: Item) => {
    const slot = item.type as keyof Equipment;
    const prevItem = equipmentRef.current[slot];
    const oldBonuses = equipBonusesRef.current;

    const newEquipment: Equipment = { ...equipmentRef.current, [slot]: item };
    equipmentRef.current = newEquipment;
    setEquipment(newEquipment);

    // Remove newly-equipped item from inventory; return displaced item if any
    setInventory(prev => {
      let next = prev.filter(i => i.id !== item.id);
      if (prevItem) next = [...next, prevItem];
      return next;
    });

    // Recalc bonuses from scratch (no double-counting possible)
    const newBonuses = calcEquipBonuses(newEquipment);
    equipBonusesRef.current = newBonuses;
    setEquipBonuses(newBonuses);

    // Recalc max HP
    const newMaxHp = calcMaxHp(levelHpBonusRef.current, statsRef.current.endurance, newBonuses.hp);
    playerMaxHpRef.current = newMaxHp;
    setPlayerMaxHp(newMaxHp);

    // Increase current HP by the positive HP delta (first equip of HP item)
    const hpDelta = newBonuses.hp - oldBonuses.hp;
    if (hpDelta > 0) {
      const newHp = Math.min(newMaxHp, playerHpRef.current + hpDelta);
      playerHpRef.current = newHp;
      setPlayerHp(newHp);
    }

    setSelectedItem(null);
    addLog(`🗡️ Экипировано: ${item.name}`);
  }, [addLog]);

  const unequipItem = useCallback((slot: keyof Equipment) => {
    const item = equipmentRef.current[slot];
    if (!item) return;

    const oldBonuses = equipBonusesRef.current;
    const newEquipment: Equipment = { ...equipmentRef.current, [slot]: null };
    equipmentRef.current = newEquipment;
    setEquipment(newEquipment);

    // Return item to inventory
    setInventory(prev => [...prev, item]);

    // Recalc bonuses from scratch
    const newBonuses = calcEquipBonuses(newEquipment);
    equipBonusesRef.current = newBonuses;
    setEquipBonuses(newBonuses);

    // Recalc max HP
    const newMaxHp = calcMaxHp(levelHpBonusRef.current, statsRef.current.endurance, newBonuses.hp);
    playerMaxHpRef.current = newMaxHp;
    setPlayerMaxHp(newMaxHp);

    // Clamp current HP to new (lower) max if necessary
    const hpDelta = newBonuses.hp - oldBonuses.hp; // will be negative or zero
    if (hpDelta < 0) {
      const clampedHp = Math.min(playerHpRef.current, newMaxHp);
      if (clampedHp !== playerHpRef.current) {
        playerHpRef.current = clampedHp;
        setPlayerHp(clampedHp);
      }
    }

    setSelectedItem(null);
    addLog(`📤 Снято: ${item.name}`);
  }, [addLog]);

  // ── Loot drop (called from applyRewards) ──────────────────────────────────
  const rollLoot = useCallback((enemyName: string): Item | undefined => {
    const table = DROP_TABLES[enemyName];
    if (!table || Math.random() >= table.chance) return undefined;
    const key = table.pool[Math.floor(Math.random() * table.pool.length)];
    const item = makeItem(key);
    setInventory(prev => [...prev, item]);
    setLootNotif(item.name);
    addLog(`📦 Получен лут: ${item.name}!`);
    setTimeout(() => setLootNotif(null), 2500);
    return item;
  }, [addLog]);

  // ── Progression ───────────────────────────────────────────────────────────
  const applyRewards = useCallback((enemyName: string): KillReward => {
    const reward = REWARD_TABLE[enemyName] ?? { xp: 10, goldMin: 1, goldMax: 3 };

    const goldGained = Math.floor(Math.random() * (reward.goldMax - reward.goldMin + 1)) + reward.goldMin;
    playerGoldRef.current += goldGained;
    setPlayerGold(playerGoldRef.current);
    addLog(`💰 Получено ${goldGained} золота!`);

    const xpGained = reward.xp;
    addLog(`✨ Получено ${xpGained} опыта!`);

    let newXp = playerXpRef.current + xpGained;
    let newLevel = playerLevelRef.current;
    let newBonusDmg = playerBonusDmgRef.current;
    let hpBonusDelta = 0, newStatPts = 0;
    let leveledUp = false;
    let needed = xpRequired(newLevel);

    while (newXp >= needed) {
      newXp -= needed; newLevel++; newBonusDmg += 2; hpBonusDelta += 20; newStatPts += STAT_POINTS_PER_LEVEL; needed = xpRequired(newLevel); leveledUp = true;
    }

    const newLevelHpBonus = levelHpBonusRef.current + hpBonusDelta;
    const newMaxHp = calcMaxHp(newLevelHpBonus, statsRef.current.endurance, equipBonusesRef.current.hp);

    playerLevelRef.current    = newLevel;
    playerBonusDmgRef.current = newBonusDmg;
    levelHpBonusRef.current   = newLevelHpBonus;
    playerMaxHpRef.current    = newMaxHp;
    playerXpRef.current       = newXp;

    setPlayerXp(newXp); setXpToNext(needed); setPlayerLevel(newLevel);
    setPlayerBonusDmg(newBonusDmg); setLevelHpBonus(newLevelHpBonus); setPlayerMaxHp(newMaxHp);

    if (newStatPts > 0) {
      statPointsRef.current += newStatPts;
      setStatPoints(p => p + newStatPts);
      addLog(`🎯 +${newStatPts} очка характеристик!`);
    }
    if (leveledUp) {
      playerHpRef.current = newMaxHp; setPlayerHp(newMaxHp);
      addLog(`🌟 Новый уровень ${newLevel}! HP восстановлено!`);
    }

    const droppedItem = rollLoot(enemyName);
    return { xp: xpGained, gold: goldGained, leveledUp, newLevel, statPtsGained: newStatPts, droppedItem };
  }, [addLog, rollLoot]);

  // ── Enemy death ──────────────────────────────────────────────────────────
  const handleEnemyDeath = useCallback((id: number, ex: number, ey: number, name: string) => {
    phaseRef.current = 'victory';
    if (playerAttackTimeout.current) { clearTimeout(playerAttackTimeout.current); playerAttackTimeout.current = null; }
    if (enemyAttackTimeout.current)  { clearTimeout(enemyAttackTimeout.current);  enemyAttackTimeout.current  = null; }

    enemiesRef.current = enemiesRef.current.map(e => e.id === id ? { ...e, dead: true, hp: 0 } : e);
    setEnemies(prev => prev.map(e => e.id === id ? { ...e, dead: true, hp: 0 } : e));
    playerPosRef.current = { x: ex, y: ey };
    setPlayerPos({ x: ex, y: ey });
    addLog(`💀 ${name} повержен!`);

    const reward = applyRewards(name);
    setLastKillReward(reward);

    const allDead = enemiesRef.current.every(e => e.dead);
    if (allDead) {
      phaseRef.current = 'final-victory'; setPhase('final-victory');
      setActiveEnemyId(null); activeEnemyIdRef.current = null;
      addLog('🏆 Все враги побеждены!');
    } else {
      setPhase('victory');
      setTimeout(() => {
        if (phaseRef.current === 'victory') {
          phaseRef.current = 'explore'; setPhase('explore');
          setActiveEnemyId(null); activeEnemyIdRef.current = null;
        }
      }, 1500);
    }
  }, [addLog, applyRewards]);

  // ── Location transition ───────────────────────────────────────────────────
  const handleLocationTransition = useCallback((to: LocationId, spawnAt: { x: number; y: number }) => {
    if (transitioningRef.current) return;
    if (playerAttackTimeout.current) { clearTimeout(playerAttackTimeout.current); playerAttackTimeout.current = null; }
    if (enemyAttackTimeout.current)  { clearTimeout(enemyAttackTimeout.current);  enemyAttackTimeout.current  = null; }
    transitioningRef.current = true;
    setTransitioning(true);
    setTimeout(() => {
      const fresh = makeLocationEnemies(to);
      currentLocationRef.current  = to;
      playerPosRef.current        = spawnAt;
      enemiesRef.current          = fresh;
      phaseRef.current            = 'explore';
      activeEnemyIdRef.current    = null;
      transitioningRef.current    = false;
      setCurrentLocation(to);
      setPlayerPos(spawnAt);
      setEnemies(fresh);
      setPhase('explore');
      setActiveEnemyId(null);
      setShieldActive(false);
      setSkillsCd({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      setFloatingNums([]);
      setTransitioning(false);
      addLog(`📍 Вы прибыли: ${LOCATION_META[to].label}`);
    }, 800);
  }, [addLog]);

  // ── Movement ─────────────────────────────────────────────────────────────
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (phaseRef.current !== 'explore') return;
    if (transitioningRef.current) return;
    const { x, y } = playerPosRef.current;
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= MAP_COLS || ny >= MAP_ROWS) { addLog('Путь заблокирован!'); return; }
    const currentMap = LOCATION_MAPS[currentLocationRef.current];
    const tileType = currentMap[ny]?.[nx] ?? 1;
    // NPC intercept
    const npc = (LOCATION_NPCS[currentLocationRef.current] ?? []).find(n => n.x === nx && n.y === ny);
    if (npc) { setNpcDialog(`${npc.emoji} ${npc.name}: «Скоро здесь будут квесты и торговля! Следите за обновлениями.»`); return; }
    // Enemy intercept
    const hitEnemy = enemiesRef.current.find(e => !e.dead && e.x === nx && e.y === ny);
    if (hitEnemy) {
      phaseRef.current = 'combat'; activeEnemyIdRef.current = hitEnemy.id;
      setActiveEnemyId(hitEnemy.id); setPhase('combat');
      addLog(`⚔️ Бой с ${hitEnemy.name}!`); return;
    }
    // Exit tile intercept
    if (tileType === 4) {
      const exits = LOCATION_EXITS[currentLocationRef.current];
      const exit = exits?.get(`${nx},${ny}`);
      if (exit) { handleLocationTransition(exit.to, exit.spawnAt); return; }
    }
    if (tileType !== 0) { addLog('Путь заблокирован!'); return; }
    playerPosRef.current = { x: nx, y: ny }; setPlayerPos({ x: nx, y: ny });
  }, [addLog, handleLocationTransition]);

  // ── Combat ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'combat') return;

    const doPlayerAttack = () => {
      if (phaseRef.current !== 'combat') return;
      const id = activeEnemyIdRef.current;
      if (id === null) return;
      const enemy = enemiesRef.current.find(e => e.id === id);
      if (!enemy || enemy.dead || enemy.hp <= 0) return;

      // Damage includes level bonus, stat strength, and equipment
      const eb = equipBonusesRef.current;
      const dmg = Math.floor(Math.random() * 9) + 8
                + playerBonusDmgRef.current
                + (statsRef.current.strength + eb.strength) * 2
                + eb.damage;
      const newHp = Math.max(0, enemy.hp - dmg);

      enemiesRef.current = enemiesRef.current.map(e => e.id === id ? { ...e, hp: newHp } : e);
      setEnemies(prev => prev.map(e => e.id === id ? { ...e, hp: newHp } : e));
      spawnFloat(dmg.toString(), enemy.x, enemy.y, 'enemy-dmg');
      addLog(`⚔️ Воин наносит ${dmg} урона!`);

      if (newHp === 0) { handleEnemyDeath(id, enemy.x, enemy.y, enemy.name); return; }

      if (phaseRef.current === 'combat') {
        const interval = calcAttackInterval(
          statsRef.current.agility + equipBonusesRef.current.agility,
          equipBonusesRef.current.atkSpeedPenalty
        );
        playerAttackTimeout.current = setTimeout(doPlayerAttack, interval);
      }
    };

    const firstInterval = calcAttackInterval(
      statsRef.current.agility + equipBonusesRef.current.agility,
      equipBonusesRef.current.atkSpeedPenalty
    );
    playerAttackTimeout.current = setTimeout(doPlayerAttack, firstInterval);

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

      const prevHp = playerHpRef.current;
      const newHp  = Math.max(0, prevHp - dmg);
      playerHpRef.current = newHp; setPlayerHp(newHp);

      if (prevHp > 0 && newHp === 0) {
        phaseRef.current = 'defeat'; setPhase('defeat');
        addLog('☠️ Вы погибли...'); return;
      }
      if (phaseRef.current === 'combat') {
        enemyAttackTimeout.current = setTimeout(doEnemyAttack, enemy.attackInterval);
      }
    };

    const startEnemy = enemiesRef.current.find(e => e.id === activeEnemyIdRef.current);
    if (startEnemy) enemyAttackTimeout.current = setTimeout(doEnemyAttack, startEnemy.attackInterval);

    return () => {
      if (playerAttackTimeout.current) { clearTimeout(playerAttackTimeout.current); playerAttackTimeout.current = null; }
      if (enemyAttackTimeout.current)  { clearTimeout(enemyAttackTimeout.current);  enemyAttackTimeout.current  = null; }
    };
  }, [phase, addLog, spawnFloat, handleEnemyDeath]);

  // ── Skill cooldowns ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'combat') return;
    const t = setInterval(() => {
      setSkillsCd(prev => {
        const next = { ...prev }; let changed = false;
        for (const k in next) { if (next[k] > 0) { next[k] = Math.max(0, next[k] - 1); changed = true; } }
        return changed ? next : prev;
      });
    }, 100);
    return () => clearInterval(t);
  }, [phase]);

  // ── Floating number cleanup ───────────────────────────────────────────────
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
      const newHp = Math.min(playerMaxHpRef.current, playerHpRef.current + skill.healSelf);
      playerHpRef.current = newHp; setPlayerHp(newHp);
      spawnFloat(`+${skill.healSelf}`, pp.x, pp.y, 'heal');
      addLog(`💚 Воин лечится на ${skill.healSelf} HP!`);
    }
    if (skill.id === 5) {
      setShieldActive(true); shieldRef.current = true;
      addLog('🛡️ Щит активирован!');
      setTimeout(() => { setShieldActive(false); shieldRef.current = false; addLog('🛡️ Действие щита закончилось.'); }, 5000);
    }
  }, [skillsCd, addLog, spawnFloat, handleEnemyDeath]);

  // ── Reset current map (respawn in current location — keep all character progress) ──
  const resetCurrentMap = useCallback(() => {
    if (playerAttackTimeout.current) { clearTimeout(playerAttackTimeout.current); playerAttackTimeout.current = null; }
    if (enemyAttackTimeout.current)  { clearTimeout(enemyAttackTimeout.current);  enemyAttackTimeout.current  = null; }

    const loc   = currentLocationRef.current;
    const fresh = makeLocationEnemies(loc);
    const spawn = LOCATION_SPAWN[loc];

    // Max HP is based on current level, stats and equipment — nothing changes here
    const fullHp = playerMaxHpRef.current;

    // Run-level state
    phaseRef.current         = 'explore';
    playerHpRef.current      = fullHp;
    shieldRef.current        = false;
    playerPosRef.current     = spawn;
    enemiesRef.current       = fresh;
    activeEnemyIdRef.current = null;

    setPhase('explore');
    setPlayerPos(spawn);
    setPlayerHp(fullHp);
    setEnemies(fresh);
    setActiveEnemyId(null);
    setShieldActive(false);
    setSkillsCd({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    setFloatingNums([]);
    setLastKillReward(null);
    setLootNotif(null);
    setShowInventory(false);
    setSelectedItem(null);
    setShowCharPanel(false);
    setLogs([{ id: Date.now(), msg: `🗺️ Новый забег начат. Lv.${playerLevelRef.current} · 💰${playerGoldRef.current}` }]);

    // ── Character progress intentionally NOT reset: ──────────────────────────
    // level, XP, statPoints, stats, playerBonusDmg, levelHpBonus,
    // gold, inventory, equipment, equipBonuses, playerMaxHp
  }, []);

  // ── Full reset — wipes save, returns to Lv.1 in city ("Играть снова") ──────
  const resetCharacter = useCallback(() => {
    if (playerAttackTimeout.current) { clearTimeout(playerAttackTimeout.current); playerAttackTimeout.current = null; }
    if (enemyAttackTimeout.current)  { clearTimeout(enemyAttackTimeout.current);  enemyAttackTimeout.current  = null; }

    clearSave();

    const initMaxHp = calcMaxHp(0, INITIAL_STATS.endurance);

    // Reset refs immediately so any in-flight callbacks see correct values
    playerHpRef.current        = initMaxHp;
    playerMaxHpRef.current     = initMaxHp;
    phaseRef.current           = 'explore';
    shieldRef.current          = false;
    playerPosRef.current       = LOCATION_SPAWN.city;
    enemiesRef.current         = [];
    activeEnemyIdRef.current   = null;
    playerBonusDmgRef.current  = 0;
    levelHpBonusRef.current    = 0;
    playerLevelRef.current     = INITIAL_PLAYER_LVL;
    playerXpRef.current        = 0;
    xpToNextRef.current        = xpRequired(INITIAL_PLAYER_LVL);
    playerGoldRef.current      = 0;
    statPointsRef.current      = 0;
    statsRef.current           = { ...INITIAL_STATS };
    equipmentRef.current       = { ...EMPTY_EQUIPMENT };
    equipBonusesRef.current    = { ...ZERO_EQUIP_BONUSES };
    inventoryRef.current       = [];
    currentLocationRef.current = 'city';

    // Reset state
    setPhase('explore');
    setPlayerPos(LOCATION_SPAWN.city);
    setPlayerHp(initMaxHp);
    setPlayerMaxHp(initMaxHp);
    setEnemies([]);
    setActiveEnemyId(null);
    setShieldActive(false);
    setSkillsCd({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    setFloatingNums([]);
    setLastKillReward(null);
    setPlayerLevel(INITIAL_PLAYER_LVL);
    setPlayerXp(0);
    setXpToNext(xpRequired(INITIAL_PLAYER_LVL));
    setPlayerGold(0);
    setPlayerBonusDmg(0);
    setLevelHpBonus(0);
    setStats({ ...INITIAL_STATS });
    setStatPoints(0);
    setEquipment({ ...EMPTY_EQUIPMENT });
    setInventory([]);
    setEquipBonuses({ ...ZERO_EQUIP_BONUSES });
    setCurrentLocation('city');
    setLootNotif(null);
    setShowInventory(false);
    setSelectedItem(null);
    setShowCharPanel(false);
    setLogs([{ id: Date.now(), msg: 'Тёмные подземелья ждут...' }]);
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const activeEnemy   = activeEnemyId !== null ? enemies.find(e => e.id === activeEnemyId) ?? null : null;
  const livingEnemies = enemies.filter(e => !e.dead);
  const xpPct         = Math.min(100, Math.round((playerXp / xpToNext) * 100));

  // Character panel + inventory derived stats (include equipment)
  const totalStr      = stats.strength + equipBonuses.strength;
  const totalAgi      = stats.agility  + equipBonuses.agility;
  const dmgMin        = 8  + playerBonusDmg + totalStr * 2 + equipBonuses.damage;
  const dmgMax        = 16 + playerBonusDmg + totalStr * 2 + equipBonuses.damage;
  const atkIntervalSec = (calcAttackInterval(totalAgi, equipBonuses.atkSpeedPenalty) / 1000).toFixed(1);

  // ── Camera / viewport ─────────────────────────────────────────────────────
  const camCol    = Math.max(0, Math.min(MAP_COLS - VP_COLS, playerPos.x - Math.floor(VP_COLS / 2)));
  const camRow    = Math.max(0, Math.min(MAP_ROWS - VP_ROWS, playerPos.y - Math.floor(VP_ROWS / 2)));
  const currentMap = LOCATION_MAPS[currentLocation];
  const currentNpcs = LOCATION_NPCS[currentLocation] ?? [];

  // ── Tile renderer ─────────────────────────────────────────────────────────
  const renderTileContent = (gx: number, gy: number, tileType: number) => {
    if (gx === playerPos.x && gy === playerPos.y)
      return <div className="w-full h-full tile-player rounded flex items-center justify-center text-lg z-10 relative">🧝</div>;
    const enemy = livingEnemies.find(e => e.x === gx && e.y === gy);
    if (enemy)
      return <div className={`w-full h-full rounded flex items-center justify-center text-lg z-10 relative ${enemy.id === activeEnemyId ? 'tile-enemy' : 'tile-enemy-idle'}`}>{enemy.emoji}</div>;
    const npc = currentNpcs.find(n => n.x === gx && n.y === gy);
    if (npc) return <div className="w-full h-full tile-npc flex items-center justify-center text-sm">{npc.emoji}</div>;
    if (tileType === 4) return <div className="w-full h-full tile-exit flex items-center justify-center text-sm">🚪</div>;
    if (tileType === 1) return <div className="w-full h-full tile-tree  flex items-center justify-center text-sm">🌲</div>;
    if (tileType === 2) return <div className="w-full h-full tile-rock  flex items-center justify-center text-sm">🪨</div>;
    if (tileType === 3) return <div className="w-full h-full tile-water flex items-center justify-center text-blue-400 text-xs font-bold tracking-tighter opacity-80">〰</div>;
    return <div className="w-full h-full tile-grass" />;
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] w-full max-w-[420px] mx-auto bg-background text-foreground flex flex-col relative select-none">

      {/* ══ 1. STATUS HEADER ══ */}
      <div className="shrink-0 border-b border-tile-border bg-[#111116]">

        {/* Row 1 — HP bars */}
        <div className="flex items-center px-4 pt-2 pb-1 justify-between">
          <div className="flex flex-col w-[45%]">
            <div className="flex justify-between items-end mb-1">
              <span className="text-sm font-bold text-white tracking-wide">
                Воин{shieldActive ? ' 🛡️' : ''}
                <span className="text-primary text-xs font-mono ml-1">Lv.{playerLevel}</span>
              </span>
              <span className="text-xs text-primary font-mono">{playerHp}/{playerMaxHp}</span>
            </div>
            <div className="h-[6px] w-full bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border">
              <div className="h-full bg-primary transition-all duration-300"
                style={{ width: `${Math.round((playerHp / playerMaxHp) * 100)}%` }} />
            </div>
          </div>

          <div className="text-sm font-bold text-[#444] text-center w-[10%]">VS</div>

          <div className="flex flex-col w-[45%]">
            {activeEnemy ? (
              <>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs text-destructive font-mono">{activeEnemy.hp}/{activeEnemy.maxHp}</span>
                  <span className="text-sm font-bold text-white tracking-wide">{activeEnemy.emoji} {activeEnemy.name}</span>
                </div>
                <div className="h-[6px] w-full bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border flex justify-end">
                  <div className="h-full bg-destructive transition-all duration-300"
                    style={{ width: `${Math.round((activeEnemy.hp / activeEnemy.maxHp) * 100)}%` }} />
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-end items-end mb-1">
                  {LOCATION_META[currentLocation].safe
                    ? <span className="text-xs text-green-700 font-mono">Безопасная зона</span>
                    : <span className="text-xs text-[#666] font-mono">Врагов: {livingEnemies.length} / {enemies.length}</span>
                  }
                </div>
                <div className="h-[6px] w-full bg-[#1a1a1f] rounded-full border border-tile-border" />
              </>
            )}
          </div>
        </div>

        {/* Row 1b — Location name */}
        <div className="flex items-center justify-center gap-2 pb-[2px]">
          <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest">
            {LOCATION_META[currentLocation].emoji} {LOCATION_META[currentLocation].label}
          </span>
          {LOCATION_META[currentLocation].safe && (
            <span className="text-[9px] text-green-800 font-bold">· Безопасная зона</span>
          )}
        </div>

        {/* Row 2 — XP bar + gold + panel buttons */}
        <div className="flex items-center px-4 pb-2 gap-2">
          <span className="text-[10px] text-[#555] font-bold uppercase tracking-wide shrink-0">Опыт</span>
          <div className="flex-1 h-[5px] bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border">
            <div className="h-full rounded-full transition-all duration-500 bg-[#3a8fc4]" style={{ width: `${xpPct}%` }} />
          </div>
          <span className="text-[10px] font-mono text-[#666] shrink-0">{playerXp}/{xpToNext}</span>
          <span className="text-[11px] font-bold text-yellow-400 shrink-0">💰{playerGold}</span>

          {/* Персонаж button */}
          <button
            onClick={() => { setShowCharPanel(v => !v); setShowInventory(false); setSelectedItem(null); }}
            className={`shrink-0 flex items-center gap-1 px-2 py-[3px] rounded border text-[11px] font-bold transition-colors
              ${showCharPanel ? 'bg-primary/20 border-primary text-primary' : 'bg-[#1e1e28] border-tile-border text-[#aaa]'}`}>
            {statPoints > 0 && (
              <span className="w-[14px] h-[14px] rounded-full bg-primary text-[#111] text-[9px] font-black flex items-center justify-center leading-none">{statPoints}</span>
            )}
            👤
          </button>

          {/* Инвентарь button */}
          <button
            onClick={() => { setShowInventory(v => !v); setShowCharPanel(false); setSelectedItem(null); }}
            className={`shrink-0 flex items-center gap-1 px-2 py-[3px] rounded border text-[11px] font-bold transition-colors
              ${showInventory ? 'bg-primary/20 border-primary text-primary' : 'bg-[#1e1e28] border-tile-border text-[#aaa]'}`}>
            {inventory.length > 0 && (
              <span className="w-[14px] h-[14px] rounded-full bg-[#3a3a50] text-white text-[9px] font-black flex items-center justify-center leading-none">{inventory.length}</span>
            )}
            🎒
          </button>
        </div>
      </div>

      {/* ══ 2. MAP ══ */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] p-2">
        <div className="relative" style={{ width: 'min(90vw, 360px)', height: 'min(90vw, 360px)' }}>

          {/* Tile grid — 10×10 viewport into 20×20 map */}
          <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 gap-[1px] bg-tile-border p-[1px] border border-tile-border rounded shadow-lg shadow-black/50 overflow-hidden">
            {Array.from({ length: VP_ROWS }, (_, vr) =>
              Array.from({ length: VP_COLS }, (_, vc) => {
                const gx = camCol + vc;
                const gy = camRow + vr;
                const tileType = currentMap[gy]?.[gx] ?? 1;
                return (
                  <div key={`${gx}-${gy}`} className="relative bg-map-bg">
                    {renderTileContent(gx, gy, tileType)}
                  </div>
                );
              })
            )}
          </div>

          {/* Map HP bars — camera-relative */}
          {phase === 'combat' && playerHp > 0 && (
            <div className="absolute pointer-events-none z-20 flex justify-center"
              style={{ top: `${((playerPos.y - camRow) / VP_ROWS) * 100}%`, left: `${((playerPos.x - camCol) / VP_COLS) * 100}%`, width: `${(1 / VP_COLS) * 100}%`, height: `${(1 / VP_ROWS) * 100}%`, marginTop: '-6px' }}>
              <div className="w-[80%] h-[4px] bg-[#1a1a1f] border border-black rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.round((playerHp / playerMaxHp) * 100)}%` }} />
              </div>
            </div>
          )}
          {phase === 'combat' && activeEnemy && activeEnemy.hp > 0 &&
            activeEnemy.x >= camCol && activeEnemy.x < camCol + VP_COLS &&
            activeEnemy.y >= camRow && activeEnemy.y < camRow + VP_ROWS && (
            <div className="absolute pointer-events-none z-20 flex justify-center"
              style={{ top: `${((activeEnemy.y - camRow) / VP_ROWS) * 100}%`, left: `${((activeEnemy.x - camCol) / VP_COLS) * 100}%`, width: `${(1 / VP_COLS) * 100}%`, height: `${(1 / VP_ROWS) * 100}%`, marginTop: '-6px' }}>
              <div className="w-[80%] h-[4px] bg-[#1a1a1f] border border-black rounded-full overflow-hidden">
                <div className="h-full bg-destructive" style={{ width: `${Math.round((activeEnemy.hp / activeEnemy.maxHp) * 100)}%` }} />
              </div>
            </div>
          )}

          {/* Floating numbers — camera-relative, only in viewport */}
          {floatingNums
            .filter(n => n.col >= camCol && n.col < camCol + VP_COLS && n.row >= camRow && n.row < camRow + VP_ROWS)
            .map(num => (
            <div key={num.id}
              className="absolute pointer-events-none z-30 font-bold text-base text-center animate-float w-[10%] h-[10%] flex items-center justify-center drop-shadow-md"
              style={{
                top: `${((num.row - camRow) / VP_ROWS) * 100}%`, left: `${((num.col - camCol) / VP_COLS) * 100}%`,
                color: num.type === 'player-dmg' ? 'hsl(var(--destructive))' : num.type === 'heal' ? 'hsl(var(--success))' : 'hsl(var(--primary))',
              }}>
              {num.value}
            </div>
          ))}

          {/* Transition overlay */}
          {transitioning && (
            <div className="absolute inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center gap-2 rounded">
              <span className="text-3xl animate-pulse">{LOCATION_META[currentLocation].emoji}</span>
              <p className="text-sm font-bold text-[#aaa] tracking-widest uppercase">Переход...</p>
            </div>
          )}

          {/* NPC dialog overlay */}
          {npcDialog && (
            <div className="absolute inset-0 z-[70] bg-black/80 flex flex-col items-center justify-center gap-3 rounded p-6">
              <p className="text-sm text-white text-center leading-relaxed">{npcDialog}</p>
              <button
                onClick={() => setNpcDialog(null)}
                className="px-4 py-1 rounded border border-primary text-primary text-sm font-bold">
                Закрыть
              </button>
            </div>
          )}

          {/* Loot notification toast */}
          {lootNotif && (
            <div className="absolute top-2 inset-x-2 z-[65] flex items-center gap-2 bg-[#0b1f0e]/95 border border-green-700/70 rounded px-3 py-2 shadow-lg pointer-events-none animate-in fade-in duration-200">
              <span className="text-base shrink-0">📦</span>
              <span className="text-[12px] font-bold text-green-300 leading-tight">Получен предмет: {lootNotif}</span>
            </div>
          )}

          {/* Per-kill victory flash */}
          {phase === 'victory' && (
            <div className="absolute inset-0 z-50 bg-black/75 flex flex-col items-center justify-center gap-1 rounded backdrop-blur-sm animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold text-primary drop-shadow-lg">⚔️ ПОБЕДА!</h2>
              <p className="text-white/70 text-sm">Враг повержен!</p>
              {lastKillReward && (
                <div className="mt-1 flex flex-col items-center gap-[2px]">
                  <span className="text-[13px] font-bold text-[#38bdf8]">+{lastKillReward.xp} опыта</span>
                  <span className="text-[13px] font-bold text-yellow-400">+{lastKillReward.gold} золота</span>
                  {lastKillReward.droppedItem && (
                    <span className={`text-[12px] font-bold mt-1 ${RARITY_STYLE[lastKillReward.droppedItem.rarity].text}`}>
                      📦 {lastKillReward.droppedItem.name}
                    </span>
                  )}
                </div>
              )}
              {lastKillReward?.leveledUp && (
                <div className="mt-2 px-3 py-1 bg-primary/20 border border-primary rounded-md text-center">
                  <p className="text-primary font-bold text-sm tracking-wide">НОВЫЙ УРОВЕНЬ!</p>
                  <p className="text-white text-xs">Уровень {lastKillReward.newLevel}{lastKillReward.statPtsGained > 0 && ` · +${lastKillReward.statPtsGained} очка`}</p>
                </div>
              )}
            </div>
          )}

          {/* Final victory */}
          {phase === 'final-victory' && (
            <div className="absolute inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded backdrop-blur-sm animate-in fade-in duration-500">
              <h2 className="text-3xl font-bold text-primary mb-2 drop-shadow-lg">🏆 ПОБЕДА!</h2>
              <p className="text-white/80 mb-1 font-medium">Все враги повержены!</p>
              <p className="text-[#666] text-sm mb-3">Уровень {playerLevel} · 💰 {playerGold}</p>
              {lastKillReward && (
                <div className="mb-4 flex gap-3 text-sm">
                  <span className="text-[#38bdf8] font-bold">+{lastKillReward.xp} опыта</span>
                  <span className="text-yellow-400 font-bold">+{lastKillReward.gold} золота</span>
                </div>
              )}
              <button onClick={resetCurrentMap}
                className="px-6 py-3 bg-[#1e1e28] border-2 border-primary text-primary font-bold rounded-lg shadow-[0_0_15px_rgba(200,150,42,0.3)] active:scale-95 transition-transform">
                Играть снова
              </button>
            </div>
          )}

          {/* Defeat */}
          {phase === 'defeat' && (
            <div className="absolute inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded backdrop-blur-sm animate-in fade-in duration-500">
              <h2 className="text-3xl font-bold text-destructive mb-2 drop-shadow-lg">☠️ ПОРАЖЕНИЕ</h2>
              <p className="text-white/80 mb-2 font-medium">Вы пали в бою...</p>
              <p className="text-[#666] text-sm mb-5">Уровень {playerLevel} · 💰 {playerGold}</p>
              <button onClick={resetCurrentMap}
                className="px-6 py-3 bg-[#1e1e28] border-2 border-primary text-primary font-bold rounded-lg shadow-[0_0_15px_rgba(200,150,42,0.3)] active:scale-95 transition-transform">
                Играть снова
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              CHARACTER PANEL OVERLAY  (z-60)
          ═══════════════════════════════════════════════════════ */}
          {showCharPanel && (
            <div className="absolute inset-0 z-[60] bg-[#0d0d0f]/95 flex flex-col rounded backdrop-blur-md">
              <div className="flex items-center justify-between px-4 py-3 border-b border-tile-border shrink-0">
                <h2 className="text-base font-bold text-primary tracking-wide">⚔️ Персонаж</h2>
                {statPoints > 0 && (
                  <span className="text-xs text-primary font-bold animate-pulse">
                    {statPoints} очко{statPoints === 1 ? '' : statPoints < 5 ? 'а' : 'в'} не потрачено
                  </span>
                )}
                <button onClick={() => setShowCharPanel(false)}
                  className="w-8 h-8 flex items-center justify-center rounded border border-tile-border text-[#888] hover:text-white hover:border-primary transition-colors text-sm font-bold">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1">
                <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
                  <span className="text-[13px] text-[#888]">Уровень</span>
                  <span className="text-[13px] font-bold text-primary font-mono">{playerLevel}</span>
                </div>

                <p className="text-[10px] uppercase tracking-widest text-[#444] pt-2 pb-1 font-bold">Характеристики</p>

                {/* Сила */}
                <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
                  <div className="flex flex-col">
                    <span className="text-[13px] text-white font-medium">Сила</span>
                    <span className="text-[10px] text-[#555]">+2 урона за очко{equipBonuses.strength > 0 ? ` (+${equipBonuses.strength} от брони)` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-white font-mono w-10 text-right">
                      {stats.strength}{equipBonuses.strength > 0 ? <span className="text-green-400 text-[11px]">+{equipBonuses.strength}</span> : ''}
                    </span>
                    <button disabled={statPoints === 0} onClick={() => spendStat('strength')}
                      className="w-7 h-7 rounded border text-sm font-black flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed enabled:border-primary enabled:text-primary enabled:bg-primary/10 enabled:hover:bg-primary/25 enabled:active:scale-90">+</button>
                  </div>
                </div>

                {/* Ловкость */}
                <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
                  <div className="flex flex-col">
                    <span className="text-[13px] text-white font-medium">Ловкость</span>
                    <span className="text-[10px] text-[#555]">–3% интервала атаки{equipBonuses.agility > 0 ? ` (+${equipBonuses.agility} от брони)` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-white font-mono w-10 text-right">
                      {stats.agility}{equipBonuses.agility > 0 ? <span className="text-green-400 text-[11px]">+{equipBonuses.agility}</span> : ''}
                    </span>
                    <button disabled={statPoints === 0} onClick={() => spendStat('agility')}
                      className="w-7 h-7 rounded border text-sm font-black flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed enabled:border-primary enabled:text-primary enabled:bg-primary/10 enabled:hover:bg-primary/25 enabled:active:scale-90">+</button>
                  </div>
                </div>

                {/* Выносливость */}
                <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
                  <div className="flex flex-col">
                    <span className="text-[13px] text-white font-medium">Выносливость</span>
                    <span className="text-[10px] text-[#555]">+10 макс. HP за очко</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-white font-mono w-10 text-right">{stats.endurance}</span>
                    <button disabled={statPoints === 0} onClick={() => spendStat('endurance')}
                      className="w-7 h-7 rounded border text-sm font-black flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed enabled:border-primary enabled:text-primary enabled:bg-primary/10 enabled:hover:bg-primary/25 enabled:active:scale-90">+</button>
                  </div>
                </div>

                <p className="text-[10px] uppercase tracking-widest text-[#444] pt-3 pb-1 font-bold">Боевые показатели</p>

                <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
                  <span className="text-[13px] text-[#888]">Урон</span>
                  <span className="text-[13px] font-bold text-white font-mono">{dmgMin}–{dmgMax}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
                  <span className="text-[13px] text-[#888]">Скорость атаки</span>
                  <span className="text-[13px] font-bold text-white font-mono">{atkIntervalSec}с{equipBonuses.atkSpeedPenalty > 0 ? <span className="text-destructive text-[10px] ml-1">−{equipBonuses.atkSpeedPenalty}%</span> : ''}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
                  <span className="text-[13px] text-[#888]">Максимальное HP</span>
                  <span className="text-[13px] font-bold text-white font-mono">{playerMaxHp}{equipBonuses.hp > 0 ? <span className="text-green-400 text-[10px] ml-1">+{equipBonuses.hp}</span> : ''}</span>
                </div>

                <div className={`flex items-center justify-between py-2 rounded px-2 mt-1 ${statPoints > 0 ? 'bg-primary/10 border border-primary/40' : ''}`}>
                  <span className={`text-[13px] font-medium ${statPoints > 0 ? 'text-primary' : 'text-[#888]'}`}>Свободные очки</span>
                  <span className={`text-[16px] font-black font-mono ${statPoints > 0 ? 'text-primary' : 'text-[#555]'}`}>{statPoints}</span>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              INVENTORY PANEL OVERLAY  (z-60)
          ═══════════════════════════════════════════════════════ */}
          {showInventory && (
            <div className="absolute inset-0 z-[60] bg-[#0d0d0f]/95 flex flex-col rounded backdrop-blur-md">

              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-tile-border shrink-0">
                <h2 className="text-base font-bold text-primary tracking-wide">🎒 Инвентарь</h2>
                <span className="text-[11px] text-[#555] font-mono">{inventory.length} предм.</span>
                <button onClick={() => { setShowInventory(false); setSelectedItem(null); }}
                  className="w-8 h-8 flex items-center justify-center rounded border border-tile-border text-[#888] hover:text-white hover:border-primary transition-colors text-sm font-bold">✕</button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">

                {/* ── Equipment slots — tappable to select/unequip ── */}
                <div className="px-3 pt-3 pb-2">
                  <p className="text-[10px] uppercase tracking-widest text-[#444] mb-2 font-bold">Экипировка</p>
                  <div className="flex flex-col gap-[6px]">
                    {(Object.entries(SLOT_META) as [keyof Equipment, { label: string; icon: string }][]).map(([slot, meta]) => {
                      const equipped = equipment[slot];
                      const rs = equipped ? RARITY_STYLE[equipped.rarity] : null;
                      const isSelected = equipped && selectedItem?.id === equipped.id;
                      return equipped ? (
                        <button key={slot}
                          onClick={() => setSelectedItem(isSelected ? null : equipped)}
                          className={`w-full flex items-center gap-2 p-2 rounded border text-left transition-all active:scale-[0.98]
                            ${isSelected
                              ? `${rs!.border} bg-[#1a1a2e] ${rs!.glow} ring-1 ring-inset ring-white/10`
                              : `${rs!.border} bg-[#141420] ${rs!.glow}`}`}>
                          <span className="text-base w-6 text-center shrink-0">{meta.icon}</span>
                          <span className="text-[11px] text-[#666] w-[54px] shrink-0">{meta.label}</span>
                          <div className="flex-1 min-w-0">
                            <span className={`text-[12px] font-bold ${rs!.text} truncate block`}>{equipped.name}</span>
                            <span className="text-[10px] text-[#555]">{formatBonuses(equipped.bonuses).join(' · ')}</span>
                          </div>
                          <span className="text-[10px] text-[#444] shrink-0">▸</span>
                        </button>
                      ) : (
                        <div key={slot} className="flex items-center gap-2 p-2 rounded border border-tile-border/30 bg-[#0f0f14]">
                          <span className="text-base w-6 text-center shrink-0 opacity-40">{meta.icon}</span>
                          <span className="text-[11px] text-[#666] w-[54px] shrink-0">{meta.label}</span>
                          <span className="text-[11px] text-[#383838] italic">— пусто —</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Inventory items grid ── */}
                <div className="px-3 pt-1 pb-20">
                  <p className="text-[10px] uppercase tracking-widest text-[#444] mb-2 font-bold">Предметы</p>
                  {inventory.length === 0 ? (
                    <p className="text-[12px] text-[#444] italic text-center py-4">Инвентарь пуст</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {inventory.map(item => {
                        const rs = RARITY_STYLE[item.rarity];
                        const isSelected = selectedItem?.id === item.id;
                        return (
                          <button key={item.id}
                            onClick={() => setSelectedItem(isSelected ? null : item)}
                            className={`text-left p-2 rounded border transition-all active:scale-95
                              ${isSelected
                                ? `${rs.border} bg-[#1a1a2e] ${rs.glow} ring-1 ring-inset ring-white/10`
                                : `${rs.border} bg-[#111118] hover:bg-[#161622] ${rs.glow}`}`}>
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className={`text-[12px] font-bold ${rs.text} leading-tight`}>{item.name}</span>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-[10px] text-[#555]">{TYPE_LABEL[item.type]}</span>
                              <span className="text-[#333]">·</span>
                              <span className={`text-[10px] font-medium ${rs.text}`}>{rs.label}</span>
                            </div>
                            <div className="flex flex-col gap-[1px]">
                              {formatBonuses(item.bonuses).map((line, i) => (
                                <span key={i} className="text-[11px] text-[#88c] font-mono">{line}</span>
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Selected item detail (bottom sheet) ── */}
              {selectedItem && (() => {
                const rs = RARITY_STYLE[selectedItem.rarity];
                const slot = selectedItem.type as keyof Equipment;
                const isEquipped = equipment[slot]?.id === selectedItem.id;
                return (
                  <div className={`absolute bottom-0 inset-x-0 z-10 border-t-2 ${rs.border} ${rs.glow} ${rs.bg} rounded-b p-4 animate-in slide-in-from-bottom duration-200`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={`text-[15px] font-bold ${rs.text}`}>{selectedItem.name}</h3>
                        <p className="text-[11px] text-[#666]">
                          {TYPE_LABEL[selectedItem.type]} · {rs.label}
                          {isEquipped && <span className="ml-2 text-primary font-bold">· Надето</span>}
                        </p>
                      </div>
                      <button onClick={() => setSelectedItem(null)}
                        className="text-[#666] hover:text-white text-lg leading-none px-1">✕</button>
                    </div>
                    <div className="flex flex-col gap-[3px] mb-3">
                      {formatBonuses(selectedItem.bonuses).map((line, i) => (
                        <span key={i} className="text-[13px] text-white font-mono">• {line}</span>
                      ))}
                    </div>
                    {isEquipped ? (
                      <button
                        onClick={() => unequipItem(slot)}
                        className="w-full py-2 rounded border-2 border-[#555] text-[#aaa] font-bold text-[13px] bg-[#111118] active:scale-95 transition-transform">
                        📤 Снять
                      </button>
                    ) : (
                      <button
                        onClick={() => equipItem(selectedItem)}
                        className={`w-full py-2 rounded border-2 ${rs.border} ${rs.text} font-bold text-[13px] bg-[#111118] active:scale-95 transition-transform ${rs.glow}`}>
                        ⚔️ Надеть
                      </button>
                    )}
                  </div>
                );
              })()}

            </div>
          )}

        </div>
      </div>

      {/* ══ 3. D-PAD ══ */}
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

      {/* ══ 4. SKILL BAR ══ */}
      <div className="h-[80px] shrink-0 bg-[#111116] border-t border-tile-border p-2 flex justify-center gap-2 overflow-x-auto">
        {SKILLS.map(skill => {
          const cd = skillsCd[skill.id] || 0;
          const isOnCd = cd > 0;
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

      {/* ══ 5. COMBAT LOG ══ */}
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
