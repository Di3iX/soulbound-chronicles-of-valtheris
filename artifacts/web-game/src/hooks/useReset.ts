import { useCallback } from 'react';
import type { MutableRefObject, Dispatch, SetStateAction } from 'react';
import {
  Phase, Enemy, LocationId, KillReward,
  xpRequired, makeLocationEnemies,
} from '../combat';
import {
  INITIAL_HP, INITIAL_MP, INITIAL_BASE_STATS, BaseStats,
} from '../stats';
import { Item } from '../inventory';
import { Equipment, EquipBonuses, EMPTY_EQUIPMENT, ZERO_EQUIP_BONUSES } from '../equipment';
import { LOCATION_SPAWN, ExploredTiles, makeInitialExploredTiles } from '../world/locations';
import { QuestProgress } from '../quests/quests';
import { SkillProgress } from '../skills/skillTree';
import { BossState, INITIAL_BOSS_STATE } from '../boss/boss';
import { FloatingNum, LogEntry } from '../types/ui';
import { clearSave } from '../save';

const INITIAL_PLAYER_LVL = 1;

export interface ResetCtx {
  // Refs
  activeEnemyIdRef: MutableRefObject<number | null>;
  bossDefeatedThisVisitRef: MutableRefObject<boolean>;
  bossSpawnedThisVisitRef: MutableRefObject<boolean>;
  bossStateRef: MutableRefObject<BossState>;
  currentLocationRef: MutableRefObject<LocationId>;
  enemiesRef: MutableRefObject<Enemy[]>;
  enemyAttackTimeout: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  equipBonusesRef: MutableRefObject<EquipBonuses>;
  equipmentRef: MutableRefObject<Equipment>;
  inventoryRef: MutableRefObject<Item[]>;
  levelHpBonusRef: MutableRefObject<number>;
  levelMpBonusRef: MutableRefObject<number>;
  exploredTilesRef: MutableRefObject<ExploredTiles>;
  phaseRef: MutableRefObject<Phase>;
  playerAttackTimeout: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  playerBonusDmgRef: MutableRefObject<number>;
  playerGoldRef: MutableRefObject<number>;
  playerHpRef: MutableRefObject<number>;
  playerMpRef: MutableRefObject<number>;
  playerMaxMpRef: MutableRefObject<number>;
  playerLevelRef: MutableRefObject<number>;
  playerMaxHpRef: MutableRefObject<number>;
  playerPosRef: MutableRefObject<{ x: number; y: number }>;
  playerXpRef: MutableRefObject<number>;
  shieldRef: MutableRefObject<boolean>;
  statPointsRef: MutableRefObject<number>;
  statsRef: MutableRefObject<BaseStats>;
  xpToNextRef: MutableRefObject<number>;

  // Setters
  setActiveEnemyId: (v: number | null) => void;
  setBossDefeatedThisVisit: (v: boolean) => void;
  setBossSpawnedThisVisit: (v: boolean) => void;
  setBossState: (v: BossState) => void;
  setCurrentLocation: (v: LocationId) => void;
  setEnemies: Dispatch<SetStateAction<Enemy[]>>;
  setEquipBonuses: (v: EquipBonuses) => void;
  setEquipment: (v: Equipment) => void;
  setFloatingNums: (v: FloatingNum[]) => void;
  setInventory: Dispatch<SetStateAction<Item[]>>;
  setLastKillReward: (v: KillReward | null) => void;
  setLevelHpBonus: (v: number) => void;
  setLevelMpBonus: (v: number) => void;
  setExploredTiles: (v: ExploredTiles) => void;
  setLogs: (v: LogEntry[]) => void;
  setLootNotif: (v: string | null) => void;
  setPhase: (v: Phase) => void;
  setPlayerBonusDmg: (v: number) => void;
  setPlayerGold: (v: number) => void;
  setPlayerHp: (v: number) => void;
  setPlayerMp: (v: number) => void;
  setPlayerLevel: (v: number) => void;
  setPlayerMaxHp: (v: number) => void;
  setPlayerMaxMp: (v: number) => void;
  setPlayerPos: (v: { x: number; y: number }) => void;
  setPlayerXp: (v: number) => void;
  setSelectedItem: (v: Item | null) => void;
  setShieldActive: (v: boolean) => void;
  setShowBossVictory: (v: boolean) => void;
  setShowCharPanel: (v: boolean) => void;
  setShowInventory: (v: boolean) => void;
  setShowShop: (v: boolean) => void;
  setShowSkillPanel: (v: boolean) => void;
  setSkillPoints: (v: number) => void;
  setSkillProgress: (v: SkillProgress) => void;
  setSkillsCd: Dispatch<SetStateAction<Record<number, number>>>;
  setStatPoints: (v: number) => void;
  setStats: (v: BaseStats) => void;
  setXpToNext: (v: number) => void;
}

