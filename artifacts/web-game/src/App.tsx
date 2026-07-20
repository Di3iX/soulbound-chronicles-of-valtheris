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
  xpRequired, makeLocationEnemies,
} from './combat';
import {
  BaseStats, ComputedStats, INITIAL_BASE_STATS, INITIAL_HP,
  computeStats, StatsInput,
} from './stats';
import {
  MAP_COLS, MAP_ROWS, VP_COLS, VP_ROWS,
  LOCATION_META, LOCATION_SPAWN, LOCATION_EXITS, LOCATION_MAPS, LOCATION_NPCS,
  getLocation, moveToLocation, getAvailableExits, isConnected,
} from './world/locations';
import { QuestProgress, QUEST_DEFS, getQuestEntry } from './quests/quests';
import { NpcDialogue, DialogAction, getNpcDialogue } from './quests/npc';
import { SHOP_BUY_PRICE, sellPrice, CONSUMABLE_HEAL } from './shop/shop';
import ShopPanel from './shop/ShopPanel';
import { ALL_SKILLS_MAP, SKILL_POINTS_PER_LEVEL } from './skills/skills';
import { SkillProgress, SkillBonuses, calcSkillBonuses } from './skills/skillTree';
import SkillPanel from './skills/SkillPanel';
import {
  BOSS_ID, CAVE_BOSS_DEF, BOSS_REWARD, BOSS_RARE_CHANCE, BOSS_RARE_LOOT, BOSS_COMMON_LOOT,
  BossState, BossRewardInfo, INITIAL_BOSS_STATE, makeBossTrophy,
} from './boss/boss';
import BossVictoryPanel from './boss/BossVictoryPanel';

const INITIAL_PLAYER_LVL = 1;

