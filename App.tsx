import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { appendLog } from './game/ui/logger';
import { HEAL_COST, loadHealState, getRecoverableXp } from './game/healerState';
import { loadGame, SaveData } from './save';
import { usePersistence } from './hooks/usePersistence';
import { useCombat } from './hooks/useCombat';
import { useSyncedRef } from './hooks/useSyncedRef';
import { useReset } from './hooks/useReset';
import { useEquipment } from './hooks/useEquipment';
import { useEconomy } from './hooks/useEconomy';
import { useItemActions } from './hooks/useItemActions';
import { useClassProgression } from './hooks/useClassProgression';
import { useWorldMovement } from './hooks/useWorldMovement';
import { useQuestActions } from './hooks/useQuestActions';
import { useGameView } from './hooks/useGameView';
import {
  Item, ItemType, ItemBonuses, Rarity,
  RARITY_STYLE,
} from './inventory';
import {
  Equipment, EquipBonuses,
  EMPTY_EQUIPMENT, ZERO_EQUIP_BONUSES,
} from './equipment';
import {
  LocationId, Phase, Enemy, StatusEffect,
  xpRequired, makeLocationEnemies,
} from './combat';
import {
  BaseStats, INITIAL_BASE_STATS, INITIAL_HP, INITIAL_MP,
} from './stats';
import {
  LOCATION_META, LOCATION_SPAWN,
  ExploredTiles, makeInitialExploredTiles, revealAround,
} from './world/locations';
import {
  OpenedChests,
} from './world/chests';
import { renderTileContent as renderTile } from './game/ui/renderTile';
import { QuestProgress } from './quests/quests';
import { NpcDialogue } from './quests/npc';
import ClassSelectPanel from './classes/ClassSelectPanel';
import ClassPanel from './classes/ClassPanel';
import MasteryPanel from './classes/MasteryPanel';
import TalentPanel from './classes/TalentPanel';
import ClassSkillBar from './classes/ClassSkillBar';
import TrialPanel from './classes/TrialPanel';
import {
  isTrialReady,
} from './classes/trials';
import { pathResourceLabel } from './classes/classCombatSkills';
import {
  createMasteryState,
  type PlayerClassState,
  type PlayerMasteryState,
} from './classes/playerClass';
import ShopPanel from './shop/ShopPanel';
import CraftPanel from './components/CraftPanel';
import UpgradePanel from './components/UpgradePanel';
import TierPromotePanel from './components/TierPromotePanel';
import EnchantPanel from './components/EnchantPanel';
import CharacterPanel from './components/CharacterPanel';
import InventoryPanel from './components/InventoryPanel';
import CombatHUD from './components/CombatHUD';
import QuestPanel from './components/QuestPanel';
import WorldMapPanel from './components/WorldMapPanel';
import GameMap from './components/GameMap';
import ControlsPanel from './components/ControlsPanel';
import CombatLog from './components/CombatLog';
import { SkillProgress, SkillBonuses, calcSkillBonuses } from './skills/skillTree';
import SkillPanel from './skills/SkillPanel';
import {
  BOSS_ID, FIELD_BOSS_ID, RUINS_BOSS_ID, SWAMP_BOSS_ID, MINE_BOSS_ID, PASS_BOSS_ID, ICE_BOSS_ID,
  BossState, BossRewardInfo, normalizeBossState,
} from './boss/boss';
import BossVictoryPanel from './boss/BossVictoryPanel';
import QuestDialogueOverlay from './components/QuestDialogueOverlay';

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
  const [playerMp, setPlayerMp]           = useState(sv?.playerMp         ?? INITIAL_MP);
  const [playerMaxMp, setPlayerMaxMp]     = useState(sv?.playerMaxMp      ?? INITIAL_MP);
  const [enemies, setEnemies]             = useState<Enemy[]>(sv?.enemies  ?? []);
  const [activeEnemyId, setActiveEnemyId] = useState<number | null>(null);
  const [shieldActive, setShieldActive]   = useState(false);
  const [playerStatusEffects, setPlayerStatusEffects] = useState<StatusEffect[]>([]);
  const [skillsCd, setSkillsCd]           = useState<Record<string, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [logs, setLogs]                   = useState<LogEntry[]>([{ id: 0, msg: sv ? '💾 Игра загружена!' : 'Тёмные подземелья ждут...' }]);
  const [floatingNums, setFloatingNums]   = useState<FloatingNum[]>([]);

  // ── Progression state ──────────────────────────────────────────────────────
  const [playerLevel, setPlayerLevel]       = useState(sv?.playerLevel     ?? INITIAL_PLAYER_LVL);
  const [playerXp, setPlayerXp]             = useState(sv?.playerXp        ?? 0);
  const [xpToNext, setXpToNext]             = useState(sv?.xpToNext        ?? xpRequired(INITIAL_PLAYER_LVL));
  const [playerGold, setPlayerGold]         = useState(sv?.playerGold      ?? 0);
  const [playerBonusDmg, setPlayerBonusDmg] = useState(sv?.playerBonusDmg ?? 0);
  const [levelHpBonus, setLevelHpBonus]     = useState(sv?.levelHpBonus    ?? 0);
  const [levelMpBonus, setLevelMpBonus]     = useState(sv?.levelMpBonus    ?? 0);

  // ── Stats state ────────────────────────────────────────────────────────────
  const [stats, setStats]               = useState<BaseStats>(sv?.stats      ?? { ...INITIAL_BASE_STATS });
  const [statPoints, setStatPoints]     = useState(sv?.statPoints            ?? 0);
  const [showCharPanel, setShowCharPanel] = useState(false);

  // ── Class / Mastery (см. STEP1_APP.md) ──────────────────────────────────────
  const [classState, setClassState] = useState<PlayerClassState | null>(sv?.classState ?? null);
  const [masteryState, setMasteryState] = useState<PlayerMasteryState>(sv?.masteryState ?? createMasteryState());
  const [showClassSelect, setShowClassSelect] = useState(!sv?.classState);
  const [showClassPanel, setShowClassPanel] = useState(false);
  const [showMastery, setShowMastery] = useState(false);
  const [showTalents, setShowTalents] = useState(false);
  const [showTrial, setShowTrial] = useState(false);

  // ── Inventory / equipment state ────────────────────────────────────────────
  const [equipment, setEquipment]         = useState<Equipment>(sv?.equipment       ?? { ...EMPTY_EQUIPMENT });
  const [inventory, setInventory]         = useState<Item[]>(sv?.inventory           ?? []);
  const [equipBonuses, setEquipBonuses]   = useState<EquipBonuses>(sv?.equipBonuses ?? { ...ZERO_EQUIP_BONUSES });
  const [showInventory, setShowInventory] = useState(false);
  const [selectedItem, setSelectedItem]   = useState<Item | null>(null);
  const [lootNotif, setLootNotif]         = useState<string | null>(null);
  const [gateNotif, setGateNotif]         = useState<string | null>(null);
  const gateNotifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCraft, setShowCraft]         = useState(false);
  const [unlockedRecipes, setUnlockedRecipes] = useState<string[]>(sv?.unlockedRecipes ?? []);
  const [showUpgrade, setShowUpgrade]     = useState(false);
  const [showTier, setShowTier]           = useState(false);
  const [showEnchant, setShowEnchant]     = useState(false);
  const [showWorldMap, setShowWorldMap]   = useState(false);
  const [openedChests, setOpenedChests]   = useState<OpenedChests>(sv?.openedChests ?? {});

  // ── World map state ─────────────────────────────────────────────────────────
  const [currentLocation, setCurrentLocation] = useState<LocationId>(sv?.currentLocation ?? 'village');
  const [transitioning, setTransitioning]     = useState(false);
  const [npcDialog, setNpcDialog]             = useState<string | null>(null);
  const [questProgress, setQuestProgress]     = useState<QuestProgress>(sv?.questProgress ?? {});
  const [questDialogue, setQuestDialogue]     = useState<NpcDialogue | null>(null);
  const [exploredTiles, setExploredTiles]     = useState<ExploredTiles>(sv?.exploredTiles ?? makeInitialExploredTiles());
  const [minimapVisible, setMinimapVisible]   = useState(true);
  const [showQuestPanel, setShowQuestPanel]   = useState(false);
  const [showShop, setShowShop]               = useState(false);
  const [skillProgress, setSkillProgress]     = useState<SkillProgress>(sv?.skillProgress ?? {});
  const [skillPoints, setSkillPoints]         = useState(sv?.skillPoints ?? 0);
  const [showSkillPanel, setShowSkillPanel]   = useState(false);
  const [bossState, setBossState]             = useState<BossState>(normalizeBossState(sv?.bossState));
  const [bossAppearNotif, setBossAppearNotif] = useState(false);
  const [showBossVictory, setShowBossVictory] = useState(false);
  const [bossRewardInfo, setBossRewardInfo]   = useState<BossRewardInfo | null>(null);

  /** The 7 header panels are mutually exclusive — opening one closes the rest.
   *  `openPanel(null)` closes all of them. Replaces what used to be 9 separate
   *  copy-paste call sites each manually toggling all 7 setters. */
  type PanelKey = 'char' | 'inventory' | 'worldMap' | 'quest' | 'shop' | 'skill' | 'class';
  const openPanel = useCallback((key: PanelKey | null) => {
    setShowCharPanel(key === 'char');
    setShowInventory(key === 'inventory');
    setShowWorldMap(key === 'worldMap');
    setShowQuestPanel(key === 'quest');
    setShowShop(key === 'shop');
    setShowSkillPanel(key === 'skill');
    setShowClassPanel(key === 'class');
    setSelectedItem(null);
  }, []);
  const togglePanel = useCallback((key: PanelKey, isCurrentlyOpen: boolean) => {
    openPanel(isCurrentlyOpen ? null : key);
  }, [openPanel]);

  // ── Refs (initialised from save so callbacks see correct values immediately) ─
  const playerHpRef        = useRef(sv?.playerHp    ?? (INITIAL_HP + INITIAL_BASE_STATS.vitality * 10));
  const playerMaxHpRef     = useRef(sv?.playerMaxHp ?? (INITIAL_HP + INITIAL_BASE_STATS.vitality * 10));
  const playerMpRef        = useRef(sv?.playerMp    ?? INITIAL_MP);
  const playerMaxMpRef     = useRef(sv?.playerMaxMp ?? INITIAL_MP);
  const shieldRef          = useRef(false);
  const playerStatusEffectsRef = useRef<StatusEffect[]>([]);
  const phaseRef           = useRef<Phase>('explore');
  const playerPosRef       = useRef(sv?.playerPos         ?? LOCATION_SPAWN.village);
  const enemiesRef         = useRef<Enemy[]>(sv?.enemies  ?? []);
  const activeEnemyIdRef   = useRef<number | null>(null);
  const statsRef           = useRef<BaseStats>(sv?.stats  ?? { ...INITIAL_BASE_STATS });
  const playerBonusDmgRef  = useRef(sv?.playerBonusDmg   ?? 0);
  const levelHpBonusRef    = useRef(sv?.levelHpBonus      ?? 0);
  const levelMpBonusRef    = useRef(sv?.levelMpBonus      ?? 0);
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
  const exploredTilesRef   = useRef<ExploredTiles>(sv?.exploredTiles ?? makeInitialExploredTiles());
  const skillProgressRef   = useRef<SkillProgress>(sv?.skillProgress ?? {});
  const skillPointsRef     = useRef(sv?.skillPoints ?? 0);
  const skillBonusesRef    = useRef<SkillBonuses>(calcSkillBonuses(sv?.skillProgress ?? {}));
  const bossStateRef              = useRef<BossState>(normalizeBossState(sv?.bossState));
  const playerAttackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enemyAttackTimeout  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedChestsRef     = useRef<OpenedChests>(sv?.openedChests ?? {});

  // Keep refs in sync
  useSyncedRef(playerHpRef, playerHp);
  useSyncedRef(playerMaxHpRef, playerMaxHp);
  useSyncedRef(playerMpRef, playerMp);
  useSyncedRef(playerMaxMpRef, playerMaxMp);
  useSyncedRef(shieldRef, shieldActive);
  useSyncedRef(playerStatusEffectsRef, playerStatusEffects);
  useSyncedRef(phaseRef, phase);
  useSyncedRef(playerPosRef, playerPos);
  useSyncedRef(enemiesRef, enemies);
  useSyncedRef(activeEnemyIdRef, activeEnemyId);
  useSyncedRef(currentLocationRef, currentLocation);
  useSyncedRef(transitioningRef, transitioning);
  useSyncedRef(statsRef, stats);
  useSyncedRef(playerBonusDmgRef, playerBonusDmg);
  useSyncedRef(levelHpBonusRef, levelHpBonus);
  useSyncedRef(levelMpBonusRef, levelMpBonus);
  useSyncedRef(playerLevelRef, playerLevel);
  useSyncedRef(playerXpRef, playerXp);
  useSyncedRef(playerGoldRef, playerGold);
  useSyncedRef(statPointsRef, statPoints);
  useSyncedRef(equipmentRef, equipment);
  useSyncedRef(equipBonusesRef, equipBonuses);
  useSyncedRef(inventoryRef, inventory);
  useSyncedRef(xpToNextRef, xpToNext);
  useSyncedRef(questProgressRef, questProgress);
  useSyncedRef(exploredTilesRef, exploredTiles);
  useSyncedRef(skillProgressRef, skillProgress);
  useSyncedRef(skillPointsRef, skillPoints);
  useSyncedRef(openedChestsRef, openedChests);
  useEffect(() => { skillBonusesRef.current    = calcSkillBonuses(skillProgress); }, [skillProgress]);

  // ── Fog of war: reveal tiles around the player as they move ────────────────
  useEffect(() => {
    const grid = exploredTilesRef.current[currentLocation];
    const revealed = revealAround(grid, playerPos);
    if (revealed !== grid) {
      const next = { ...exploredTilesRef.current, [currentLocation]: revealed };
      exploredTilesRef.current = next;
      setExploredTiles(next);
    }
  }, [playerPos, currentLocation]);
  useSyncedRef(bossStateRef, bossState);

  // ── Auto-save: writes to localStorage on every meaningful state change ─────
  usePersistence({
    playerLevel, playerXp, xpToNext, playerGold,
    playerBonusDmg, levelHpBonus, levelMpBonus,
    playerHp, playerMaxHp, playerMp, playerMaxMp,
    stats, statPoints,
    inventory, equipment, equipBonuses,
    playerPos, currentLocation, enemies,
    questProgress,
    skillProgress, skillPoints,
    bossState, exploredTiles,
    openedChests,
    unlockedRecipes,
    classState, masteryState,
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
const log = useCallback((msg: string) => {
  appendLog(setLogs, msg);
}, [setLogs]);

  /** Top-of-screen toast for "blocked, needs level N" messages — same slot as loot notifications. */
  const showGateNotif = useCallback((msg: string) => {
    setGateNotif(msg);
    if (gateNotifTimer.current) clearTimeout(gateNotifTimer.current);
    gateNotifTimer.current = setTimeout(() => setGateNotif(null), 2500);
  }, []);

  const spawnFloat = useCallback((value: string, col: number, row: number, type: FloatingNum['type']) => {
    setFloatingNums(prev => [...prev, { id: Date.now() + Math.random(), value, col, row, type, timestamp: Date.now() }]);
  }, []);

  // ── Class / Mastery (см. STEP1_APP.md) ──────────────────────────────────────
  const {
    handlePickArchetype, handleLevelUp, spendStat,
    classSkills, activeTrial,
    handleChooseProfession, handleChooseSpecialization, handleTrialChoice,
  } = useClassProgression({
    classState, masteryState, playerLevel, questProgress, stats, equipBonuses,
    statsRef, statPointsRef, levelHpBonusRef, levelMpBonusRef, playerBonusDmgRef,
    equipBonusesRef, skillBonusesRef, playerMaxHpRef,
    setClassState, setMasteryState, setShowClassSelect, setShowTrial, setQuestProgress,
    setStats, setStatPoints, setPlayerMaxHp,
    log,
  });

  /** DialogueFlags shared by every NPC-dialogue call site (boss first-kill flags,
   *  inventory, healer state, active trial). `crystalCount` varies per call site
   *  (sometimes computed against a not-yet-committed inventory), so it stays a param. */
  const buildDialogueFlags = useCallback((crystalCount: number) => ({
    fieldBoarFirstKill: bossStateRef.current.fieldBoar?.firstKillDone,
    caveChiefFirstKill: bossStateRef.current.caveChief?.firstKillDone,
    ruinsKeeperFirstKill: bossStateRef.current.ruinsKeeper?.firstKillDone,
    swampHorrorFirstKill: bossStateRef.current.swampHorror?.firstKillDone,
    mineGuardianFirstKill: bossStateRef.current.mineGuardian?.firstKillDone,
    passLordFirstKill: bossStateRef.current.passLord?.firstKillDone,
    iceKingFirstKill: bossStateRef.current.iceKing?.firstKillDone,
    crystalCount,
    inventory: inventoryRef.current,
    freeHealsLeft: loadHealState(),
    recoverableXp: getRecoverableXp(),
    healGoldCost: HEAL_COST,
    activeTrialId: activeTrial?.id,
    trialReady: activeTrial ? isTrialReady(questProgress, activeTrial.id) : false,
  }), [activeTrial, questProgress]);

  // ── Equipment ─────────────────────────────────────────────────────────────
  const { equipItem, unequipItem } = useEquipment({
    equipmentRef, equipBonusesRef, statsRef, levelHpBonusRef, levelMpBonusRef, playerBonusDmgRef,
    skillBonusesRef, playerMaxHpRef, playerHpRef, playerMaxMpRef, playerMpRef, playerLevelRef,
    setEquipment, setInventory, setEquipBonuses, setPlayerMaxHp, setPlayerHp,
    setPlayerMaxMp, setPlayerMp, setSelectedItem,
    log, showGateNotif,
  });

  // ── Shop, consumables, skill-point spending ─────────────────────────────────
  const { handleShopBuy, handleShopSell, handleUseItem, handleUpgradeSkill, handleQuickPotion } = useEconomy({
    playerGoldRef, inventoryRef, equipmentRef, equipBonusesRef, playerHpRef, playerMaxHpRef,
    playerMpRef, playerMaxMpRef,
    playerPosRef, phaseRef, skillProgressRef, skillPointsRef, skillBonusesRef, statsRef,
    levelHpBonusRef, levelMpBonusRef, playerBonusDmgRef,
    setPlayerGold, setInventory, setPlayerHp, setPlayerMp, setSelectedItem, setSkillProgress,
    setSkillPoints, setPlayerMaxHp, setPlayerMaxMp,
    log, spawnFloat,
  });

  // ── Combat: loot, XP/level-up, enemy & boss death, auto-attack loop, skills ─
  const { grantXp, useClassSkill } = useCombat({
    phase, skillsCd,
    activeEnemyIdRef, bossStateRef,
    currentLocationRef, enemiesRef, enemyAttackTimeout, equipBonusesRef, inventoryRef,
    levelHpBonusRef, levelMpBonusRef, phaseRef, playerAttackTimeout, playerBonusDmgRef, playerGoldRef,
    playerHpRef, playerLevelRef, playerMaxHpRef, playerMpRef, playerMaxMpRef,
    playerPosRef, playerXpRef, questProgressRef,
    shieldRef, playerStatusEffectsRef, skillBonusesRef, skillPointsRef, statPointsRef, statsRef,
    log, spawnFloat, onLevelUp: handleLevelUp,
    setActiveEnemyId, setBossAppearNotif, setBossRewardInfo,
    setBossState, setEnemies, setInventory,
    setLevelHpBonus, setLevelMpBonus, setLootNotif, setPhase, setPlayerBonusDmg, setPlayerGold, setPlayerHp,
    setPlayerLevel, setPlayerMaxHp, setPlayerMp, setPlayerMaxMp, setPlayerPos, setPlayerXp, setQuestProgress,
    setShieldActive, setPlayerStatusEffects, setShowBossVictory, setSkillPoints, setSkillsCd, setStatPoints, setXpToNext,
  });

  const { handleLocationTransition, movePlayer, handleWorldMapTravel } = useWorldMovement({
    phase, currentLocation, floatingNums,
    transitioningRef, playerAttackTimeout, enemyAttackTimeout, currentLocationRef, playerPosRef,
    enemiesRef, phaseRef, activeEnemyIdRef, playerHpRef, playerMaxHpRef, playerLevelRef, playerGoldRef,
    inventoryRef, questProgressRef, openedChestsRef, bossStateRef,
    setTransitioning, setCurrentLocation, setPlayerPos, setEnemies, setPhase, setActiveEnemyId,
    setShieldActive, setSkillsCd, setFloatingNums, setPlayerHp, setPlayerGold, setInventory,
    setLootNotif, setOpenedChests, setQuestDialogue, setNpcDialog, setShowWorldMap,
    log, showGateNotif, spawnFloat, openPanel, buildDialogueFlags,
  });

  // ── Quest action handler ──────────────────────────────────────────────────
  const { handleQuestAction, handleNpcInteract } = useQuestActions({
    inventoryRef, playerGoldRef, playerHpRef, playerMaxHpRef, playerMpRef, playerMaxMpRef,
    playerStatusEffectsRef, playerXpRef, questProgressRef, skillBonusesRef,
    setQuestDialogue, setNpcDialog, setShowCraft, setShowUpgrade, setShowTier, setShowEnchant, setShowTrial,
    setPlayerGold, setPlayerHp, setPlayerMp, setPlayerStatusEffects, setPlayerXp,
    setInventory, setLootNotif, setQuestProgress,
    log, grantXp, openPanel, buildDialogueFlags,
  });

  // ── CraftPanel: craft / learn ───────────────────────────────────────────────
  const {
    handleCraft, handleLearn,
    handleUpgradeInv, handleUpgradeEq,
    handleTierPromoteInv, handleTierPromoteEq,
    handleEnchantInv, handleEnchantEq,
    applyEquipmentUpdate,
  } = useItemActions({
    inventoryRef, playerGoldRef, equipmentRef, equipBonusesRef,
    statsRef, levelHpBonusRef, levelMpBonusRef, playerBonusDmgRef, skillBonusesRef,
    playerMaxHpRef, playerMaxMpRef, playerLevelRef, unlockedRecipes,
    setInventory, setPlayerGold, setEquipment, setEquipBonuses, setPlayerMaxHp, setPlayerMaxMp, setUnlockedRecipes,
    log, showGateNotif,
  });

  // ── Shop: buy ────────────────────────────────────────────────────────────

  // ── Reset flows: respawn-in-place after death, and full "New Game" wipe ────
  const { resetCurrentMap, resetCharacter } = useReset({
    activeEnemyIdRef, bossStateRef,
    currentLocationRef, enemiesRef, enemyAttackTimeout, equipBonusesRef, equipmentRef,
    inventoryRef, levelHpBonusRef, levelMpBonusRef, exploredTilesRef, phaseRef, playerAttackTimeout, playerBonusDmgRef,
    playerGoldRef, playerHpRef, playerMpRef, playerMaxMpRef, playerLevelRef, playerMaxHpRef, playerPosRef, playerXpRef,
    questProgressRef,
    shieldRef, playerStatusEffectsRef, statPointsRef, statsRef, xpToNextRef,
    setActiveEnemyId, setBossState,
    setCurrentLocation, setEnemies, setEquipBonuses, setEquipment, setFloatingNums,
    setInventory, setLevelHpBonus, setLevelMpBonus, setExploredTiles, setLogs, setLootNotif, setPhase,
    setPlayerBonusDmg, setPlayerGold, setPlayerHp, setPlayerMp, setPlayerLevel, setPlayerMaxHp, setPlayerMaxMp,
    setPlayerPos, setPlayerXp, setQuestProgress, setSelectedItem, setShieldActive, setPlayerStatusEffects, setShowBossVictory,
    setShowCharPanel, setShowInventory, setShowShop, setShowSkillPanel, setSkillPoints,
    setSkillProgress, setSkillsCd, setStatPoints, setStats, setUnlockedRecipes, setXpToNext,
    setClassState, setMasteryState, setShowClassSelect,
  });

  // ── Derived values (combat/stats/camera/nearby-npc) ─────────────────────────
  const {
    activeEnemy, livingEnemies, xpPct, potionCount, canUsePotion, cs,
    camCol, camRow, currentMap, currentNpcs, nearbyNpc,
  } = useGameView({
    activeEnemyId, enemies, playerXp, xpToNext, inventory, phase, playerHp, playerMaxHp,
    stats, levelHpBonus, levelMpBonus, playerBonusDmg, equipBonuses, skillProgress,
    playerPos, currentLocation, transitioning,
  });

  // ── Tile renderer — logic lives in game/ui/renderTile.tsx; this closure just
  //    supplies the current state (GameMap calls it as (gx, gy, tileType)). ───
  const renderTileContent = (gx: number, gy: number, tileType: number) =>
    renderTile({ gx, gy, tileType, playerPos, livingEnemies, activeEnemyId, currentLocation, currentNpcs, openedChests });

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="h-[100dvh] w-full max-w-[420px] mx-auto bg-background text-foreground flex flex-col relative select-none overflow-hidden">

      {/* ══ 1. STATUS HEADER ══ */}
      <CombatHUD
        shieldActive={shieldActive}
        playerLevel={playerLevel}
        playerHp={playerHp}
        playerMaxHp={playerMaxHp}
        playerMp={playerMp}
        playerMaxMp={playerMaxMp}
        playerStatusEffects={playerStatusEffects}
        activeEnemy={activeEnemy}
        bossIds={[
          BOSS_ID, FIELD_BOSS_ID, RUINS_BOSS_ID,
          SWAMP_BOSS_ID, MINE_BOSS_ID, PASS_BOSS_ID, ICE_BOSS_ID,
        ]}
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
        classPointsBadge={(classState?.classPoints ?? 0) + masteryState.points}
        showCharPanel={showCharPanel}
        showInventory={showInventory}
        showWorldMap={showWorldMap}
        showQuestPanel={showQuestPanel}
        showSkillPanel={showSkillPanel}
        showClassPanel={showClassPanel}
        onToggleCharPanel={() => togglePanel('char', showCharPanel)}
        onToggleInventory={() => togglePanel('inventory', showInventory)}
        onToggleWorldMap={() => togglePanel('worldMap', showWorldMap)}
        onToggleQuestPanel={() => togglePanel('quest', showQuestPanel)}
        onToggleSkillPanel={() => togglePanel('skill', showSkillPanel)}
        onToggleClassPanel={() => togglePanel('class', showClassPanel)}
      />

      {/* ══ 2. MAP ══ */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-2">
        <div className="relative" style={{ width: 'min(90vw, 60dvh, 360px)', height: 'min(90vw, 60dvh, 360px)' }}>

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
            enemies={enemies}
            bossId={BOSS_ID}
            floatingNums={floatingNums}
            bossAppearNotif={bossAppearNotif}
            transitioning={transitioning}
            currentLocation={currentLocation}
            locationEmoji={LOCATION_META[currentLocation].emoji}
            exploredTiles={exploredTiles}
            minimapVisible={minimapVisible}
            onToggleMinimap={() => setMinimapVisible(v => !v)}
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

          {questDialogue && (
            <QuestDialogueOverlay
              dialogue={questDialogue}
              onClose={() => setQuestDialogue(null)}
              onAction={handleQuestAction}
            />
          )}

          {/* Loot notification toast */}
          {lootNotif && (
            <div className="absolute top-2 inset-x-2 z-[65] flex items-center gap-2 bg-[#0b1f0e]/95 border border-green-700/70 rounded px-3 py-2 shadow-lg pointer-events-none animate-in fade-in duration-200">
              <span className="text-base shrink-0">📦</span>
              <span className="text-[12px] font-bold text-green-300 leading-tight">Получен предмет: {lootNotif}</span>
            </div>
          )}

          {/* Level-gate blocked toast (equip, tier, location transition) */}
          {gateNotif && (
            <div className="absolute top-2 inset-x-2 z-[65] flex items-center gap-2 bg-[#2a0e0e]/95 border border-red-700/70 rounded px-3 py-2 shadow-lg pointer-events-none animate-in fade-in duration-200">
              <span className="text-base shrink-0">⛔</span>
              <span className="text-[12px] font-bold text-red-300 leading-tight">{gateNotif}</span>
            </div>
          )}

          {/* Boss Victory Panel */}
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
              playerMp={playerMp}
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

          {/* ══ CRAFT PANEL OVERLAY (z-60) ═══════════════════════════════════════
              Blacksmith crafting — recipe tabs, craft / learn recipe.
          ═══════════════════════════════════════════════════════════════════ */}
          {showCraft && (
            <CraftPanel
              inventory={inventory}
              questProgress={questProgress}
              unlockedRecipes={unlockedRecipes}
              onCraft={handleCraft}
              onLearn={handleLearn}
              onClose={() => setShowCraft(false)}
            />
          )}

          {/* ══ UPGRADE PANEL OVERLAY (z-60) ═════════════════════════════════════
              Equipment upgrade +1..+5 — success chance, protection scrolls.
          ═══════════════════════════════════════════════════════════════════ */}
          {showUpgrade && (
            <UpgradePanel
              inventory={inventory}
              equipment={equipment}
              playerGold={playerGold}
              onUpgradeInventory={handleUpgradeInv}
              onUpgradeEquipped={handleUpgradeEq}
              onClose={() => setShowUpgrade(false)}
            />
          )}

          {/* ══ TIER PROMOTE PANEL OVERLAY (z-60) ════════════════════════════════
              Equipment tier promotion T1→T6.
          ═══════════════════════════════════════════════════════════════════ */}
          {showTier && (
            <TierPromotePanel
              inventory={inventory}
              equipment={equipment}
              playerGold={playerGold}
              playerLevel={playerLevel}
              onPromoteInventory={handleTierPromoteInv}
              onPromoteEquipped={handleTierPromoteEq}
              onClose={() => setShowTier(false)}
            />
          )}

          {/* ══ ENCHANT PANEL OVERLAY (z-60) ═════════════════════════════════════
              Enchantment — one per item, new replaces old. Preserves affixes/tier/+N.
          ═══════════════════════════════════════════════════════════════════ */}
          {showEnchant && (
            <EnchantPanel
              inventory={inventory}
              equipment={equipment}
              playerGold={playerGold}
              onEnchantInventory={handleEnchantInv}
              onEnchantEquipped={handleEnchantEq}
              onClose={() => setShowEnchant(false)}
            />
          )}

          {/* ══ CLASS SELECT OVERLAY (z-80) ══════════════════════════════════════
              Выбор архетипа — на новом персонаже (нет sv.classState) или после
              полного сброса ("Новая игра").
          ═══════════════════════════════════════════════════════════════════ */}
          {showClassSelect && (
            <ClassSelectPanel onSelect={handlePickArchetype} />
          )}

          {/* ══ CLASS PANEL OVERLAY (z-70) ═══════════════════════════════════════
              Текущий путь, очки класса/мастерства, открытые навыки, гейты
              профессии (20 ур.) / специализации (40 ур.).
          ═══════════════════════════════════════════════════════════════════ */}
          {showClassPanel && classState && (
            <ClassPanel
              classState={classState}
              masteryState={masteryState}
              level={playerLevel}
              onClose={() => setShowClassPanel(false)}
              onOpenTalents={() => {
                setShowClassPanel(false);
                setShowTalents(true);
              }}
              onOpenMastery={() => {
                setShowClassPanel(false);
                setShowMastery(true);
              }}
              onChooseProfession={handleChooseProfession}
              onChooseSpec={handleChooseSpecialization}
            />
          )}

          {/* ══ CLASS TALENT TREE OVERLAY (z-75) ═════════════════════════════════
              Дерево талантов текущего пути (архетип → профессия → спек),
              трата classPoints.
          ═══════════════════════════════════════════════════════════════════ */}
          {showTalents && classState && (
            <TalentPanel
              classState={classState}
              onChange={setClassState}
              onClose={() => setShowTalents(false)}
            />
          )}

          {/* ══ TRIAL OVERLAY (z-75) ══════════════════════════════════════════════
              Испытание 20/40 ур. — сдача квеста + выбор профессии/специализации.
          ═══════════════════════════════════════════════════════════════════ */}
          {showTrial && classState && activeTrial && (
            <TrialPanel
              trial={activeTrial}
              progress={questProgress}
              canChoose={isTrialReady(questProgress, activeTrial.id)}
              onClose={() => setShowTrial(false)}
              onChoose={handleTrialChoice}
            />
          )}

          {/* ══ MASTERY CONSTELLATION OVERLAY (z-75) ═════════════════════════════
              255-узловое созвездие (15 веток × 17 узлов), трата masteryPoints.
          ═══════════════════════════════════════════════════════════════════ */}
          {showMastery && (
            <MasteryPanel
              masteryState={masteryState}
              level={playerLevel}
              onChange={setMasteryState}
              onClose={() => setShowMastery(false)}
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
              playerLevel={playerLevel}
              onTravel={handleWorldMapTravel}
              onClose={() => setShowWorldMap(false)}
            />
          )}

        </div>
      </div>

      {/* ══ INTERACT BUTTON — shown when adjacent to an NPC in explore mode ══ */}
      <div className="shrink-0 h-[40px] flex items-center justify-center border-t border-tile-border/30 bg-[#09090e]">
        {nearbyNpc ? (
          <button
            onClick={() => handleNpcInteract(nearbyNpc)}
            className="flex items-center gap-2 px-5 py-[5px] rounded-lg border border-primary/50 bg-primary/10 text-primary font-bold text-[12px] active:scale-95 transition-all shadow-[0_0_8px_rgba(200,150,42,0.12)]"
          >
            💬 Говорить · {nearbyNpc.emoji} {nearbyNpc.name}
          </button>
        ) : null}
      </div>

      {/* ══ CLASS SKILL BAR (combat only) ══ */}
      {phase === 'combat' && (
        <ClassSkillBar
          skills={classSkills}
          skillsCd={skillsCd}
          playerMp={playerMp}
          resourceLabel={classState ? pathResourceLabel(classState) : 'MP'}
          onUse={(sk) => useClassSkill(sk)}
        />
      )}

      {/* ══ 3-4. MOVEMENT + POTION ══ */}
      <ControlsPanel
        phase={phase}
        movePlayer={movePlayer}
        onUsePotion={handleQuickPotion}
        potionCount={potionCount}
        canUsePotion={canUsePotion}
      />

      {/* ══ 5. COMBAT LOG ══ */}
      <CombatLog logs={logs} />

    </div>
  );
}