/**
 * Two respawn/reset flows, moved verbatim out of App.tsx:
 *  - `resetCurrentMap`: after death, respawn in the current location with
 *    full HP — character progress (level, XP, gear, gold) is kept.
 *  - `resetCharacter`: full wipe — clears the save and returns to Lv.1 in
 *    the starting village. Used by the "New Game" button.
 */
export function useReset(ctx: ResetCtx) {
  const {
    activeEnemyIdRef, bossDefeatedThisVisitRef, bossSpawnedThisVisitRef, bossStateRef,
    currentLocationRef, enemiesRef, enemyAttackTimeout, equipBonusesRef, equipmentRef,
    inventoryRef, levelHpBonusRef, levelMpBonusRef, exploredTilesRef, phaseRef, playerAttackTimeout, playerBonusDmgRef,
    playerGoldRef, playerHpRef, playerMpRef, playerMaxMpRef, playerLevelRef, playerMaxHpRef, playerPosRef, playerXpRef,
    shieldRef, statPointsRef, statsRef, xpToNextRef,
    setActiveEnemyId, setBossDefeatedThisVisit, setBossSpawnedThisVisit, setBossState,
    setCurrentLocation, setEnemies, setEquipBonuses, setEquipment, setFloatingNums,
    setInventory, setLastKillReward, setLevelHpBonus, setLevelMpBonus, setExploredTiles, setLogs, setLootNotif, setPhase,
    setPlayerBonusDmg, setPlayerGold, setPlayerHp, setPlayerMp, setPlayerLevel, setPlayerMaxHp, setPlayerMaxMp,
    setPlayerPos, setPlayerXp, setSelectedItem, setShieldActive, setShowBossVictory,
    setShowCharPanel, setShowInventory, setShowShop, setShowSkillPanel, setSkillPoints,
    setSkillProgress, setSkillsCd, setStatPoints, setStats, setXpToNext,
  } = ctx;

  // ── Reset current map (respawn in current location — keep all character progress) ──
  const resetCurrentMap = useCallback(() => {
    if (playerAttackTimeout.current) { clearTimeout(playerAttackTimeout.current); playerAttackTimeout.current = null; }
    if (enemyAttackTimeout.current)  { clearTimeout(enemyAttackTimeout.current);  enemyAttackTimeout.current  = null; }

    const loc   = currentLocationRef.current;
    const fresh = makeLocationEnemies(loc);
    const spawn = LOCATION_SPAWN[loc];

    // Max HP/MP is based on current level, stats and equipment — nothing changes here
    const fullHp = playerMaxHpRef.current;
    const fullMp = playerMaxMpRef.current;

    // Run-level state
    phaseRef.current         = 'explore';
    playerHpRef.current      = fullHp;
    playerMpRef.current      = fullMp;
    shieldRef.current        = false;
    playerPosRef.current     = spawn;
    enemiesRef.current       = fresh;
    activeEnemyIdRef.current = null;

    setPhase('explore');
    setPlayerPos(spawn);
    setPlayerHp(fullHp);
    setPlayerMp(fullMp);
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
    // level, XP, statPoints, stats, playerBonusDmg, levelHpBonus, levelMpBonus,
    // gold, inventory, equipment, equipBonuses, playerMaxHp, playerMaxMp
  }, []);

  // ── Full reset — wipes save, returns to Lv.1 in city ("Играть снова") ──────
  const resetCharacter = useCallback(() => {
    if (playerAttackTimeout.current) { clearTimeout(playerAttackTimeout.current); playerAttackTimeout.current = null; }
    if (enemyAttackTimeout.current)  { clearTimeout(enemyAttackTimeout.current);  enemyAttackTimeout.current  = null; }

    clearSave();

    const initMaxHp = INITIAL_HP + INITIAL_BASE_STATS.vitality * 10;
    const initMaxMp = INITIAL_MP;

    // Reset refs immediately so any in-flight callbacks see correct values
    playerHpRef.current        = initMaxHp;
    playerMaxHpRef.current     = initMaxHp;
    playerMpRef.current        = initMaxMp;
    playerMaxMpRef.current     = initMaxMp;
    phaseRef.current           = 'explore';
    shieldRef.current          = false;
    playerPosRef.current       = LOCATION_SPAWN.village;
    enemiesRef.current         = [];
    activeEnemyIdRef.current   = null;
    playerBonusDmgRef.current  = 0;
    levelHpBonusRef.current    = 0;
    levelMpBonusRef.current    = 0;
    exploredTilesRef.current   = makeInitialExploredTiles();
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
    setPlayerMp(initMaxMp);
    setPlayerMaxMp(initMaxMp);
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
    setLevelMpBonus(0);
    setExploredTiles(makeInitialExploredTiles());
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


  return { resetCurrentMap, resetCharacter };
}