// ─── TYPES ────────────────────────────────────────────────────────────────────
// BaseStats (strength / agility / vitality / intelligence) lives in ./stats
import { FloatingNum, LogEntry } from './types/ui';

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function App() {

  // ── Load saved game exactly once on mount ──────────────────────────────────
  const [sv] = useState<SaveData | null>(() => loadGame());

  // ── Core state ─────────────────────────────────────────────────────────────
  const [phase, setPhase]                 = useState<Phase>('explore');
  const [playerPos, setPlayerPos]         = useState(sv?.playerPos        ?? LOCATION_SPAWN.village);
  const [playerHp, setPlayerHp]           = useState(sv?.playerHp         ?? (INITIAL_HP + INITIAL_BASE_STATS.vitality * 10));
  const [playerMaxHp, setPlayerMaxHp]     = useState(sv?.playerMaxHp      ?? (INITIAL_HP + INITIAL_BASE_STATS.vitality * 10));
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
  const [stats, setStats]               = useState<BaseStats>(sv?.stats      ?? { ...INITIAL_BASE_STATS });
  const [statPoints, setStatPoints]     = useState(sv?.statPoints            ?? 0);
  const [showCharPanel, setShowCharPanel] = useState(false);

  // ── Inventory / equipment state ────────────────────────────────────────────
  const [equipment, setEquipment]         = useState<Equipment>(sv?.equipment       ?? { ...EMPTY_EQUIPMENT });
  const [inventory, setInventory]         = useState<Item[]>(sv?.inventory           ?? []);
  const [equipBonuses, setEquipBonuses]   = useState<EquipBonuses>(sv?.equipBonuses ?? { ...ZERO_EQUIP_BONUSES });
  const [showInventory, setShowInventory] = useState(false);
  const [selectedItem, setSelectedItem]   = useState<Item | null>(null);
  const [lootNotif, setLootNotif]         = useState<string | null>(null);
  const [showWorldMap, setShowWorldMap]   = useState(false);

  // ── World map state ─────────────────────────────────────────────────────────
  const [currentLocation, setCurrentLocation] = useState<LocationId>(sv?.currentLocation ?? 'village');
  const [transitioning, setTransitioning]     = useState(false);
  const [npcDialog, setNpcDialog]             = useState<string | null>(null);
  const [questProgress, setQuestProgress]     = useState<QuestProgress>(sv?.questProgress ?? {});
  const [questDialogue, setQuestDialogue]     = useState<NpcDialogue | null>(null);
  const [showQuestPanel, setShowQuestPanel]   = useState(false);
  const [showShop, setShowShop]               = useState(false);
  const [skillProgress, setSkillProgress]     = useState<SkillProgress>(sv?.skillProgress ?? {});
  const [skillPoints, setSkillPoints]         = useState(sv?.skillPoints ?? 0);
  const [showSkillPanel, setShowSkillPanel]   = useState(false);
  const [bossState, setBossState]             = useState<BossState>(sv?.bossState ?? INITIAL_BOSS_STATE);
  const [bossSpawnedThisVisit, setBossSpawnedThisVisit]   = useState<boolean>(() => (sv?.enemies ?? []).some(e => e.id === BOSS_ID));
  const [bossDefeatedThisVisit, setBossDefeatedThisVisit] = useState<boolean>(() => (sv?.enemies ?? []).find(e => e.id === BOSS_ID)?.dead === true);
  const [bossAppearNotif, setBossAppearNotif] = useState(false);
  const [showBossVictory, setShowBossVictory] = useState(false);
  const [bossRewardInfo, setBossRewardInfo]   = useState<BossRewardInfo | null>(null);

  // ── Refs (initialised from save so callbacks see correct values immediately) ─
  const playerHpRef        = useRef(sv?.playerHp    ?? (INITIAL_HP + INITIAL_BASE_STATS.vitality * 10));
  const playerMaxHpRef     = useRef(sv?.playerMaxHp ?? (INITIAL_HP + INITIAL_BASE_STATS.vitality * 10));
  const shieldRef          = useRef(false);
  const phaseRef           = useRef<Phase>('explore');
  const playerPosRef       = useRef(sv?.playerPos         ?? LOCATION_SPAWN.village);
  const enemiesRef         = useRef<Enemy[]>(sv?.enemies  ?? []);
  const activeEnemyIdRef   = useRef<number | null>(null);
  const statsRef           = useRef<BaseStats>(sv?.stats  ?? { ...INITIAL_BASE_STATS });
  const playerBonusDmgRef  = useRef(sv?.playerBonusDmg   ?? 0);
  const levelHpBonusRef    = useRef(sv?.levelHpBonus      ?? 0);
  const playerLevelRef     = useRef(sv?.playerLevel       ?? INITIAL_PLAYER_LVL);
  const playerXpRef        = useRef(sv?.playerXp          ?? 0);
  const playerGoldRef      = useRef(sv?.playerGold        ?? 0);
  const statPointsRef      = useRef(sv?.statPoints        ?? 0);
  const equipmentRef       = useRef<Equipment>(sv?.equipment        ?? { ...EMPTY_EQUIPMENT });
  const equipBonusesRef    = useRef<EquipBonuses>(sv?.equipBonuses  ?? { ...ZERO_EQUIP_BONUSES });
  const currentLocationRef = useRef<LocationId>(sv?.currentLocation ?? 'village');
  const transitioningRef   = useRef(false);
  // These two have no paired state→ref sync in callbacks, so we track them explicitly:
  const inventoryRef       = useRef<Item[]>(sv?.inventory        ?? []);
  const xpToNextRef        = useRef(sv?.xpToNext                 ?? xpRequired(INITIAL_PLAYER_LVL));
  const questProgressRef   = useRef<QuestProgress>(sv?.questProgress ?? {});
  const skillProgressRef   = useRef<SkillProgress>(sv?.skillProgress ?? {});
  const skillPointsRef     = useRef(sv?.skillPoints ?? 0);
  const skillBonusesRef    = useRef<SkillBonuses>(calcSkillBonuses(sv?.skillProgress ?? {}));
  const bossStateRef              = useRef<BossState>(sv?.bossState ?? INITIAL_BOSS_STATE);
  const bossSpawnedThisVisitRef   = useRef<boolean>((sv?.enemies ?? []).some(e => e.id === BOSS_ID));
  const bossDefeatedThisVisitRef  = useRef<boolean>((sv?.enemies ?? []).find(e => e.id === BOSS_ID)?.dead === true);
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
  useEffect(() => { questProgressRef.current   = questProgress; }, [questProgress]);
  useEffect(() => { skillProgressRef.current   = skillProgress; }, [skillProgress]);
  useEffect(() => { skillPointsRef.current     = skillPoints;   }, [skillPoints]);
  useEffect(() => { skillBonusesRef.current    = calcSkillBonuses(skillProgress); }, [skillProgress]);
  useEffect(() => { bossStateRef.current              = bossState;            }, [bossState]);
  useEffect(() => { bossSpawnedThisVisitRef.current   = bossSpawnedThisVisit; }, [bossSpawnedThisVisit]);
  useEffect(() => { bossDefeatedThisVisitRef.current  = bossDefeatedThisVisit;}, [bossDefeatedThisVisit]);

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
      questProgress,
      skillProgress, skillPoints,
      bossState,
    });
  }, [playerLevel, playerXp, xpToNext, playerGold, playerBonusDmg, levelHpBonus,
      playerHp, playerMaxHp, stats, statPoints, inventory, equipment, equipBonuses,
      playerPos, currentLocation, enemies, questProgress, skillProgress, skillPoints]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
