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
      if (to === 'cave') {
        bossSpawnedThisVisitRef.current = false;
        setBossSpawnedThisVisit(false);
        bossDefeatedThisVisitRef.current = false;
        setBossDefeatedThisVisit(false);
      }
      // Restore full HP when entering a safe zone
      if (getLocation(to).isSafeZone) {
        const fullHp = playerMaxHpRef.current;
        playerHpRef.current = fullHp;
        setPlayerHp(fullHp);
        log('💚 Добро пожаловать! HP полностью восстановлено.');
      }
    }, 800);
  }, [log]);

  // ── Movement ─────────────────────────────────────────────────────────────
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (phaseRef.current !== 'explore') return;
    if (transitioningRef.current) return;
    const { x, y } = playerPosRef.current;
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= MAP_COLS || ny >= MAP_ROWS) { log('Путь заблокирован!'); return; }
    const currentMap = LOCATION_MAPS[currentLocationRef.current];
    const tileType = currentMap[ny]?.[nx] ?? 1;
    // NPC intercept
    const npc = (LOCATION_NPCS[currentLocationRef.current] ?? []).find(n => n.x === nx && n.y === ny);
    if (npc) {
      const dlg = getNpcDialogue(npc.id, questProgressRef.current);
      if (dlg) { setQuestDialogue(dlg); }
      else { setNpcDialog(`${npc.emoji} ${npc.name}: «Скоро здесь будут квесты и торговля! Следите за обновлениями.»`); }
      return;
    }
    // Enemy intercept
    const hitEnemy = enemiesRef.current.find(e => !e.dead && e.x === nx && e.y === ny);
    if (hitEnemy) {
      phaseRef.current = 'combat'; activeEnemyIdRef.current = hitEnemy.id;
      setActiveEnemyId(hitEnemy.id); setPhase('combat');
      log(`⚔️ Бой с ${hitEnemy.name}!`); return;
    }
    // Exit tile intercept
    if (tileType === 4) {
      const exits = LOCATION_EXITS[currentLocationRef.current];
      const exit = exits?.get(`${nx},${ny}`);
      if (exit) {
        // Block Cave → Ruins until Goblin Chief has been defeated for the first time
        if (currentLocationRef.current === 'cave' && exit.to === 'ruins' && !bossStateRef.current.caveChief.firstKillDone) {
          log('⚠️ Путь заблокирован! Победите Главаря гоблинов, чтобы пройти в Руины.');
          return;
        }
        handleLocationTransition(exit.to, exit.spawnAt);
        return;
      }
    }
    if (tileType !== 0) { log('Путь заблокирован!'); return; }
    playerPosRef.current = { x: nx, y: ny }; setPlayerPos({ x: nx, y: ny });
  }, [log, handleLocationTransition]);

  // ── Combat ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'combat') return;

    const doPlayerAttack = () => {
      if (phaseRef.current !== 'combat') return;
      const id = activeEnemyIdRef.current;
      if (id === null) return;
      const enemy = enemiesRef.current.find(e => e.id === id);
      if (!enemy || enemy.dead || enemy.hp <= 0) return;

      // Compute all character stats from central module (pure, cheap)
      const _cs = computeStats({
        base: statsRef.current, levelHpBonus: levelHpBonusRef.current,
        bonusDmg: playerBonusDmgRef.current, equip: equipBonusesRef.current,
        skills: skillBonusesRef.current,
      });
      let dmg = Math.floor(Math.random() * (_cs.dmgMax - _cs.dmgMin + 1)) + _cs.dmgMin;
      const isCrit = Math.random() * 100 < _cs.critChance;
      if (isCrit) dmg = Math.floor(dmg * _cs.critDamageMult);
      const newHp = Math.max(0, enemy.hp - dmg);

      enemiesRef.current = enemiesRef.current.map(e => e.id === id ? { ...e, hp: newHp } : e);
      setEnemies(prev => prev.map(e => e.id === id ? { ...e, hp: newHp } : e));
      spawnFloat(isCrit ? `💥${dmg}` : dmg.toString(), enemy.x, enemy.y, 'enemy-dmg');
      log(`${isCrit ? '💥 Крит! ' : ''}⚔️ Воин наносит ${dmg} урона!`);

      if (newHp === 0) { handleEnemyDeath(id, enemy.x, enemy.y, enemy.name); return; }

      if (phaseRef.current === 'combat') {
        const _atkCs = computeStats({
          base: statsRef.current, levelHpBonus: levelHpBonusRef.current,
          bonusDmg: playerBonusDmgRef.current, equip: equipBonusesRef.current,
          skills: skillBonusesRef.current,
        });
        playerAttackTimeout.current = setTimeout(doPlayerAttack, _atkCs.attackInterval);
      }
    };

    const _firstCs = computeStats({
      base: statsRef.current, levelHpBonus: levelHpBonusRef.current,
      bonusDmg: playerBonusDmgRef.current, equip: equipBonusesRef.current,
      skills: skillBonusesRef.current,
    });
    playerAttackTimeout.current = setTimeout(doPlayerAttack, _firstCs.attackInterval);

    const doEnemyAttack = () => {
      if (phaseRef.current !== 'combat') return;
      const id = activeEnemyIdRef.current;
      const enemy = enemiesRef.current.find(e => e.id === id);
      if (!enemy || enemy.dead || enemy.hp <= 0) return;

      // Compute defensive stats
      const _defCs = computeStats({
        base: statsRef.current, levelHpBonus: levelHpBonusRef.current,
        bonusDmg: playerBonusDmgRef.current, equip: equipBonusesRef.current,
        skills: skillBonusesRef.current,
      });
      const pp = playerPosRef.current;

      // Dodge check
      if (Math.random() * 100 < _defCs.dodgeChance) {
        spawnFloat('УКЛОН', pp.x, pp.y, 'heal');
        log(`💨 Вы уклонились от атаки ${enemy.name}!`);
        if (phaseRef.current === 'combat')
          enemyAttackTimeout.current = setTimeout(doEnemyAttack, enemy.attackInterval);
        return;
      }

      let dmg = Math.floor(Math.random() * (enemy.dmgMax - enemy.dmgMin + 1)) + enemy.dmgMin;
      if (shieldRef.current) dmg = Math.ceil(dmg / 2);
      // Defense mitigation: dmg × 100/(100+defense)
      if (_defCs.defense > 0) dmg = Math.max(1, Math.floor(dmg * 100 / (100 + _defCs.defense)));

      spawnFloat(dmg.toString(), pp.x, pp.y, 'player-dmg');
      log(`${enemy.emoji} ${enemy.name} атакует на ${dmg} урона!`);

      const prevHp = playerHpRef.current;
      const newHp  = Math.max(0, prevHp - dmg);
      playerHpRef.current = newHp; setPlayerHp(newHp);

      if (prevHp > 0 && newHp === 0) {
        phaseRef.current = 'defeat'; setPhase('defeat');
        log('☠️ Вы погибли...'); return;
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
  }, [phase, log, spawnFloat, handleEnemyDeath]);

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
      log(`✨ Воин использует ${skill.name} на ${skill.damage} урона!`);
      if (newHp === 0) handleEnemyDeath(id, enemy.x, enemy.y, enemy.name);
    }
    if (skill.healSelf > 0) {
      const pp = playerPosRef.current;
      const newHp = Math.min(playerMaxHpRef.current, playerHpRef.current + skill.healSelf);
      playerHpRef.current = newHp; setPlayerHp(newHp);
      spawnFloat(`+${skill.healSelf}`, pp.x, pp.y, 'heal');
      log(`💚 Воин лечится на ${skill.healSelf} HP!`);
    }
    if (skill.id === 5) {
      setShieldActive(true); shieldRef.current = true;
      log('🛡️ Щит активирован!');
      setTimeout(() => { setShieldActive(false); shieldRef.current = false; log('🛡️ Действие щита закончилось.'); }, 5000);
    }
  }, [skillsCd, log, spawnFloat, handleEnemyDeath]);

  // ── World map travel ──────────────────────────────────────────────────────
  const handleWorldMapTravel = useCallback((to: LocationId) => {
    if (phaseRef.current !== 'explore') return;
    if (transitioningRef.current) return;
    setShowWorldMap(false);
    handleLocationTransition(to, LOCATION_SPAWN[to]);
  }, [handleLocationTransition]);

  // ── Quest action handler ──────────────────────────────────────────────────
  const handleQuestAction = useCallback((action: DialogAction) => {
    if (action.kind === 'dismiss') { setQuestDialogue(null); return; }

    if (action.kind === 'accept_quest') {
      const updated: QuestProgress = {
        ...questProgressRef.current,
        [action.questId]: { status: 'active' as const, current: 0 },
      };
      questProgressRef.current = updated;
      setQuestProgress(updated);
      log(`📜 Задание принято: ${QUEST_DEFS[action.questId]?.title ?? action.questId}`);
      setQuestDialogue(null);
      return;
    }

    if (action.kind === 'complete_quest') {
      const def = QUEST_DEFS[action.questId];
      if (!def) { setQuestDialogue(null); return; }

      // ── Gold reward ────────────────────────────────────────────────────────
      playerGoldRef.current += def.reward.gold;
      setPlayerGold(playerGoldRef.current);
      log(`💰 Награда: ${def.reward.gold} золота!`);

      // ── XP reward with level-up logic ──────────────────────────────────────
      const _questXp = Math.floor(def.reward.xp * (1 + skillBonusesRef.current.xpBonusPct / 100));
      let newXp     = playerXpRef.current + _questXp;
      let newLevel  = playerLevelRef.current;
      let newBonusDmg = playerBonusDmgRef.current;
      let hpDelta = 0, newStatPts = 0, newSkillPts = 0, leveledUp = false;
      let needed    = xpRequired(newLevel);
      while (newXp >= needed) {
        newXp -= needed; newLevel++; newBonusDmg += 2; hpDelta += 20;
        newStatPts += STAT_POINTS_PER_LEVEL; newSkillPts += SKILL_POINTS_PER_LEVEL; needed = xpRequired(newLevel); leveledUp = true;
      }
      const newLevelHpBonus = levelHpBonusRef.current + hpDelta;
      const newMaxHp = computeStats({
        base: statsRef.current, levelHpBonus: newLevelHpBonus,
        bonusDmg: newBonusDmg, equip: equipBonusesRef.current,
        skills: skillBonusesRef.current,
      }).maxHp;
      playerLevelRef.current    = newLevel;   playerBonusDmgRef.current = newBonusDmg;
      levelHpBonusRef.current   = newLevelHpBonus; playerMaxHpRef.current = newMaxHp;
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
      if (leveledUp) { playerHpRef.current = newMaxHp; setPlayerHp(newMaxHp); log(`🌟 Новый уровень ${newLevel}! HP восстановлено!`); }
      log(`✨ Награда: ${_questXp} опыта!`);

      // ── Item rewards (only if not already owned) ───────────────────────────
      for (const itemKey of def.reward.items ?? []) {
        if (!inventoryRef.current.some(i => i.key === itemKey)) {
          const item = makeItem(itemKey);
          inventoryRef.current = [...inventoryRef.current, item];
          setInventory(prev => [...prev, item]);
          log(`🎁 Получен предмет: ${item.name}!`);
        } else {
          log(`(У вас уже есть ${ITEM_CATALOG[itemKey]?.name ?? itemKey})`);
        }
      }

      // ── Mark completed ─────────────────────────────────────────────────────
      const updated: QuestProgress = {
        ...questProgressRef.current,
        [action.questId]: {
          status:  'completed' as const,
          current: questProgressRef.current[action.questId]?.current ?? 0,
        },
      };
      questProgressRef.current = updated;
      setQuestProgress(updated);
      log('🏆 Задание завершено!');
      setQuestDialogue(null);
    }
  }, [log]);

  // ── NPC interact (called by the nearby-NPC Interact button) ──────────────
  const handleNpcInteract = useCallback((npc: { id: string; name: string; emoji: string }) => {
    // Merchant → open shop
    if (npc.id === 'merchant') {
      setShowShop(true);
      setShowCharPanel(false); setShowInventory(false); setShowWorldMap(false); setShowQuestPanel(false); setShowSkillPanel(false);
      return;
    }
    // Quest NPCs or generic dialog
    const dlg = getNpcDialogue(npc.id, questProgressRef.current);
    if (dlg) { setQuestDialogue(dlg); }
    else { setNpcDialog(`${npc.emoji} ${npc.name}: «Скоро здесь будут квесты и торговля! Следите за обновлениями.»`); }
  }, []);

  // ── Shop: buy ────────────────────────────────────────────────────────────
  const handleShopBuy = useCallback((key: string) => {
    const price = SHOP_BUY_PRICE[key];
    if (price === undefined) return;
    if (playerGoldRef.current < price) {
      log('💰 Недостаточно золота!');
      return;
    }
    const item = makeItem(key);
    playerGoldRef.current -= price;
    setPlayerGold(playerGoldRef.current);
    inventoryRef.current = [...inventoryRef.current, item];
    setInventory(prev => [...prev, item]);
    log(`🛒 Куплено: ${item.name} за ${price}💰`);
  }, [log]);

  // ── Shop: sell ───────────────────────────────────────────────────────────
  const handleShopSell = useCallback((itemId: string) => {
    const item = inventoryRef.current.find(i => i.id === itemId);
    if (!item) return;
    if (Object.values(equipmentRef.current).some(eq => eq?.id === itemId)) {
      log('Нельзя продать надетый предмет!');
      return;
    }
    const price = sellPrice(item);
    inventoryRef.current = inventoryRef.current.filter(i => i.id !== itemId);
    setInventory(prev => prev.filter(i => i.id !== itemId));
    playerGoldRef.current += price;
    setPlayerGold(playerGoldRef.current);
    log(`💸 Продано: ${item.name} за ${price}💰`);
  }, [log]);

  // ── Consumable: use ───────────────────────────────────────────────────────
  const handleUseItem = useCallback((item: Item) => {
    const healAmt = CONSUMABLE_HEAL[item.key];
    if (!healAmt) return;
    const currentHp = playerHpRef.current;
    const maxHp     = playerMaxHpRef.current;
    if (currentHp >= maxHp) { log('❤️ HP уже максимально!'); return; }
    const newHp  = Math.min(maxHp, currentHp + healAmt);
    const healed = newHp - currentHp;
    playerHpRef.current = newHp;
    setPlayerHp(newHp);
    inventoryRef.current = inventoryRef.current.filter(i => i.id !== item.id);
    setInventory(prev => prev.filter(i => i.id !== item.id));
    setSelectedItem(null);
    log(`🧪 Использовано ${item.name}: +${healed} HP!`);
    spawnFloat(`+${healed}`, playerPosRef.current.x, playerPosRef.current.y, 'heal');
  }, [log, spawnFloat]);

  // ── Skill upgrade ─────────────────────────────────────────────────────────
  const handleUpgradeSkill = useCallback((skillId: string) => {
    const def = ALL_SKILLS_MAP[skillId];
    if (!def) return;
    const current = skillProgressRef.current[skillId] ?? 0;
    if (current >= def.maxLevel) return;
    if (skillPointsRef.current <= 0) return;

    const newLevel       = current + 1;
    const newProgress: SkillProgress = { ...skillProgressRef.current, [skillId]: newLevel };
    skillProgressRef.current = newProgress;
    setSkillProgress(newProgress);

    skillPointsRef.current -= 1;
    setSkillPoints(p => p - 1);

    const newBonuses = calcSkillBonuses(newProgress);
    skillBonusesRef.current = newBonuses;

    // Iron Skin — recalculate max HP immediately
    if (skillId === 'iron_skin') {
      const newMaxHp = computeStats({
        base: statsRef.current, levelHpBonus: levelHpBonusRef.current,
        bonusDmg: playerBonusDmgRef.current, equip: equipBonusesRef.current,
        skills: newBonuses,
      }).maxHp;
      playerMaxHpRef.current = newMaxHp;
      setPlayerMaxHp(newMaxHp);
    }

    log(`⬆️ ${def.name}: уровень ${newLevel}`);
  }, [log]);

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
    setShowShop(false);
    setShowSkillPanel(false);
    setShowBossVictory(false);
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

    const initMaxHp = INITIAL_HP + INITIAL_BASE_STATS.vitality * 10;

    // Reset refs immediately so any in-flight callbacks see correct values
    playerHpRef.current        = initMaxHp;
    playerMaxHpRef.current     = initMaxHp;
    phaseRef.current           = 'explore';
    shieldRef.current          = false;
    playerPosRef.current       = LOCATION_SPAWN.village;
    enemiesRef.current         = [];
    activeEnemyIdRef.current   = null;
    playerBonusDmgRef.current  = 0;
    levelHpBonusRef.current    = 0;
    playerLevelRef.current     = INITIAL_PLAYER_LVL;
    playerXpRef.current        = 0;
    xpToNextRef.current        = xpRequired(INITIAL_PLAYER_LVL);
    playerGoldRef.current      = 0;
    statPointsRef.current      = 0;
    statsRef.current           = { ...INITIAL_BASE_STATS };
    equipmentRef.current       = { ...EMPTY_EQUIPMENT };
    equipBonusesRef.current    = { ...ZERO_EQUIP_BONUSES };
    inventoryRef.current       = [];
    currentLocationRef.current           = 'village';
    bossStateRef.current                  = INITIAL_BOSS_STATE;
    bossSpawnedThisVisitRef.current       = false;
    bossDefeatedThisVisitRef.current      = false;

    // Reset state
    setPhase('explore');
    setPlayerPos(LOCATION_SPAWN.village);
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
    setStats({ ...INITIAL_BASE_STATS });
    setStatPoints(0);
    setSkillProgress({});
    setSkillPoints(0);
    setBossState(INITIAL_BOSS_STATE);
    setBossSpawnedThisVisit(false);
    setBossDefeatedThisVisit(false);
    setShowBossVictory(false);
    setEquipment({ ...EMPTY_EQUIPMENT });
    setInventory([]);
    setEquipBonuses({ ...ZERO_EQUIP_BONUSES });
    setCurrentLocation('village');
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

  // All derived character stats — single source of truth from stats.ts
  const skillBonuses = calcSkillBonuses(skillProgress);
  const cs: ComputedStats = computeStats({
    base: stats, levelHpBonus, bonusDmg: playerBonusDmg,
    equip: equipBonuses, skills: skillBonuses,
  });

  // ── Camera / viewport ─────────────────────────────────────────────────────
  const camCol    = Math.max(0, Math.min(MAP_COLS - VP_COLS, playerPos.x - Math.floor(VP_COLS / 2)));
  const camRow    = Math.max(0, Math.min(MAP_ROWS - VP_ROWS, playerPos.y - Math.floor(VP_ROWS / 2)));
  const currentMap = LOCATION_MAPS[currentLocation];
  const currentNpcs = LOCATION_NPCS[currentLocation] ?? [];

  // Adjacent NPC — shows the Interact button when the player is 1 tile away
  const nearbyNpc = (phase === 'explore' && !transitioning)
    ? currentNpcs.find(n =>
        Math.abs(n.x - playerPos.x) <= 1 &&
        Math.abs(n.y - playerPos.y) <= 1 &&
        !(n.x === playerPos.x && n.y === playerPos.y),
      ) ?? null
    : null;

  // ── Tile renderer ─────────────────────────────────────────────────────────
  const renderTileContent = (gx: number, gy: number, tileType: number) => {
    if (gx === playerPos.x && gy === playerPos.y)
      return <div className="w-full h-full tile-player rounded flex items-center justify-center text-lg z-10 relative">🧝</div>;
    const enemy = livingEnemies.find(e => e.x === gx && e.y === gy);
    if (enemy) {
      const isBoss = enemy.id === BOSS_ID;
      return (
        <div className={[
          'w-full h-full rounded flex items-center justify-center z-10 relative',
          isBoss ? 'text-2xl' : 'text-lg',
          enemy.id === activeEnemyId ? 'tile-enemy' : 'tile-enemy-idle',
          isBoss ? 'ring-2 ring-red-600/60 ring-inset' : '',
        ].join(' ')}>
          {enemy.emoji}
          {isBoss && (
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] font-black text-red-400 whitespace-nowrap uppercase tracking-wider leading-none pointer-events-none drop-shadow">
              БОСС
            </span>
          )}
        </div>
      );
    }
    const npc = currentNpcs.find(n => n.x === gx && n.y === gy);
    if (npc) return <div className="w-full h-full tile-npc flex items-center justify-center text-sm">{npc.emoji}</div>;
    if (tileType === 4) {
      // Look up which destination this exit leads to, then render themed tile.
      const exitDef = LOCATION_EXITS[currentLocation]?.get(`${gx},${gy}`);
      const dest    = exitDef?.to;
      const src     = currentLocation;
      // Dirt road: Village ↔ Forest
      if ((src === 'village' && dest === 'forest') || (src === 'forest' && dest === 'village'))
        return <div className="w-full h-full tile-exit-road  flex items-center justify-center text-sm" title="Дорога в лес">🛤️</div>;
      // Cave entrance / exit: Forest ↔ Cave
      if (src === 'forest' && dest === 'cave')
        return <div className="w-full h-full tile-exit-cave  flex items-center justify-center text-sm" title="Вход в пещеру">🕳️</div>;
      if (src === 'cave'   && dest === 'forest')
        return <div className="w-full h-full tile-exit-cave  flex items-center justify-center text-sm" title="Выход из пещеры">⛰️</div>;
      // Stone stairs / ruined gate: Cave ↔ Ruins
      if (src === 'cave'  && dest === 'ruins')
        return <div className="w-full h-full tile-exit-ruins flex items-center justify-center text-sm" title="Врата руин">🏛️</div>;
      if (src === 'ruins' && dest === 'cave')
        return <div className="w-full h-full tile-exit-ruins flex items-center justify-center text-sm" title="Разрушенная лестница">🪜</div>;
      // Wooden bridge / muddy path: Forest ↔ Swamp
      if ((src === 'forest' && dest === 'swamp') || (src === 'swamp' && dest === 'forest'))
        return <div className="w-full h-full tile-exit-bridge flex items-center justify-center text-sm" title="Мост в болото">🌉</div>;
      // Fallback — should never be reached with current map data
      return <div className="w-full h-full tile-exit flex items-center justify-center text-sm">🚪</div>;
    }
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
                {activeEnemy.id === BOSS_ID && (
                  <div className="flex justify-center mb-[2px]">
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest animate-pulse">👑 БОСС</span>
                  </div>
                )}
                <div className="flex justify-between items-end mb-1">
                  <span className={`text-xs font-mono ${activeEnemy.id === BOSS_ID ? 'text-red-400' : 'text-destructive'}`}>{activeEnemy.hp}/{activeEnemy.maxHp}</span>
                  <span className="text-sm font-bold text-white tracking-wide">{activeEnemy.emoji} {activeEnemy.name}</span>
                </div>
                <div className="h-[6px] w-full bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border flex justify-end">
                  <div className={`h-full transition-all duration-300 ${activeEnemy.id === BOSS_ID ? 'bg-red-600' : 'bg-destructive'}`}
                    style={{ width: `${Math.round((activeEnemy.hp / activeEnemy.maxHp) * 100)}%` }} />
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-end items-end mb-1">
                  {LOCATION_META[currentLocation].isSafeZone
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
          {LOCATION_META[currentLocation].isSafeZone && (
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
            onClick={() => { setShowCharPanel(v => !v); setShowInventory(false); setShowWorldMap(false); setShowQuestPanel(false); setShowShop(false); setShowSkillPanel(false); setSelectedItem(null); }}
            className={`shrink-0 flex items-center gap-1 px-2 py-[3px] rounded border text-[11px] font-bold transition-colors
              ${showCharPanel ? 'bg-primary/20 border-primary text-primary' : 'bg-[#1e1e28] border-tile-border text-[#aaa]'}`}>
            {statPoints > 0 && (
              <span className="w-[14px] h-[14px] rounded-full bg-primary text-[#111] text-[9px] font-black flex items-center justify-center leading-none">{statPoints}</span>
            )}
            👤
          </button>

          {/* Инвентарь button */}
          <button
            onClick={() => { setShowInventory(v => !v); setShowCharPanel(false); setShowWorldMap(false); setShowQuestPanel(false); setShowShop(false); setShowSkillPanel(false); setSelectedItem(null); }}
            className={`shrink-0 flex items-center gap-1 px-2 py-[3px] rounded border text-[11px] font-bold transition-colors
              ${showInventory ? 'bg-primary/20 border-primary text-primary' : 'bg-[#1e1e28] border-tile-border text-[#aaa]'}`}>
            {inventory.length > 0 && (
              <span className="w-[14px] h-[14px] rounded-full bg-[#3a3a50] text-white text-[9px] font-black flex items-center justify-center leading-none">{inventory.length}</span>
            )}
            🎒
          </button>