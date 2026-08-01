import { useCallback, useEffect } from 'react';
import type { MutableRefObject, Dispatch, SetStateAction } from 'react';
import {
  Enemy, KillReward, LocationId, Phase, SKILLS,
  REWARD_TABLE, applyXpGain, RESPAWN_MS, reviveEnemy,
  EnemyRarity, ENEMY_RARITY_DEFS,
  StatusEffect, STATUS_EFFECT_DEFS, ENEMY_EFFECT_ON_HIT, SKILL_EFFECT_ON_HIT,
  addStatusEffect, tickStatusEffects, hasStatusEffect, slowMultiplier,
  DamageType, applyResistance, effectChanceMultiplier, DAMAGE_TYPE_LABEL,
} from '../combat';
import { Item, DROP_TABLES, makeItem } from '../inventory';
import { EquipBonuses } from '../equipment';
import { BaseStats, computeStats } from '../stats';
import { SkillBonuses } from '../skills/skillTree';
import { QuestProgress, trackKillForQuests } from '../quests/quests';
import {
  BOSS_ID, FIELD_BOSS_ID, RUINS_BOSS_ID, SWAMP_BOSS_ID, MINE_BOSS_ID,
  CAVE_BOSS_DEF, FIELD_BOSS_DEF, RUINS_BOSS_DEF, SWAMP_BOSS_DEF, MINE_BOSS_DEF,
  BOSS_REWARD, FIELD_BOSS_REWARD, RUINS_BOSS_REWARD, SWAMP_BOSS_REWARD, MINE_BOSS_REWARD,
  BOSS_RARE_CHANCE, BOSS_RARE_LOOT, BOSS_COMMON_LOOT,
  BOSS_RESPAWN_MS, FIELD_BOSS_RESPAWN_MS, RUINS_BOSS_RESPAWN_MS, SWAMP_BOSS_RESPAWN_MS, MINE_BOSS_RESPAWN_MS,
  BossState, BossRewardInfo, makeBossTrophy, makeFieldBossTrophy, makeRuinsBossTrophy, makeSwampBossTrophy, makeMineBossTrophy,
  ALL_BOSS_IDS,
} from '../boss/boss';
import { FloatingNum } from '../types/ui';

export interface CombatCtx {
  // ── Reactive state (read each render; needed for effect deps / checks) ────
  phase: Phase;
  skillsCd: Record<number, number>;

  // ── Refs (mutable, stable identity — safe to read/write directly) ─────────
  activeEnemyIdRef:  MutableRefObject<number | null>;
  bossStateRef:      MutableRefObject<BossState>;
  currentLocationRef: MutableRefObject<LocationId>;
  enemiesRef:        MutableRefObject<Enemy[]>;
  enemyAttackTimeout: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  equipBonusesRef:   MutableRefObject<EquipBonuses>;
  inventoryRef:      MutableRefObject<Item[]>;
  levelHpBonusRef:   MutableRefObject<number>;
  levelMpBonusRef:   MutableRefObject<number>;
  phaseRef:          MutableRefObject<Phase>;
  playerAttackTimeout: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  playerBonusDmgRef: MutableRefObject<number>;
  playerGoldRef:     MutableRefObject<number>;
  playerHpRef:       MutableRefObject<number>;
  playerLevelRef:    MutableRefObject<number>;
  playerMaxHpRef:    MutableRefObject<number>;
  playerMpRef:       MutableRefObject<number>;
  playerMaxMpRef:    MutableRefObject<number>;
  playerPosRef:      MutableRefObject<{ x: number; y: number }>;
  playerXpRef:       MutableRefObject<number>;
  questProgressRef:  MutableRefObject<QuestProgress>;
  shieldRef:         MutableRefObject<boolean>;
  playerStatusEffectsRef: MutableRefObject<StatusEffect[]>;
  skillBonusesRef:   MutableRefObject<SkillBonuses>;
  skillPointsRef:    MutableRefObject<number>;
  statPointsRef:     MutableRefObject<number>;
  statsRef:          MutableRefObject<BaseStats>;

  // ── Shared functions (already-memoized, stable across renders) ────────────
  log: (msg: string) => void;
  spawnFloat: (value: string, col: number, row: number, type: FloatingNum['type']) => void;

  // ── Setters ────────────────────────────────────────────────────────────────
  setActiveEnemyId: (v: number | null) => void;
  setBossAppearNotif: (v: boolean) => void;
  setBossRewardInfo: (v: BossRewardInfo) => void;
  setBossState: (v: BossState) => void;
  setEnemies: Dispatch<SetStateAction<Enemy[]>>;
  setInventory: Dispatch<SetStateAction<Item[]>>;
  setLastKillReward: (v: KillReward) => void;
  setLevelHpBonus: (v: number) => void;
  setLevelMpBonus: (v: number) => void;
  setLootNotif: (v: string | null) => void;
  setPhase: (v: Phase) => void;
  setPlayerBonusDmg: (v: number) => void;
  setPlayerGold: (v: number) => void;
  setPlayerHp: (v: number) => void;
  setPlayerLevel: (v: number) => void;
  setPlayerMaxHp: (v: number) => void;
  setPlayerMp: (v: number) => void;
  setPlayerMaxMp: (v: number) => void;
  setPlayerPos: (v: { x: number; y: number }) => void;
  setPlayerXp: (v: number) => void;
  setQuestProgress: (v: QuestProgress) => void;
  setShieldActive: (v: boolean) => void;
  setPlayerStatusEffects: (v: StatusEffect[]) => void;
  setShowBossVictory: (v: boolean) => void;
  setSkillPoints: Dispatch<SetStateAction<number>>;
  setSkillsCd: Dispatch<SetStateAction<Record<number, number>>>;
  setStatPoints: Dispatch<SetStateAction<number>>;
  setXpToNext: (v: number) => void;
}

