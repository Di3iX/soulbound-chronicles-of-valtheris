import React, { useState, useEffect, useCallback, useRef } from 'react';
import { appendLog } from './game/ui/logger';
import { loadGame, clearSave, SaveData } from './save';
import { usePersistence } from './hooks/usePersistence';
import { useCombat } from './hooks/useCombat';
import {
  Item, ItemType, ItemBonuses, Rarity,
  ITEM_CATALOG, RARITY_STYLE,
  makeItem,
} from './inventory';
import {
  Equipment, EquipBonuses,
  EMPTY_EQUIPMENT, ZERO_EQUIP_BONUSES,
  calcEquipBonuses,
} from './equipment';
import {
  LocationId, Phase, Enemy, KillReward,
  xpRequired, makeLocationEnemies,
} from './combat';
import {
  BaseStats, ComputedStats, INITIAL_BASE_STATS, INITIAL_HP,
  computeStats, StatsInput,
} from './stats';
import {
  MAP_COLS, MAP_ROWS, VP_COLS, VP_ROWS,
  LOCATION_META, LOCATION_SPAWN, LOCATION_EXITS, LOCATION_MAPS, LOCATION_NPCS,
  getLocation, moveToLocation, getAvailableExits,
} from './world/locations';
import { QuestProgress, QUEST_DEFS } from './quests/quests';
import { NpcDialogue, DialogAction, getNpcDialogue } from './quests/npc';
import { SHOP_BUY_PRICE, sellPrice, CONSUMABLE_HEAL } from './shop/shop';
import ShopPanel from './shop/ShopPanel';
import CharacterPanel from './components/CharacterPanel';
import InventoryPanel from './components/InventoryPanel';
import CombatHUD from './components/CombatHUD';
import QuestPanel from './components/QuestPanel';
import WorldMapPanel from './components/WorldMapPanel';
import GameMap from './components/GameMap';
import ControlsPanel from './components/ControlsPanel';
import CombatLog from './components/CombatLog';
import { ALL_SKILLS_MAP, SKILL_POINTS_PER_LEVEL } from './skills/skills';
import { SkillProgress, SkillBonuses, calcSkillBonuses } from './skills/skillTree';
import SkillPanel from './skills/SkillPanel';
import {
  BOSS_ID, BossState, BossRewardInfo, INITIAL_BOSS_STATE,
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

  // ── Auto-save: writes to localStorage on every meaningful state change ─────
  usePersistence({
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

  // ── Helpers ─────────────────────────────────────────────────────────────────
const log = useCallback((msg: string) => {
  appendLog(setLogs, msg);
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

  // ── Combat: loot, XP/level-up, enemy & boss death, auto-attack loop, skills ─
  const { grantXp, useSkill } = useCombat({
    phase, skillsCd,
    activeEnemyIdRef, bossDefeatedThisVisitRef, bossSpawnedThisVisitRef, bossStateRef,
    currentLocationRef, enemiesRef, enemyAttackTimeout, equipBonusesRef, inventoryRef,
    levelHpBonusRef, phaseRef, playerAttackTimeout, playerBonusDmgRef, playerGoldRef,
    playerHpRef, playerLevelRef, playerMaxHpRef, playerPosRef, playerXpRef, questProgressRef,
    shieldRef, skillBonusesRef, skillPointsRef, statPointsRef, statsRef,
    log, spawnFloat,
    setActiveEnemyId, setBossAppearNotif, setBossDefeatedThisVisit, setBossRewardInfo,
    setBossSpawnedThisVisit, setBossState, setEnemies, setInventory, setLastKillReward,
    setLevelHpBonus, setLootNotif, setPhase, setPlayerBonusDmg, setPlayerGold, setPlayerHp,
    setPlayerLevel, setPlayerMaxHp, setPlayerPos, setPlayerXp, setQuestProgress,
    setShieldActive, setShowBossVictory, setSkillPoints, setSkillsCd, setStatPoints, setXpToNext,
  });

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

  // ── Floating number cleanup ───────────────────────────────────────────────
  useEffect(() => {
    if (floatingNums.length === 0) return;
    const t = setInterval(() => {
      const now = Date.now();
      setFloatingNums(prev => prev.filter(f => now - f.timestamp < 1300));
    }, 200);
    return () => clearInterval(t);
  }, [floatingNums]);

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
      grantXp(_questXp);
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
  }, [log, grantXp]);

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
      <CombatHUD
        shieldActive={shieldActive}
        playerLevel={playerLevel}
        playerHp={playerHp}
        playerMaxHp={playerMaxHp}
        activeEnemy={activeEnemy}
        bossId={BOSS_ID}
        currentLocation={currentLocation}
        locationMeta={LOCATION_META}
        livingEnemiesCount={livingEnemies.length}
        totalEnemiesCount={enemies.length}
        xpPct={xpPct}
        playerXp={playerXp}
        xpToNext={xpToNext}
        playerGold={playerGold}
        statPoints={statPoints}
        skillPoints={skillPoints}
        inventoryCount={inventory.length}
        questProgress={questProgress}
        showCharPanel={showCharPanel}
        showInventory={showInventory}
        showWorldMap={showWorldMap}
        showQuestPanel={showQuestPanel}
        showSkillPanel={showSkillPanel}
        onToggleCharPanel={() => { setShowCharPanel(v => !v); setShowInventory(false); setShowWorldMap(false); setShowQuestPanel(false); setShowShop(false); setShowSkillPanel(false); setSelectedItem(null); }}
        onToggleInventory={() => { setShowInventory(v => !v); setShowCharPanel(false); setShowWorldMap(false); setShowQuestPanel(false); setShowShop(false); setShowSkillPanel(false); setSelectedItem(null); }}
        onToggleWorldMap={() => { setShowWorldMap(v => !v); setShowCharPanel(false); setShowInventory(false); setShowQuestPanel(false); setShowShop(false); setShowSkillPanel(false); setSelectedItem(null); }}
        onToggleQuestPanel={() => { setShowQuestPanel(v => !v); setShowCharPanel(false); setShowInventory(false); setShowWorldMap(false); setShowShop(false); setShowSkillPanel(false); setSelectedItem(null); }}
        onToggleSkillPanel={() => { setShowSkillPanel(v => !v); setShowCharPanel(false); setShowInventory(false); setShowWorldMap(false); setShowShop(false); setShowQuestPanel(false); setSelectedItem(null); }}
      />

      {/* ══ 2. MAP ══ */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] p-2">
        <div className="relative" style={{ width: 'min(90vw, 360px)', height: 'min(90vw, 360px)' }}>

          {/* Tile grid, HP bars, floating numbers, boss/transition overlays */}
          <GameMap
            camCol={camCol}
            camRow={camRow}
            currentMap={currentMap}
            renderTileContent={renderTileContent}
            phase={phase}
            playerHp={playerHp}
            playerMaxHp={playerMaxHp}
            playerPos={playerPos}
            activeEnemy={activeEnemy}
            bossId={BOSS_ID}
            floatingNums={floatingNums}
            bossAppearNotif={bossAppearNotif}
            transitioning={transitioning}
            currentLocation={currentLocation}
            locationEmoji={LOCATION_META[currentLocation].emoji}
          />

          {/* Generic NPC dialog overlay (non-quest NPCs) */}
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

          {/* ══ NPC QUEST DIALOGUE OVERLAY (z-70) ══════════════════════════════
              Rich modal: NPC lines + action buttons (Accept / Complete / Dismiss)
          ═══════════════════════════════════════════════════════════════════ */}
          {questDialogue && (
            <div className="absolute inset-0 z-[70] bg-black/85 flex flex-col justify-end rounded px-3 pb-4 pt-14 backdrop-blur-[2px]">
              <div className="w-full bg-[#0d0d16] border border-tile-border/80 rounded-xl shadow-2xl overflow-hidden">
                {/* NPC name row */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#111118] border-b border-tile-border/60">
                  <span className="text-xl leading-none">{questDialogue.emoji}</span>
                  <span className="text-sm font-bold text-primary tracking-wide">{questDialogue.name}</span>
                </div>
                {/* Dialogue lines */}
                <div className="px-4 py-3 space-y-1">
                  {questDialogue.lines.map((line, i) => (
                    <p key={i} className="text-[12px] text-[#ccc] leading-relaxed italic">
                      {i === 0 && '«'}{line}{i === questDialogue.lines.length - 1 && '»'}
                    </p>
                  ))}
                </div>
                {/* Action buttons */}
                <div className="px-4 pb-4 pt-1 flex flex-col gap-[6px]">
                  {questDialogue.buttons.map((btn, i) => (
                    <button key={i}
                      onClick={() => handleQuestAction(btn.action)}
                      className={`w-full py-2 rounded-lg border font-bold text-[12px] active:scale-95 transition-transform ${
                        btn.primary
                          ? 'border-primary bg-primary/20 text-primary shadow-[0_0_8px_rgba(200,150,42,0.2)]'
                          : 'border-tile-border bg-[#111118] text-[#777]'
                      }`}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
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

          {/* Final victory (normal — boss victory handled by BossVictoryPanel below) */}
          {phase === 'final-victory' && !showBossVictory && (
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

          {/* Boss Victory Panel — shown instead of regular final-victory after boss kill */}
          {showBossVictory && bossRewardInfo && (
            <BossVictoryPanel
              reward={bossRewardInfo}
              onContinue={() => {
                setShowBossVictory(false);
                phaseRef.current = 'explore';
                setPhase('explore');
              }}
            />
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
            <CharacterPanel
              playerLevel={playerLevel}
              playerHp={playerHp}
              cs={cs}
              stats={stats}
              equipBonuses={equipBonuses}
              statPoints={statPoints}
              spendStat={spendStat}
              onClose={() => setShowCharPanel(false)}
              onResetCharacter={resetCharacter}
            />
          )}

          {/* ═══════════════════════════════════════════════════════
              INVENTORY PANEL OVERLAY  (z-60)
          ═══════════════════════════════════════════════════════ */}
          {showInventory && (
            <InventoryPanel
              inventory={inventory}
              equipment={equipment}
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              equipItem={equipItem}
              unequipItem={unequipItem}
              handleUseItem={handleUseItem}
              onClose={() => setShowInventory(false)}
            />
          )}

          {/* ══ SKILL PANEL OVERLAY (z-60) ═══════════════════════════════════════
              Three skill trees — Warrior / Ranger / Mage.
          ═══════════════════════════════════════════════════════════════════ */}
          {showSkillPanel && (
            <SkillPanel
              skillProgress={skillProgress}
              skillPoints={skillPoints}
              onUpgrade={handleUpgradeSkill}
              onClose={() => setShowSkillPanel(false)}
            />
          )}

          {/* ══ SHOP PANEL OVERLAY (z-60) ════════════════════════════════════════
              Merchant shop — Buy / Sell tabs.
          ═══════════════════════════════════════════════════════════════════ */}
          {showShop && (
            <ShopPanel
              playerGold={playerGold}
              inventory={inventory}
              equipment={equipment}
              onBuy={handleShopBuy}
              onSell={handleShopSell}
              onClose={() => setShowShop(false)}
            />
          )}

          {/* ══ QUEST PANEL OVERLAY (z-60) ══════════════════════════════════════
              Lists all quests, objectives, progress, rewards, and status.
          ═══════════════════════════════════════════════════════════════════ */}
          {showQuestPanel && (
            <QuestPanel questProgress={questProgress} onClose={() => setShowQuestPanel(false)} />
          )}

          {/* ══ WORLD MAP OVERLAY  (z-60) ══════════════════════════════════════
              Shows all 5 locations as a visual graph.
              Connected locations are clickable; unreachable ones are dimmed.
          ═══════════════════════════════════════════════════════════════════ */}
          {showWorldMap && (
            <WorldMapPanel
              currentLocation={currentLocation}
              phase={phase}
              transitioning={transitioning}
              onTravel={handleWorldMapTravel}
              onClose={() => setShowWorldMap(false)}
            />
          )}

        </div>
      </div>

      {/* ══ INTERACT BUTTON — shown when adjacent to an NPC in explore mode ══ */}
      {nearbyNpc && (
        <div className="shrink-0 flex items-center justify-center py-[5px] border-t border-tile-border/30 bg-[#09090e] animate-in fade-in duration-150">
          <button
            onClick={() => handleNpcInteract(nearbyNpc)}
            className="flex items-center gap-2 px-5 py-[5px] rounded-lg border border-primary/50 bg-primary/10 text-primary font-bold text-[12px] active:scale-95 transition-all shadow-[0_0_8px_rgba(200,150,42,0.12)]">
            💬 Говорить · {nearbyNpc.emoji} {nearbyNpc.name}
          </button>
        </div>
      )}

      {/* ══ 3-4. MOVEMENT + SKILL BAR ══ */}
      <ControlsPanel phase={phase} movePlayer={movePlayer} skillsCd={skillsCd} useSkill={useSkill} />

      {/* ══ 5. COMBAT LOG ══ */}
      <CombatLog logs={logs} />

    </div>
  );
}