const log = useCallback((msg: string) => {
  log(setLogs, msg);
}, [setLogs]);

  const spawnFloat = useCallback((value: string, col: number, row: number, type: FloatingNum['type']) => {
    setFloatingNums(prev => [...prev, { id: Date.now() + Math.random(), value, col, row, type, timestamp: Date.now() }]);
  }, []);

  // ── Stat spending ──────────────────────────────────────────────────────────
  const spendStat = useCallback((stat: keyof BaseStats) => {
    if (statPointsRef.current <= 0) return;
    const newStats = { ...statsRef.current, [stat]: statsRef.current[stat] + 1 };
    statsRef.current = newStats;
    setStats(newStats);
    statPointsRef.current -= 1;
    setStatPoints(p => p - 1);
    if (stat === 'vitality') {
      const newMaxHp = computeStats({
        base: newStats, levelHpBonus: levelHpBonusRef.current,
        bonusDmg: playerBonusDmgRef.current, equip: equipBonusesRef.current,
        skills: skillBonusesRef.current,
      }).maxHp;
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

    // Recalc max HP via central stats module
    const newMaxHp = computeStats({
      base: statsRef.current, levelHpBonus: levelHpBonusRef.current,
      bonusDmg: playerBonusDmgRef.current, equip: newBonuses,
      skills: skillBonusesRef.current,
    }).maxHp;
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
    log(`🗡️ Экипировано: ${item.name}`);
  }, [log]);

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

    // Recalc max HP via central stats module
    const newMaxHp = computeStats({
      base: statsRef.current, levelHpBonus: levelHpBonusRef.current,
      bonusDmg: playerBonusDmgRef.current, equip: newBonuses,
      skills: skillBonusesRef.current,
    }).maxHp;
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
    log(`📤 Снято: ${item.name}`);
  }, [log]);

  // ── Loot drop (called from applyRewards) ──────────────────────────────────
  const rollLoot = useCallback((enemyName: string): Item | undefined => {
    const table = DROP_TABLES[enemyName];
    if (!table || Math.random() >= table.chance) return undefined;
    const key = table.pool[Math.floor(Math.random() * table.pool.length)];
    const item = makeItem(key);
    setInventory(prev => [...prev, item]);
    setLootNotif(item.name);
    log(`📦 Получен лут: ${item.name}!`);
    setTimeout(() => setLootNotif(null), 2500);
    return item;
  }, [log]);

  // ── Progression ───────────────────────────────────────────────────────────
  const applyRewards = useCallback((enemyName: string): KillReward => {
    const reward = REWARD_TABLE[enemyName] ?? { xp: 10, goldMin: 1, goldMax: 3 };

    const goldGained = Math.floor(Math.random() * (reward.goldMax - reward.goldMin + 1)) + reward.goldMin;
    playerGoldRef.current += goldGained;
    setPlayerGold(playerGoldRef.current);
    log(`💰 Получено ${goldGained} золота!`);

    const xpGained = Math.floor(reward.xp * (1 + skillBonusesRef.current.xpBonusPct / 100));
    log(`✨ Получено ${xpGained} опыта!`);

    let newXp = playerXpRef.current + xpGained;
    let newLevel = playerLevelRef.current;
    let newBonusDmg = playerBonusDmgRef.current;
    let hpBonusDelta = 0, newStatPts = 0, newSkillPts = 0;
    let leveledUp = false;
    let needed = xpRequired(newLevel);

    while (newXp >= needed) {
      newXp -= needed; newLevel++; newBonusDmg += 2; hpBonusDelta += 20; newStatPts += STAT_POINTS_PER_LEVEL; newSkillPts += SKILL_POINTS_PER_LEVEL; needed = xpRequired(newLevel); leveledUp = true;
    }

    const newLevelHpBonus = levelHpBonusRef.current + hpBonusDelta;
    const newMaxHp = computeStats({
      base: statsRef.current, levelHpBonus: newLevelHpBonus,
      bonusDmg: newBonusDmg, equip: equipBonusesRef.current,
      skills: skillBonusesRef.current,
    }).maxHp;

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
      log(`🎯 +${newStatPts} очка характеристик!`);
    }
    if (newSkillPts > 0) {
      skillPointsRef.current += newSkillPts;
      setSkillPoints(p => p + newSkillPts);
      log(`⭐ +${newSkillPts} очко умений!`);
    }
    if (leveledUp) {
      playerHpRef.current = newMaxHp; setPlayerHp(newMaxHp);
      log(`🌟 Новый уровень ${newLevel}! HP восстановлено!`);
    }

    const droppedItem = rollLoot(enemyName);
    return { xp: xpGained, gold: goldGained, leveledUp, newLevel, statPtsGained: newStatPts, droppedItem };
  }, [log, rollLoot]);

  // ── Cave Boss: spawn after all normal enemies die ─────────────────────────
  const spawnCaveBoss = useCallback(() => {
    const bossEnemy: Enemy = { ...CAVE_BOSS_DEF, id: BOSS_ID };
    bossSpawnedThisVisitRef.current = true;
    setBossSpawnedThisVisit(true);
    enemiesRef.current = [...enemiesRef.current, bossEnemy];
    setEnemies(prev => [...prev, bossEnemy]);
    phaseRef.current = 'explore';
    setPhase('explore');
    setActiveEnemyId(null);
    activeEnemyIdRef.current = null;
    setBossAppearNotif(true);
    setTimeout(() => setBossAppearNotif(false), 3500);
    log('⚔️ Появился Босс: Главарь гоблинов!');
  }, [log]);

  // ── Cave Boss: handle kill + rewards ──────────────────────────────────────
  const handleBossDeath = useCallback(() => {
    // Enemy already marked dead + player position already set by handleEnemyDeath
    log('👑 Главарь гоблинов повержен!');

    // Gold
    playerGoldRef.current += BOSS_REWARD.gold;
    setPlayerGold(playerGoldRef.current);
    log(`💰 Получено ${BOSS_REWARD.gold} золота!`);

    // XP with Wisdom bonus
    const xpGained = Math.floor(BOSS_REWARD.xp * (1 + skillBonusesRef.current.xpBonusPct / 100));
    log(`✨ Получено ${xpGained} опыта!`);

    // Level-up logic (mirrors applyRewards)
    let newXp       = playerXpRef.current + xpGained;
    let newLevel    = playerLevelRef.current;
    let newBonusDmg = playerBonusDmgRef.current;
    let hpDelta     = 0, newStatPts = 0, newSkillPts = 0, leveledUp = false;
    let needed      = xpRequired(newLevel);
    while (newXp >= needed) {
      newXp -= needed; newLevel++; newBonusDmg += 2; hpDelta += 20;
      newStatPts += STAT_POINTS_PER_LEVEL; newSkillPts += SKILL_POINTS_PER_LEVEL;
      needed = xpRequired(newLevel); leveledUp = true;
    }
    const newLvHpBonus = levelHpBonusRef.current + hpDelta;
    const newMaxHp = computeStats({
      base: statsRef.current, levelHpBonus: newLvHpBonus,
      bonusDmg: newBonusDmg, equip: equipBonusesRef.current,
      skills: skillBonusesRef.current,
    }).maxHp;
    playerLevelRef.current  = newLevel;  playerBonusDmgRef.current = newBonusDmg;
    levelHpBonusRef.current = newLvHpBonus; playerMaxHpRef.current = newMaxHp;
    playerXpRef.current     = newXp;
    setPlayerXp(newXp); setXpToNext(needed); setPlayerLevel(newLevel);
    setPlayerBonusDmg(newBonusDmg); setLevelHpBonus(newLvHpBonus); setPlayerMaxHp(newMaxHp);
    if (newStatPts > 0) { statPointsRef.current += newStatPts; setStatPoints(p => p + newStatPts); log(`🎯 +${newStatPts} очка характеристик!`); }
    if (newSkillPts > 0) { skillPointsRef.current += newSkillPts; setSkillPoints(p => p + newSkillPts); log(`⭐ +${newSkillPts} очко умений!`); }
    if (leveledUp) { playerHpRef.current = newMaxHp; setPlayerHp(newMaxHp); log(`🌟 Новый уровень ${newLevel}! HP восстановлено!`); }

    // Guaranteed item drop (25% rare, 75% common/uncommon pool)
    const isRare    = Math.random() < BOSS_RARE_CHANCE;
    const dropPool  = isRare ? [...BOSS_RARE_LOOT] : [...BOSS_COMMON_LOOT];
    const dropKey   = dropPool[Math.floor(Math.random() * dropPool.length)];
    const dropItem  = makeItem(dropKey);
    inventoryRef.current = [...inventoryRef.current, dropItem];
    setInventory(prev => [...prev, dropItem]);
    setLootNotif(dropItem.name);
    setTimeout(() => setLootNotif(null), 2500);
    log(`📦 Получен лут: ${dropItem.name}!`);

    // Trophy — first kill only
    const wasFirstKill = !bossStateRef.current.caveChief.firstKillDone;
    let trophyItem: Item | undefined;
    if (wasFirstKill) {
      trophyItem = makeBossTrophy();
      inventoryRef.current = [...inventoryRef.current, trophyItem];
      setInventory(prev => [...prev, trophyItem!]);
      log('🏆 Получен трофей: Трофей главаря гоблинов!');
      const newBS: BossState = { caveChief: { firstKillDone: true } };
      bossStateRef.current = newBS;
      setBossState(newBS);
      log('🏛️ Руины разблокированы! Путь на восток открыт.');
    }

    // Flags
    bossDefeatedThisVisitRef.current = true;
    setBossDefeatedThisVisit(true);

    // Show boss victory overlay
    phaseRef.current = 'final-victory';
    setPhase('final-victory');
    setActiveEnemyId(null);
    activeEnemyIdRef.current = null;
    setBossRewardInfo({ xp: xpGained, gold: BOSS_REWARD.gold, dropItem, trophyItem, leveledUp, newLevel, wasFirstKill });
    setShowBossVictory(true);
  }, [log]);

  // ── Enemy death ──────────────────────────────────────────────────────────
  const handleEnemyDeath = useCallback((id: number, ex: number, ey: number, name: string) => {
    phaseRef.current = 'victory';
    if (playerAttackTimeout.current) { clearTimeout(playerAttackTimeout.current); playerAttackTimeout.current = null; }
    if (enemyAttackTimeout.current)  { clearTimeout(enemyAttackTimeout.current);  enemyAttackTimeout.current  = null; }

    enemiesRef.current = enemiesRef.current.map(e => e.id === id ? { ...e, dead: true, hp: 0 } : e);
    setEnemies(prev => prev.map(e => e.id === id ? { ...e, dead: true, hp: 0 } : e));
    playerPosRef.current = { x: ex, y: ey };
    setPlayerPos({ x: ex, y: ey });
    log(`💀 ${name} повержен!`);

    // Boss intercept — rewards and victory handled separately
    if (id === BOSS_ID) { handleBossDeath(); return; }

    const reward = applyRewards(name);
    setLastKillReward(reward);

    // ── Quest: track goblin kills ────────────────────────────────────────────
    if (name === 'Гоблин') {
      const qid   = 'quest_goblin_001';
      const def   = QUEST_DEFS[qid];
      const entry = questProgressRef.current[qid] ?? { status: 'inactive' as const, current: 0 };
      if (entry.status === 'active' && entry.current < def.objective.required) {
        const newCurrent = entry.current + 1;
        const updated: QuestProgress = {
          ...questProgressRef.current,
          [qid]: { status: 'active' as const, current: newCurrent },
        };
        questProgressRef.current = updated;
        setQuestProgress(updated);
        log(`📜 Гоблины: ${newCurrent} / ${def.objective.required}`);
        if (newCurrent >= def.objective.required)
          log('✅ Цель выполнена! Вернитесь к Старейшине.');
      }
    }

    const allDead = enemiesRef.current.every(e => e.dead);
    if (allDead) {
      // Cave: spawn the boss after all normal enemies die (once per visit)
      if (currentLocationRef.current === 'cave' && !bossSpawnedThisVisitRef.current) {
        spawnCaveBoss();
      } else {
        phaseRef.current = 'final-victory'; setPhase('final-victory');
        setActiveEnemyId(null); activeEnemyIdRef.current = null;
        log('🏆 Все враги побеждены!');
      }
    } else {
      setPhase('victory');
      setTimeout(() => {
        if (phaseRef.current === 'victory') {
          phaseRef.current = 'explore'; setPhase('explore');
          setActiveEnemyId(null); activeEnemyIdRef.current = null;
        }
      }, 1500);
    }
  }, [log, applyRewards, handleBossDeath, spawnCaveBoss]);

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
      log(`📍 Вы прибыли: ${LOCATION_META[to].label}`);
      // Cave: reset boss visit flags on (re-)entry so the boss can spawn again