/**
 * All combat rules: loot, XP/level-up granting, enemy/boss death handling,
 * the auto-attack loop (player + enemy), skill cooldown ticking, and skill
 * use. Everything here was moved verbatim out of App.tsx — same refs, same
 * setters, same logic, just accessed through `ctx` instead of closures.
 *
 * Only `grantXp` and `useSkill` are returned: everything else here is only
 * ever called from within this hook. `grantXp` is also used by App.tsx's
 * quest-completion handler (quests grant XP too), which is why it's exposed.
 */
export function useCombat(ctx: CombatCtx) {
  const {
    phase, skillsCd,
    activeEnemyIdRef, bossStateRef,
    currentLocationRef, enemiesRef, enemyAttackTimeout, equipBonusesRef, inventoryRef,
    levelHpBonusRef, levelMpBonusRef, phaseRef, playerAttackTimeout, playerBonusDmgRef, playerGoldRef,
    playerHpRef, playerLevelRef, playerMaxHpRef, playerMpRef, playerMaxMpRef,
    playerPosRef, playerXpRef, questProgressRef,
    shieldRef, playerStatusEffectsRef, skillBonusesRef, skillPointsRef, statPointsRef, statsRef,
    log, spawnFloat,
    setActiveEnemyId, setBossAppearNotif, setBossRewardInfo,
    setBossState, setEnemies, setInventory, setLastKillReward,
    setLevelHpBonus, setLevelMpBonus, setLootNotif, setPhase, setPlayerBonusDmg, setPlayerGold, setPlayerHp,
    setPlayerLevel, setPlayerMaxHp, setPlayerMp, setPlayerMaxMp, setPlayerPos, setPlayerXp, setQuestProgress,
    setShieldActive, setPlayerStatusEffects, setShowBossVictory, setSkillPoints, setSkillsCd, setStatPoints, setXpToNext,
  } = ctx;

  // ── Loot drop (called from applyRewards) ──────────────────────────────────
  const rollLoot = useCallback((enemyName: string, itemChanceBonus = 0, guaranteed = false): Item | undefined => {
    const table = DROP_TABLES[enemyName];
    if (!table) return undefined;
    if (!guaranteed && Math.random() >= table.chance + itemChanceBonus / 100) return undefined;
    const key = table.pool[Math.floor(Math.random() * table.pool.length)];
    const item = makeItem(key);
    setInventory(prev => [...prev, item]);
    setLootNotif(item.name);
    log(`📦 Получен лут: ${item.name}!`);
    setTimeout(() => setLootNotif(null), 2500);
    return item;
  }, [log]);

  // ── Progression ───────────────────────────────────────────────────────────
  // ── Grant XP + resolve any level-ups (single source of truth) ──────────────
  // Used by applyRewards, handleBossDeath, and the quest-completion handler —
  // previously each of the three duplicated this ~20-line calculation inline.
  const grantXp = useCallback((xpGained: number) => {
    const result = applyXpGain(
      playerXpRef.current, playerLevelRef.current,
      playerBonusDmgRef.current, levelHpBonusRef.current, levelMpBonusRef.current,
      xpGained,
    );

    const newStats = computeStats({
      base: statsRef.current, levelHpBonus: result.levelHpBonus, levelMpBonus: result.levelMpBonus,
      bonusDmg: result.bonusDmg, equip: equipBonusesRef.current,
      skills: skillBonusesRef.current,
    });
    const newMaxHp = newStats.maxHp;
    const newMaxMp = newStats.maxMp;

    playerLevelRef.current    = result.level;
    playerBonusDmgRef.current = result.bonusDmg;
    levelHpBonusRef.current   = result.levelHpBonus;
    levelMpBonusRef.current   = result.levelMpBonus;
    playerMaxHpRef.current    = newMaxHp;
    playerMaxMpRef.current    = newMaxMp;
    playerXpRef.current       = result.xp;

    setPlayerXp(result.xp); setXpToNext(result.xpToNext); setPlayerLevel(result.level);
    setPlayerBonusDmg(result.bonusDmg); setLevelHpBonus(result.levelHpBonus); setPlayerMaxHp(newMaxHp);
    setLevelMpBonus(result.levelMpBonus); setPlayerMaxMp(newMaxMp);

    if (result.statPointsGained > 0) {
      statPointsRef.current += result.statPointsGained;
      setStatPoints(p => p + result.statPointsGained);
      log(`🎯 +${result.statPointsGained} очка характеристик!`);
    }
    if (result.skillPointsGained > 0) {
      skillPointsRef.current += result.skillPointsGained;
      setSkillPoints(p => p + result.skillPointsGained);
      log(`⭐ +${result.skillPointsGained} очко умений!`);
    }
    if (result.leveledUp) {
      playerHpRef.current = newMaxHp; setPlayerHp(newMaxHp);
      playerMpRef.current = newMaxMp; setPlayerMp(newMaxMp);
      log(`🌟 Новый уровень ${result.level}! HP и MP восстановлены!`);
    }

    return result;
  }, [log]);

  const applyRewards = useCallback((enemyName: string, rarity: EnemyRarity): KillReward => {
    const reward = REWARD_TABLE[enemyName] ?? { xp: 10, goldMin: 1, goldMax: 3 };
    const rarityDef = ENEMY_RARITY_DEFS[rarity];

    const baseGold = Math.floor(Math.random() * (reward.goldMax - reward.goldMin + 1)) + reward.goldMin;
    const goldGained = Math.round(baseGold * rarityDef.goldMult);
    playerGoldRef.current += goldGained;
    setPlayerGold(playerGoldRef.current);

    const xpGained = Math.floor(reward.xp * rarityDef.xpMult * (1 + skillBonusesRef.current.xpBonusPct / 100));

    if (rarity !== 'common') {
      log(`${rarityDef.emoji} ${rarityDef.label} противник повержен!`);
    }
    log(`💰 Получено ${goldGained} золота!`);
    log(`✨ Получено ${xpGained} опыта!`);

    const { leveledUp, level: newLevel, statPointsGained } = grantXp(xpGained);

    const droppedItem = rollLoot(enemyName, rarityDef.itemChanceBonus, rarityDef.guaranteedDrop);
    return { xp: xpGained, gold: goldGained, leveledUp, newLevel, statPtsGained: statPointsGained, droppedItem };
  }, [log, rollLoot, grantXp]);

  // ── Cave Boss: spawn after all normal enemies die ─────────────────────────
  const spawnCaveBoss = useCallback(() => {
    const bossEnemy: Enemy = { ...CAVE_BOSS_DEF, id: BOSS_ID };
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

  // ── Field Mini-Boss: Огромный Кабан ───────────────────────────────────────
  const spawnFieldBoss = useCallback(() => {
    if (enemiesRef.current.some(e => e.id === FIELD_BOSS_ID)) return;
    const bossEnemy: Enemy = { ...FIELD_BOSS_DEF, id: FIELD_BOSS_ID };
    enemiesRef.current = [...enemiesRef.current, bossEnemy];
    setEnemies(prev => [...prev, bossEnemy]);
    phaseRef.current = 'explore';
    setPhase('explore');
    setActiveEnemyId(null);
    activeEnemyIdRef.current = null;
    setBossAppearNotif(true);
    setTimeout(() => setBossAppearNotif(false), 3500);
    log('⚔️ Появился мини-босс: Огромный Кабан!');
  }, [log]);

  // ── Ruins Boss: Хранитель склепа ───────────────────────────────────────────
  const spawnRuinsBoss = useCallback(() => {
    if (enemiesRef.current.some(e => e.id === RUINS_BOSS_ID)) return;
    const bossEnemy: Enemy = { ...RUINS_BOSS_DEF, id: RUINS_BOSS_ID };
    enemiesRef.current = [...enemiesRef.current, bossEnemy];
    setEnemies(prev => [...prev, bossEnemy]);
    phaseRef.current = 'explore';
    setPhase('explore');
    setActiveEnemyId(null);
    activeEnemyIdRef.current = null;
    setBossAppearNotif(true);
    setTimeout(() => setBossAppearNotif(false), 3500);
    log('⚔️ Появился Босс: Хранитель склепа!');
  }, [log]);

  const spawnSwampBoss = useCallback(() => {
    if (enemiesRef.current.some(e => e.id === SWAMP_BOSS_ID)) return;
    const bossEnemy: Enemy = { ...SWAMP_BOSS_DEF, id: SWAMP_BOSS_ID };
    enemiesRef.current = [...enemiesRef.current, bossEnemy];
    setEnemies(prev => [...prev, bossEnemy]);
    phaseRef.current = 'explore';
    setPhase('explore');
    setActiveEnemyId(null);
    activeEnemyIdRef.current = null;
    setBossAppearNotif(true);
    setTimeout(() => setBossAppearNotif(false), 3500);
    log('⚔️ Появился Босс: Трясинный ужас!');
  }, [log]);

  const spawnMineBoss = useCallback(() => {
    if (enemiesRef.current.some(e => e.id === MINE_BOSS_ID)) return;
    const bossEnemy: Enemy = { ...MINE_BOSS_DEF, id: MINE_BOSS_ID };
    enemiesRef.current = [...enemiesRef.current, bossEnemy];
    setEnemies(prev => [...prev, bossEnemy]);
    phaseRef.current = 'explore';
    setPhase('explore');
    setActiveEnemyId(null);
    activeEnemyIdRef.current = null;
    setBossAppearNotif(true);
    setTimeout(() => setBossAppearNotif(false), 3500);
    log('⚔️ Появился Босс: Каменный страж!');
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

    const { leveledUp, level: newLevel } = grantXp(xpGained);

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
      log('🏛️ Руины разблокированы! Путь на восток открыт.');
    }

    // Start the respawn timer — boss reappears in BOSS_RESPAWN_MS
    const newBS: BossState = {
      ...bossStateRef.current,
      caveChief: { firstKillDone: true, deadAt: Date.now() },
    };
    bossStateRef.current = newBS;
    setBossState(newBS);

    // Show boss victory overlay
    setActiveEnemyId(null);
    activeEnemyIdRef.current = null;
    setBossRewardInfo({ xp: xpGained, gold: BOSS_REWARD.gold, dropItem, trophyItem, leveledUp, newLevel, wasFirstKill });
    setShowBossVictory(true);

    {
      const { progress: qp, logs: qLogs } = trackKillForQuests(questProgressRef.current, 'Главарь гоблинов');
      if (qLogs.length) {
        questProgressRef.current = qp;
        setQuestProgress(qp);
        for (const msg of qLogs) log(msg);
      }
    }
    if (wasFirstKill) {
      log('🌑 У главаря в мешке — чёрные осколки и карта тропы глубже в руины…');
      log('📜 Вернись к старосте — ему нужно это услышать.');
    }
  }, [log, grantXp]);

  // ── Field Mini-Boss: handle kill + rewards ────────────────────────────────
  const handleFieldBossDeath = useCallback(() => {
    log('🐗 Огромный Кабан повержен!');

    playerGoldRef.current += FIELD_BOSS_REWARD.gold;
    setPlayerGold(playerGoldRef.current);
    log(`💰 Получено ${FIELD_BOSS_REWARD.gold} золота!`);

    const xpGained = Math.floor(FIELD_BOSS_REWARD.xp * (1 + skillBonusesRef.current.xpBonusPct / 100));
    log(`✨ Получено ${xpGained} опыта!`);

    const { leveledUp, level: newLevel } = grantXp(xpGained);

    const isRare    = Math.random() < BOSS_RARE_CHANCE;
    const dropPool  = isRare ? [...BOSS_RARE_LOOT] : [...BOSS_COMMON_LOOT];
    const dropKey   = dropPool[Math.floor(Math.random() * dropPool.length)];
    const dropItem  = makeItem(dropKey);
    inventoryRef.current = [...inventoryRef.current, dropItem];
    setInventory(prev => [...prev, dropItem]);
    setLootNotif(dropItem.name);
    setTimeout(() => setLootNotif(null), 2500);
    log(`📦 Получен лут: ${dropItem.name}!`);

    const fieldState = bossStateRef.current.fieldBoar ?? { firstKillDone: false };
    const wasFirstKill = !fieldState.firstKillDone;
    let trophyItem: Item | undefined;
    if (wasFirstKill) {
      trophyItem = makeFieldBossTrophy();
      inventoryRef.current = [...inventoryRef.current, trophyItem];
      setInventory(prev => [...prev, trophyItem!]);
      log('🏆 Получен трофей: Клык огромного кабана!');
    }

    const newBS: BossState = {
      ...bossStateRef.current,
      fieldBoar: { firstKillDone: true, deadAt: Date.now() },
    };
    bossStateRef.current = newBS;
    setBossState(newBS);

    setActiveEnemyId(null);
    activeEnemyIdRef.current = null;
    setBossRewardInfo({ xp: xpGained, gold: FIELD_BOSS_REWARD.gold, dropItem, trophyItem, leveledUp, newLevel, wasFirstKill });
    setShowBossVictory(true);

    // Story quest: Чёрные кристаллы
    {
      const { progress: qp, logs: qLogs } = trackKillForQuests(questProgressRef.current, 'Огромный Кабан');
      if (qLogs.length) {
        questProgressRef.current = qp;
        setQuestProgress(qp);
        for (const msg of qLogs) log(msg);
      }
    }
    if (wasFirstKill) {
      log('🌑 На земле рядом с тушей мерцают чёрные осколки…');
      log('📜 Стоит рассказать об этом старосте в деревне.');
    }
  }, [log, grantXp]);

  // ── Ruins Boss: handle kill + rewards ────────────────────────────────────
  const handleRuinsBossDeath = useCallback(() => {
    log('⚰️ Хранитель склепа повержен!');

    playerGoldRef.current += RUINS_BOSS_REWARD.gold;
    setPlayerGold(playerGoldRef.current);
    log(`💰 Получено ${RUINS_BOSS_REWARD.gold} золота!`);

    const xpGained = Math.floor(RUINS_BOSS_REWARD.xp * (1 + skillBonusesRef.current.xpBonusPct / 100));
    log(`✨ Получено ${xpGained} опыта!`);
    const { leveledUp, level: newLevel } = grantXp(xpGained);

    const isRare   = Math.random() < BOSS_RARE_CHANCE;
    const dropPool = isRare ? [...BOSS_RARE_LOOT] : [...BOSS_COMMON_LOOT];
    const dropKey  = dropPool[Math.floor(Math.random() * dropPool.length)];
    const dropItem = makeItem(dropKey);
    inventoryRef.current = [...inventoryRef.current, dropItem];
    setInventory(prev => [...prev, dropItem]);
    setLootNotif(dropItem.name);
    setTimeout(() => setLootNotif(null), 2500);
    log(`📦 Получен лут: ${dropItem.name}!`);

    const rk = bossStateRef.current.ruinsKeeper ?? { firstKillDone: false };
    const wasFirstKill = !rk.firstKillDone;
    let trophyItem: Item | undefined;
    if (wasFirstKill) {
      trophyItem = makeRuinsBossTrophy();
      inventoryRef.current = [...inventoryRef.current, trophyItem];
      setInventory(prev => [...prev, trophyItem!]);
      log('🏆 Получен трофей: Печать склепа!');
    }

    const newBS: BossState = {
      ...bossStateRef.current,
      ruinsKeeper: { firstKillDone: true, deadAt: Date.now() },
    };
    bossStateRef.current = newBS;
    setBossState(newBS);

    setActiveEnemyId(null);
    activeEnemyIdRef.current = null;
    setBossRewardInfo({ xp: xpGained, gold: RUINS_BOSS_REWARD.gold, dropItem, trophyItem, leveledUp, newLevel, wasFirstKill });
    setShowBossVictory(true);

    {
      const { progress: qp, logs: qLogs } = trackKillForQuests(questProgressRef.current, 'Хранитель склепа');
      if (qLogs.length) {
        questProgressRef.current = qp;
        setQuestProgress(qp);
        for (const msg of qLogs) log(msg);
      }
    }
    if (wasFirstKill) {
      log('🌑 Склеп затих. Печать на амулете холодит ладонь…');
      log('📜 Староста должен узнать: руины ещё живы.');
    }
  }, [log, grantXp]);

  // ── Swamp Boss: handle kill + rewards ────────────────────────────────────
  const handleSwampBossDeath = useCallback(() => {
    log('🫧 Трясинный ужас повержен!');

    playerGoldRef.current += SWAMP_BOSS_REWARD.gold;
    setPlayerGold(playerGoldRef.current);
    log(`💰 Получено ${SWAMP_BOSS_REWARD.gold} золота!`);

    const xpGained = Math.floor(SWAMP_BOSS_REWARD.xp * (1 + skillBonusesRef.current.xpBonusPct / 100));
    log(`✨ Получено ${xpGained} опыта!`);
    const { leveledUp, level: newLevel } = grantXp(xpGained);

    const isRare   = Math.random() < BOSS_RARE_CHANCE;
    const dropPool = isRare ? [...BOSS_RARE_LOOT] : [...BOSS_COMMON_LOOT];
    const dropKey  = dropPool[Math.floor(Math.random() * dropPool.length)];
    const dropItem = makeItem(dropKey);
    inventoryRef.current = [...inventoryRef.current, dropItem];
    setInventory(prev => [...prev, dropItem]);
    setLootNotif(dropItem.name);
    setTimeout(() => setLootNotif(null), 2500);
    log(`📦 Получен лут: ${dropItem.name}!`);

    const sh = bossStateRef.current.swampHorror ?? { firstKillDone: false };
    const wasFirstKill = !sh.firstKillDone;
    let trophyItem: Item | undefined;
    if (wasFirstKill) {
      trophyItem = makeSwampBossTrophy();
      inventoryRef.current = [...inventoryRef.current, trophyItem];
      setInventory(prev => [...prev, trophyItem!]);
      log('🏆 Получен трофей: Сердце трясины!');
    }

    const newBS: BossState = {
      ...bossStateRef.current,
      swampHorror: { firstKillDone: true, deadAt: Date.now() },
    };
    bossStateRef.current = newBS;
    setBossState(newBS);

    setActiveEnemyId(null);
    activeEnemyIdRef.current = null;
    setBossRewardInfo({ xp: xpGained, gold: SWAMP_BOSS_REWARD.gold, dropItem, trophyItem, leveledUp, newLevel, wasFirstKill });
    setShowBossVictory(true);

    {
      const { progress: qp, logs: qLogs } = trackKillForQuests(questProgressRef.current, 'Трясинный ужас');
      if (qLogs.length) {
        questProgressRef.current = qp;
        setQuestProgress(qp);
        for (const msg of qLogs) log(msg);
      }
    }
    if (wasFirstKill) {
      log('🌑 Трясина оседает. В центре — пульсирующий сгусток…');
      log('📜 Отнеси весть старосте. Болота ещё не побеждены, но ранены.');
    }
  }, [log, grantXp]);

  const handleMineBossDeath = useCallback(() => {
    log('🗿 Каменный страж повержен!');
    playerGoldRef.current += MINE_BOSS_REWARD.gold;
    setPlayerGold(playerGoldRef.current);
    log(`💰 Получено ${MINE_BOSS_REWARD.gold} золота!`);
    const xpGained = Math.floor(MINE_BOSS_REWARD.xp * (1 + skillBonusesRef.current.xpBonusPct / 100));
    log(`✨ Получено ${xpGained} опыта!`);
    const { leveledUp, level: newLevel } = grantXp(xpGained);
    const isRare   = Math.random() < BOSS_RARE_CHANCE;
    const dropPool = isRare ? [...BOSS_RARE_LOOT] : [...BOSS_COMMON_LOOT];
    const dropKey  = dropPool[Math.floor(Math.random() * dropPool.length)];
    const dropItem = makeItem(dropKey);
    inventoryRef.current = [...inventoryRef.current, dropItem];
    setInventory(prev => [...prev, dropItem]);
    setLootNotif(dropItem.name);
    setTimeout(() => setLootNotif(null), 2500);
    log(`📦 Получен лут: ${dropItem.name}!`);
    const mg = bossStateRef.current.mineGuardian ?? { firstKillDone: false };
    const wasFirstKill = !mg.firstKillDone;
    let trophyItem: Item | undefined;
    if (wasFirstKill) {
      trophyItem = makeMineBossTrophy();
      inventoryRef.current = [...inventoryRef.current, trophyItem];
      setInventory(prev => [...prev, trophyItem!]);
      log('🏆 Получен трофей: Осколок ядра голема!');
    }
    const newBS: BossState = {
      ...bossStateRef.current,
      mineGuardian: { firstKillDone: true, deadAt: Date.now() },
    };
    bossStateRef.current = newBS;
    setBossState(newBS);
    setActiveEnemyId(null);
    activeEnemyIdRef.current = null;
    setBossRewardInfo({ xp: xpGained, gold: MINE_BOSS_REWARD.gold, dropItem, trophyItem, leveledUp, newLevel, wasFirstKill });
    setShowBossVictory(true);
    {
      const { progress: qp, logs: qLogs } = trackKillForQuests(questProgressRef.current, 'Каменный страж');
      if (qLogs.length) {
        questProgressRef.current = qp;
        setQuestProgress(qp);
        for (const msg of qLogs) log(msg);
      }
    }
    if (wasFirstKill) {
      log('🌑 Шахта гулко молчит. В обломках — тёплый осколок ядра…');
      log('📜 Старосте будет что рассказать о глубинах.');
    }
  }, [log, grantXp]);

  // ── Enemy death ──────────────────────────────────────────────────────────
  const handleEnemyDeath = useCallback((id: number, ex: number, ey: number, name: string, rarity: EnemyRarity) => {
    phaseRef.current = 'victory';
    if (playerAttackTimeout.current) { clearTimeout(playerAttackTimeout.current); playerAttackTimeout.current = null; }
    if (enemyAttackTimeout.current)  { clearTimeout(enemyAttackTimeout.current);  enemyAttackTimeout.current  = null; }

    const deadAt = Date.now();
    enemiesRef.current = enemiesRef.current.map(e => e.id === id ? { ...e, dead: true, hp: 0, deadAt } : e);
    setEnemies(prev => prev.map(e => e.id === id ? { ...e, dead: true, hp: 0, deadAt } : e));
    playerPosRef.current = { x: ex, y: ey };
    setPlayerPos({ x: ex, y: ey });
    log(`💀 ${name} повержен!`);

    // Boss intercept — rewards and victory handled separately
    if (id === BOSS_ID) { handleBossDeath(); return; }
    if (id === FIELD_BOSS_ID) { handleFieldBossDeath(); return; }
    if (id === RUINS_BOSS_ID) { handleRuinsBossDeath(); return; }
    if (id === SWAMP_BOSS_ID) { handleSwampBossDeath(); return; }
    if (id === MINE_BOSS_ID) { handleMineBossDeath(); return; }

    const reward = applyRewards(name, rarity);
    setLastKillReward(reward);

    // ── Quest progress (any active quest matching this enemy name) ───────────
    {
      const { progress: qp, logs: qLogs } = trackKillForQuests(questProgressRef.current, name);
      if (qLogs.length) {
        questProgressRef.current = qp;
        setQuestProgress(qp);
        for (const msg of qLogs) log(msg);
      }
    }

    const allDead = enemiesRef.current.every(e => e.dead);
    if (allDead) log('🏆 Локация зачищена! Враги возродятся через некоторое время.');
    setPhase('victory');
    setTimeout(() => {
      if (phaseRef.current === 'victory') {
        phaseRef.current = 'explore'; setPhase('explore');
        setActiveEnemyId(null); activeEnemyIdRef.current = null;
      }
    }, 1500);
  }, [log, applyRewards, handleBossDeath, handleFieldBossDeath, handleRuinsBossDeath, handleSwampBossDeath, handleMineBossDeath]);
  // ── Combat ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'combat') return;

    const doPlayerAttack = () => {
      if (phaseRef.current !== 'combat') return;
      const id = activeEnemyIdRef.current;
      if (id === null) return;
      const enemy = enemiesRef.current.find(e => e.id === id);
      if (!enemy || enemy.dead || enemy.hp <= 0) return;

      if (hasStatusEffect(playerStatusEffectsRef.current, 'stun')) {
        log('💫 Вы оглушены и пропускаете атаку!');
        if (phaseRef.current === 'combat') {
          playerAttackTimeout.current = setTimeout(doPlayerAttack, 1000);
        }
        return;
      }

      // Compute all character stats from central module (pure, cheap)
      const _cs = computeStats({
        base: statsRef.current, levelHpBonus: levelHpBonusRef.current, levelMpBonus: levelMpBonusRef.current,
        bonusDmg: playerBonusDmgRef.current, equip: equipBonusesRef.current,
        skills: skillBonusesRef.current,
      });
      let dmg = Math.floor(Math.random() * (_cs.dmgMax - _cs.dmgMin + 1)) + _cs.dmgMin;
      const isCrit = Math.random() * 100 < _cs.critChance;
      if (isCrit) dmg = Math.floor(dmg * _cs.critDamageMult);
      const rawDmg = dmg;
      dmg = applyResistance(dmg, 'physical', enemy.resistances);
      const newHp = Math.max(0, enemy.hp - dmg);

      enemiesRef.current = enemiesRef.current.map(e => e.id === id ? { ...e, hp: newHp } : e);
      setEnemies(prev => prev.map(e => e.id === id ? { ...e, hp: newHp } : e));
      spawnFloat(isCrit ? `💥${dmg}` : dmg.toString(), enemy.x, enemy.y, 'enemy-dmg');
      const resistNote = dmg !== rawDmg ? (dmg < rawDmg ? ' (резист)' : ' (слабость)') : '';
      log(`${isCrit ? '💥 Крит! ' : ''}⚔️ Воин наносит ${dmg} урона${resistNote}!`);

      if (newHp === 0) { handleEnemyDeath(id, enemy.x, enemy.y, enemy.name, enemy.rarity); return; }

      // Same stats as above — nothing changed them in between, so no need to recompute.
      if (phaseRef.current === 'combat') {
        const interval = Math.floor(_cs.attackInterval * slowMultiplier(playerStatusEffectsRef.current));
        playerAttackTimeout.current = setTimeout(doPlayerAttack, interval);
      }
    };

    const _firstCs = computeStats({
      base: statsRef.current, levelHpBonus: levelHpBonusRef.current, levelMpBonus: levelMpBonusRef.current,
      bonusDmg: playerBonusDmgRef.current, equip: equipBonusesRef.current,
      skills: skillBonusesRef.current,
    });
    playerAttackTimeout.current = setTimeout(doPlayerAttack, _firstCs.attackInterval);

    const doEnemyAttack = () => {
      if (phaseRef.current !== 'combat') return;
      const id = activeEnemyIdRef.current;
      const enemy = enemiesRef.current.find(e => e.id === id);
      if (!enemy || enemy.dead || enemy.hp <= 0) return;

      if (hasStatusEffect(enemy.statusEffects, 'stun')) {
        log(`💫 ${enemy.name} оглушён и пропускает атаку!`);
        if (phaseRef.current === 'combat') {
          enemyAttackTimeout.current = setTimeout(doEnemyAttack, 1000);
        }
        return;
      }

      // Compute defensive stats
      const _defCs = computeStats({
        base: statsRef.current, levelHpBonus: levelHpBonusRef.current, levelMpBonus: levelMpBonusRef.current,
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
      dmg = Math.round(dmg * ENEMY_RARITY_DEFS[enemy.rarity].dmgMult);
      const isBlocked = Math.random() * 100 < _defCs.blockChance;
      if (isBlocked) dmg = Math.ceil(dmg / 2);
      if (shieldRef.current) dmg = Math.ceil(dmg / 2);
      // Defense mitigation: dmg × 100/(100+defense)
      if (_defCs.defense > 0) dmg = Math.max(1, Math.floor(dmg * 100 / (100 + _defCs.defense)));
      // Elemental / typed resistance (physical mitigation already applied via defense above)
      const enemyDmgType: DamageType = enemy.dealsDamageType ?? 'physical';
      let typeNote = '';
      if (enemyDmgType !== 'physical') {
        const playerResist = enemyDmgType === 'fire' ? _defCs.fireResist
          : enemyDmgType === 'electric' ? _defCs.electricResist
          : _defCs.iceResist;
        const before = dmg;
        dmg = applyResistance(dmg, enemyDmgType, { [enemyDmgType]: playerResist });
        if (dmg !== before) {
          typeNote = dmg < before
            ? ` (−${DAMAGE_TYPE_LABEL[enemyDmgType]} резист)`
            : ` (+${DAMAGE_TYPE_LABEL[enemyDmgType]} слабость)`;
        } else if (playerResist) {
          typeNote = ` [${DAMAGE_TYPE_LABEL[enemyDmgType]}]`;
        } else {
          typeNote = ` [${DAMAGE_TYPE_LABEL[enemyDmgType]}]`;
        }
      }

      spawnFloat(isBlocked ? `🛡️${dmg}` : dmg.toString(), pp.x, pp.y, 'player-dmg');
      log(`${enemy.emoji} ${enemy.name} атакует на ${dmg} урона!${isBlocked ? ' (блок!)' : ''}${typeNote}`);

      const prevHp = playerHpRef.current;
      const newHp  = Math.max(0, prevHp - dmg);
      playerHpRef.current = newHp; setPlayerHp(newHp);

      // Status effect on hit — chance reduced by matching player resists
      const onHit = ENEMY_EFFECT_ON_HIT[enemy.name];
      if (onHit && newHp > 0) {
        const chanceMult = effectChanceMultiplier(onHit.effect, {
          fire: _defCs.fireResist,
          electric: _defCs.electricResist,
          ice: _defCs.iceResist,
        });
        const finalChance = onHit.chance * chanceMult;
        if (Math.random() < finalChance) {
          const nextEffects = addStatusEffect(playerStatusEffectsRef.current, onHit.effect);
          playerStatusEffectsRef.current = nextEffects;
          setPlayerStatusEffects(nextEffects);
          const def = STATUS_EFFECT_DEFS[onHit.effect];
          log(`${def.icon} Вы получаете эффект «${def.label}»!`);
        }
      }

      if (prevHp > 0 && newHp === 0) {
        phaseRef.current = 'defeat'; setPhase('defeat');
        log('☠️ Вы погибли...'); return;
      }
      if (phaseRef.current === 'combat') {
        const interval = Math.floor(enemy.attackInterval * slowMultiplier(enemy.statusEffects));
        enemyAttackTimeout.current = setTimeout(doEnemyAttack, interval);
      }
    };

    const startEnemy = enemiesRef.current.find(e => e.id === activeEnemyIdRef.current);
    if (startEnemy) enemyAttackTimeout.current = setTimeout(doEnemyAttack, startEnemy.attackInterval);

    return () => {
      if (playerAttackTimeout.current) { clearTimeout(playerAttackTimeout.current); playerAttackTimeout.current = null; }
      if (enemyAttackTimeout.current)  { clearTimeout(enemyAttackTimeout.current);  enemyAttackTimeout.current  = null; }
    };
  }, [phase, log, spawnFloat, handleEnemyDeath]);

  // ── Status effect ticking (poison/burn damage, countdown for all effects) ──
  useEffect(() => {
    if (phase !== 'combat') return;
    const t = setInterval(() => {
      // Player
      const { next: nextPlayerEffects, damage: playerDmg } = tickStatusEffects(playerStatusEffectsRef.current);
      playerStatusEffectsRef.current = nextPlayerEffects;
      setPlayerStatusEffects(nextPlayerEffects);
      if (playerDmg > 0 && phaseRef.current === 'combat') {
        const prevHp = playerHpRef.current;
        const newHp  = Math.max(0, prevHp - playerDmg);
        playerHpRef.current = newHp; setPlayerHp(newHp);
        const pp = playerPosRef.current;
        spawnFloat(playerDmg.toString(), pp.x, pp.y, 'player-dmg');
        log(`☣️ Вы получаете ${playerDmg} урона от эффекта!`);
        if (prevHp > 0 && newHp === 0) {
          phaseRef.current = 'defeat'; setPhase('defeat');
          log('☠️ Вы погибли от эффекта...');
        }
      }

      // Enemies
      let killed: { id: number; x: number; y: number; name: string; rarity: EnemyRarity } | null = null;
      const nextEnemies = enemiesRef.current.map(e => {
        if (e.dead || e.hp <= 0 || !e.statusEffects?.length) return e;
        const { next, damage } = tickStatusEffects(e.statusEffects);
        if (damage <= 0) return { ...e, statusEffects: next };
        const newHp = Math.max(0, e.hp - damage);
        spawnFloat(damage.toString(), e.x, e.y, 'enemy-dmg');
        if (newHp === 0 && !killed) killed = { id: e.id, x: e.x, y: e.y, name: e.name, rarity: e.rarity };
        return { ...e, hp: newHp, statusEffects: next };
      });
      enemiesRef.current = nextEnemies;
      setEnemies(nextEnemies);
      if (killed) {
        const k = killed as { id: number; x: number; y: number; name: string; rarity: EnemyRarity };
        log(`☣️ ${k.name} погибает от эффекта!`);
        handleEnemyDeath(k.id, k.x, k.y, k.name, k.rarity);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [phase, log, spawnFloat, handleEnemyDeath]);

  // ── Enemy & boss respawn — runs continuously, independent of combat phase ──
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();

      // Normal enemies: revive any that have been dead long enough, in place.
      let changed = false;
      const revived = enemiesRef.current.map(e => {
        if (ALL_BOSS_IDS.has(e.id)) return e;
        if (e.dead && e.deadAt !== undefined && now - e.deadAt >= RESPAWN_MS) {
          changed = true;
          return reviveEnemy(e);
        }
        return e;
      });
      if (changed) {
        enemiesRef.current = revived;
        setEnemies(revived);
      }

      // Cave boss: reappears once its cooldown has passed, same "area is clear" flavor as the first encounter.
      if (currentLocationRef.current === 'wolfcave') {
        const bossAbsent = !enemiesRef.current.some(e => e.id === BOSS_ID);
        const deadAt = bossStateRef.current.caveChief.deadAt;
        const offCooldown = deadAt === undefined || now - deadAt >= BOSS_RESPAWN_MS;
        const areaClear = enemiesRef.current.every(e => e.id === BOSS_ID || e.dead);
        if (bossAbsent && offCooldown && areaClear) {
          spawnCaveBoss();
        }
      }

      // Field mini-boss (Тихие поля): каждые 15 минут — без обязательной зачистки
      if (currentLocationRef.current === 'forest') {
        const bossAbsent = !enemiesRef.current.some(e => e.id === FIELD_BOSS_ID);
        const fb = bossStateRef.current.fieldBoar ?? { firstKillDone: false };
        const deadAt = fb.deadAt;
        const offCooldown = deadAt === undefined || now - deadAt >= FIELD_BOSS_RESPAWN_MS;
        if (bossAbsent && offCooldown) {
          spawnFieldBoss();
        }
      }

      // Ruins boss: after area clear + cooldown
      if (currentLocationRef.current === 'ruins') {
        const bossAbsent = !enemiesRef.current.some(e => e.id === RUINS_BOSS_ID);
        const rk = bossStateRef.current.ruinsKeeper ?? { firstKillDone: false };
        const deadAt = rk.deadAt;
        const offCooldown = deadAt === undefined || now - deadAt >= RUINS_BOSS_RESPAWN_MS;
        const areaClear = enemiesRef.current.every(e => e.id === RUINS_BOSS_ID || e.dead);
        if (bossAbsent && offCooldown && areaClear) {
          spawnRuinsBoss();
        }
      }

      // Swamp boss
      if (currentLocationRef.current === 'swamp') {
        const bossAbsent = !enemiesRef.current.some(e => e.id === SWAMP_BOSS_ID);
        const sh = bossStateRef.current.swampHorror ?? { firstKillDone: false };
        const deadAt = sh.deadAt;
        const offCd = deadAt === undefined || now - deadAt >= SWAMP_BOSS_RESPAWN_MS;
        const areaClear = enemiesRef.current.every(e => e.id === SWAMP_BOSS_ID || e.dead);
        if (bossAbsent && offCd && areaClear) {
          spawnSwampBoss();
        }
      }

      // Mine boss
      if (currentLocationRef.current === 'mine') {
        const bossAbsent = !enemiesRef.current.some(e => e.id === MINE_BOSS_ID);
        const mg = bossStateRef.current.mineGuardian ?? { firstKillDone: false };
        const deadAt = mg.deadAt;
        const offCd = deadAt === undefined || now - deadAt >= MINE_BOSS_RESPAWN_MS;
        const areaClear = enemiesRef.current.every(e => e.id === MINE_BOSS_ID || e.dead);
        if (bossAbsent && offCd && areaClear) {
          spawnMineBoss();
        }
      }
    }, 1000);
    return () => clearInterval(t);
  }, [spawnCaveBoss, spawnFieldBoss, spawnRuinsBoss, spawnSwampBoss, spawnMineBoss]);

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

  // ── Mana regeneration (5 MP/sec while in combat) ────────────────────────────
  useEffect(() => {
    if (phase !== 'combat') return;
    const t = setInterval(() => {
      const max = playerMaxMpRef.current;
      if (playerMpRef.current >= max) return;
      const newMp = Math.min(max, playerMpRef.current + 5);
      playerMpRef.current = newMp;
      setPlayerMp(newMp);
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);
  const useSkill = useCallback((skill: typeof SKILLS[0]) => {
    if (phaseRef.current !== 'combat') return;
    if (skillsCd[skill.id] > 0) return;
    if (skill.manaCost > 0 && playerMpRef.current < skill.manaCost) {
      log('🔷 Недостаточно маны!');
      return;
    }
    setSkillsCd(prev => ({ ...prev, [skill.id]: skill.maxCd }));

    if (skill.manaCost > 0) {
      const newMp = playerMpRef.current - skill.manaCost;
      playerMpRef.current = newMp;
      setPlayerMp(newMp);
    }

    if (skill.damage > 0) {
      const id = activeEnemyIdRef.current;
      if (id === null) return;
      const enemy = enemiesRef.current.find(e => e.id === id);
      if (!enemy || enemy.dead || enemy.hp <= 0) return;
      const rawSkill = skill.damage;
      const dmg = applyResistance(skill.damage, skill.damageType, enemy.resistances);
      const newHp = Math.max(0, enemy.hp - dmg);
      const skNote = dmg !== rawSkill ? (dmg < rawSkill ? ' (резист)' : ' (слабость!)') : '';

      let statusEffects = enemy.statusEffects ?? [];
      const inflict = SKILL_EFFECT_ON_HIT[skill.id];
      if (inflict && newHp > 0) {
        statusEffects = addStatusEffect(statusEffects, inflict);
        const def = STATUS_EFFECT_DEFS[inflict];
        log(`${def.icon} ${enemy.name} получает эффект «${def.label}»!`);
      }

      enemiesRef.current = enemiesRef.current.map(e => e.id === id ? { ...e, hp: newHp, statusEffects } : e);
      setEnemies(prev => prev.map(e => e.id === id ? { ...e, hp: newHp, statusEffects } : e));
      spawnFloat(dmg.toString(), enemy.x, enemy.y, 'enemy-dmg');
      log(`✨ Воин использует ${skill.name} (${DAMAGE_TYPE_LABEL[skill.damageType]}) на ${dmg} урона${skNote}!`);
      if (newHp === 0) handleEnemyDeath(id, enemy.x, enemy.y, enemy.name, enemy.rarity);
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

  return { grantXp, useSkill };
}
