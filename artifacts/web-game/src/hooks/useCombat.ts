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
import { BaseStats, computeStats, type MasteryBonuses } from '../stats';
import { SkillBonuses } from '../skills/skillTree';
import { QuestProgress, trackKillForQuests } from '../quests/quests';
import type { CombatReadySkill } from '../classes/classCombatSkills';
import {
  BOSS_CONFIGS, BossKey, bossKeyForEnemyId, makeTrophyForBoss,
  BOSS_RARE_CHANCE, BOSS_RARE_LOOT, BOSS_COMMON_LOOT,
  BossState, BossRewardInfo,
  ALL_BOSS_IDS,
} from '../boss/boss';
import { FloatingNum } from '../types/ui';
import type { PlayerMasteryState } from '../classes/playerClass';
import { scaleXp, scaleGold, lifestealHeal, masteryFromState } from '../classes/masteryCombat';

export interface CombatCtx {
  // ── Reactive state (read each render; needed for effect deps / checks) ────
  phase: Phase;
  skillsCd: Record<string, number>;

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
  masteryStateRef?:  MutableRefObject<PlayerMasteryState>;

  // ── Shared functions (already-memoized, stable across renders) ────────────
  log: (msg: string) => void;
  /** Called after grantXp finishes, once per XP grant that leveled up (see classes/playerClass.ts). */
  onLevelUp?: (levelsGained: number) => void;
  spawnFloat: (value: string, col: number, row: number, type: FloatingNum['type']) => void;

  // ── Setters ────────────────────────────────────────────────────────────────
  setActiveEnemyId: (v: number | null) => void;
  setBossAppearNotif: (v: boolean) => void;
  setBossRewardInfo: (v: BossRewardInfo) => void;
  setBossState: (v: BossState) => void;
  setEnemies: Dispatch<SetStateAction<Enemy[]>>;
  setInventory: Dispatch<SetStateAction<Item[]>>;
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
  setSkillsCd: Dispatch<SetStateAction<Record<string, number>>>;
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
    shieldRef, playerStatusEffectsRef, skillBonusesRef, skillPointsRef, statPointsRef, statsRef, masteryStateRef,
    log, spawnFloat, onLevelUp,
    setActiveEnemyId, setBossAppearNotif, setBossRewardInfo,
    setBossState, setEnemies, setInventory,
    setLevelHpBonus, setLevelMpBonus, setLootNotif, setPhase, setPlayerBonusDmg, setPlayerGold, setPlayerHp,
    setPlayerLevel, setPlayerMaxHp, setPlayerMp, setPlayerMaxMp, setPlayerPos, setPlayerXp, setQuestProgress,
    setShieldActive, setPlayerStatusEffects, setShowBossVictory, setSkillPoints, setSkillsCd, setStatPoints, setXpToNext,
  } = ctx;

  // ── Mastery Constellation bonuses (see STEP7_COMBAT_MASTERY.md) ────────────
  const masteryBag = (): MasteryBonuses => masteryFromState(masteryStateRef?.current);

  const statsWithMastery = () => computeStats({
    base: statsRef.current,
    levelHpBonus: levelHpBonusRef.current,
    levelMpBonus: levelMpBonusRef.current,
    bonusDmg: playerBonusDmgRef.current,
    equip: equipBonusesRef.current,
    skills: skillBonusesRef.current,
    mastery: masteryBag(),
  });

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
    const levelBefore = playerLevelRef.current;
    const result = applyXpGain(
      playerXpRef.current, playerLevelRef.current,
      playerBonusDmgRef.current, levelHpBonusRef.current, levelMpBonusRef.current,
      xpGained,
    );

    const newStats = computeStats({
      base: statsRef.current, levelHpBonus: result.levelHpBonus, levelMpBonus: result.levelMpBonus,
      bonusDmg: result.bonusDmg, equip: equipBonusesRef.current,
      skills: skillBonusesRef.current, mastery: masteryBag(),
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

      // Классы + Созвездие мастерства (см. STEP1_APP.md) — очки начисляет App.tsx,
      // у него есть classState/masteryState, здесь их нет.
      const levelsGained = result.level - levelBefore;
      onLevelUp?.(levelsGained);
    }

    return result;
  }, [log, onLevelUp]);

  const applyRewards = useCallback((enemyName: string, rarity: EnemyRarity): KillReward => {
    const reward = REWARD_TABLE[enemyName] ?? { xp: 10, goldMin: 1, goldMax: 3 };
    const rarityDef = ENEMY_RARITY_DEFS[rarity];

    const baseGold = Math.floor(Math.random() * (reward.goldMax - reward.goldMin + 1)) + reward.goldMin;
    const mb = masteryBag();
    const goldGained = scaleGold(
      Math.round(baseGold * rarityDef.goldMult),
      mb,
    );
    playerGoldRef.current += goldGained;
    setPlayerGold(playerGoldRef.current);

    const xpGained = scaleXp(
      reward.xp * rarityDef.xpMult,
      skillBonusesRef.current.xpBonusPct,
      mb,
    );

    if (rarity !== 'common') {
      log(`${rarityDef.emoji} ${rarityDef.label} противник повержен!`);
    }
    log(`💰 Получено ${goldGained} золота!`);
    log(`✨ Получено ${xpGained} опыта!`);

    const { leveledUp, level: newLevel, statPointsGained } = grantXp(xpGained);

    const droppedItem = rollLoot(enemyName, rarityDef.itemChanceBonus, rarityDef.guaranteedDrop);

    // Всплывающие цифры над героем (MMO-style) — не только в лог.
    {
      const pp = playerPosRef.current;
      spawnFloat(`+${goldGained}💰`, pp.x, pp.y, 'gold');
      // небольшая задержка, чтобы XP не слипался с золотом визуально
      setTimeout(() => {
        spawnFloat(`+${xpGained} XP`, pp.x, pp.y, 'xp');
      }, 180);
    }
    if (leveledUp) {
      const pp = playerPosRef.current;
      setTimeout(() => {
        spawnFloat(`⬆ Ур. ${newLevel}`, pp.x, pp.y, 'level');
      }, 400);
    }
    if (droppedItem) {
      const pp = playerPosRef.current;
      setTimeout(() => {
        spawnFloat(`📦 ${droppedItem.name}`, pp.x, pp.y, 'loot');
      }, 320);
    }

    return { xp: xpGained, gold: goldGained, leveledUp, newLevel, statPtsGained: statPointsGained, droppedItem };
  }, [log, rollLoot, grantXp, spawnFloat]);

  // ── Boss spawn — generic, driven by BOSS_CONFIGS (see boss/boss.ts) ────────
  const spawnBoss = useCallback((key: BossKey) => {
    const cfg = BOSS_CONFIGS[key];
    if (enemiesRef.current.some(e => e.id === cfg.id)) return;
    const bossEnemy: Enemy = { ...cfg.def, id: cfg.id };
    enemiesRef.current = [...enemiesRef.current, bossEnemy];
    setEnemies(prev => [...prev, bossEnemy]);
    phaseRef.current = 'explore';
    setPhase('explore');
    setActiveEnemyId(null);
    activeEnemyIdRef.current = null;
    setBossAppearNotif(true);
    setTimeout(() => setBossAppearNotif(false), 3500);
    log(`⚔️ Появился ${cfg.isMiniBoss ? 'мини-босс' : 'Босс'}: ${cfg.def.name}!`);
  }, [log]);

  // ── Boss death — handles rewards, trophy, respawn timer, quest tracking and
  //    first-kill story beats for every boss the same way. ───────────────────
  const handleBossDeath = useCallback((key: BossKey) => {
    const cfg = BOSS_CONFIGS[key];
    log(`${cfg.def.emoji} ${cfg.def.name} повержен!`);

    // Gold
    const mb = masteryBag();
    const goldGained = scaleGold(cfg.reward.gold, mb);
    playerGoldRef.current += goldGained;
    setPlayerGold(playerGoldRef.current);
    log(`💰 Получено ${goldGained} золота!`);

    // XP with Wisdom + mastery bonus
    const xpGained = scaleXp(cfg.reward.xp, skillBonusesRef.current.xpBonusPct, mb);
    log(`✨ Получено ${xpGained} опыта!`);

    const { leveledUp, level: newLevel } = grantXp(xpGained);

    // Guaranteed item drop (25% rare, 75% common/uncommon pool)
    const isRare   = Math.random() < BOSS_RARE_CHANCE;
    const dropPool = isRare ? [...BOSS_RARE_LOOT] : [...BOSS_COMMON_LOOT];
    const dropKey  = dropPool[Math.floor(Math.random() * dropPool.length)];
    const dropItem = makeItem(dropKey);
    inventoryRef.current = [...inventoryRef.current, dropItem];
    setInventory(prev => [...prev, dropItem]);
    setLootNotif(dropItem.name);
    setTimeout(() => setLootNotif(null), 2500);
    log(`📦 Получен лут: ${dropItem.name}!`);

    // Trophy — first kill only
    const wasFirstKill = !bossStateRef.current[key].firstKillDone;
    let trophyItem: Item | undefined;
    if (wasFirstKill) {
      trophyItem = makeTrophyForBoss(key);
      inventoryRef.current = [...inventoryRef.current, trophyItem];
      setInventory(prev => [...prev, trophyItem!]);
      log(`🏆 Получен трофей: ${trophyItem.name}!`);
      if (cfg.unlockMessage) log(cfg.unlockMessage);
    }

    // Start the respawn timer — boss reappears in cfg.respawnMs
    const newBS: BossState = {
      ...bossStateRef.current,
      [key]: { firstKillDone: true, deadAt: Date.now() },
    };
    bossStateRef.current = newBS;
    setBossState(newBS);

    // Show boss victory overlay
    setActiveEnemyId(null);
    activeEnemyIdRef.current = null;
    setBossRewardInfo({ xp: xpGained, gold: goldGained, dropItem, trophyItem, leveledUp, newLevel, wasFirstKill });
    setShowBossVictory(true);

    {
      const { progress: qp, logs: qLogs } = trackKillForQuests(questProgressRef.current, cfg.def.name);
      if (qLogs.length) {
        questProgressRef.current = qp;
        setQuestProgress(qp);
        for (const msg of qLogs) log(msg);
      }
    }
    if (wasFirstKill) {
      for (const msg of cfg.firstKillStoryLines) log(msg);
    }
  }, [log, grantXp]);

  // ── Enemy death ──────────────────────────────────────────────────────────
  const handleEnemyDeath = useCallback((id: number, ex: number, ey: number, name: string, rarity: EnemyRarity) => {
    if (playerAttackTimeout.current) { clearTimeout(playerAttackTimeout.current); playerAttackTimeout.current = null; }
    if (enemyAttackTimeout.current)  { clearTimeout(enemyAttackTimeout.current);  enemyAttackTimeout.current  = null; }

    const deadAt = Date.now();
    enemiesRef.current = enemiesRef.current.map(e => e.id === id ? { ...e, dead: true, hp: 0, deadAt } : e);
    setEnemies(prev => prev.map(e => e.id === id ? { ...e, dead: true, hp: 0, deadAt } : e));
    log(`💀 ${name} повержен!`);

    // Boss intercept — rewards and victory handled separately
    const bossKey = bossKeyForEnemyId(id);
    if (bossKey) { handleBossDeath(bossKey); return; }

    // MMO-style: только лог + всплывающие цифры (applyRewards уже вызывает spawnFloat).
    // НЕ ставим lastKillReward — иначе App может отрисовать большую плашку «Победа».
    applyRewards(name, rarity);

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

    // Мгновенный возврат в explore — без окна «Победа» и задержки (см. FIX_VICTORY_TABLET.md).
    phaseRef.current = 'explore'; setPhase('explore');
    setActiveEnemyId(null); activeEnemyIdRef.current = null;
  }, [log, applyRewards, handleBossDeath]);
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
      const _cs = statsWithMastery();
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

      // Vampirism — heal from damage dealt (Constellation: Вампиризм)
      const heal = lifestealHeal(dmg, masteryBag());
      if (heal > 0) {
        const next = Math.min(playerMaxHpRef.current, playerHpRef.current + heal);
        playerHpRef.current = next;
        setPlayerHp(next);
        spawnFloat(`+${heal}`, playerPosRef.current.x, playerPosRef.current.y, 'heal');
      }

      if (newHp === 0) { handleEnemyDeath(id, enemy.x, enemy.y, enemy.name, enemy.rarity); return; }

      // Same stats as above — nothing changed them in between, so no need to recompute.
      if (phaseRef.current === 'combat') {
        const interval = Math.floor(_cs.attackInterval * slowMultiplier(playerStatusEffectsRef.current));
        playerAttackTimeout.current = setTimeout(doPlayerAttack, interval);
      }
    };

    const _firstCs = statsWithMastery();
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
      const _defCs = statsWithMastery();
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

      // Every boss: reappears once its cooldown has passed, once its location
      // is current and (for most bosses) the area is clear of other enemies.
      for (const key of Object.keys(BOSS_CONFIGS) as BossKey[]) {
        const cfg = BOSS_CONFIGS[key];
        if (currentLocationRef.current !== cfg.locationId) continue;

        const bossAbsent = !enemiesRef.current.some(e => e.id === cfg.id);
        const deadAt = bossStateRef.current[key]?.deadAt;
        const offCooldown = deadAt === undefined || now - deadAt >= cfg.respawnMs;
        const areaClear = !cfg.requiresAreaClear
          || enemiesRef.current.every(e => e.id === cfg.id || e.dead);

        if (bossAbsent && offCooldown && areaClear) {
          spawnBoss(key);
        }
      }
    }, 1000);
    return () => clearInterval(t);
  }, [spawnBoss]);
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

  // ── Class skills (см. STEP4_APP.md) — string id, урон уже посчитан вызывающей
  //    стороной (classCombatSkills.ts: damageFromSkill по статам), здесь только
  //    применение: ресурс, КД, урон/лечение врагу-игроку, лог. ────────────────
  const useClassSkill = useCallback((skill: CombatReadySkill) => {
    if (phaseRef.current !== 'combat') return;
    if ((skillsCd[skill.id] ?? 0) > 0) return;
    if (skill.manaCost > 0 && playerMpRef.current < skill.manaCost) {
      log('Недостаточно ресурса!');
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
      if (id !== null) {
        const enemy = enemiesRef.current.find(e => e.id === id);
        if (enemy && !enemy.dead && enemy.hp > 0) {
          const dmg = applyResistance(skill.damage, skill.damageType, enemy.resistances);
          const newHp = Math.max(0, enemy.hp - dmg);
          const skNote = dmg !== skill.damage ? (dmg < skill.damage ? ' (резист)' : ' (слабость!)') : '';

          enemiesRef.current = enemiesRef.current.map(e => e.id === id ? { ...e, hp: newHp } : e);
          setEnemies(prev => prev.map(e => e.id === id ? { ...e, hp: newHp } : e));
          spawnFloat(dmg.toString(), enemy.x, enemy.y, 'enemy-dmg');
          log(`${skill.emoji} ${skill.name} (${DAMAGE_TYPE_LABEL[skill.damageType]}): ${dmg} урона${skNote}!`);

          // Vampirism — heal from damage dealt (Constellation: Вампиризм)
          const heal = lifestealHeal(dmg, masteryBag());
          if (heal > 0) {
            const next = Math.min(playerMaxHpRef.current, playerHpRef.current + heal);
            playerHpRef.current = next;
            setPlayerHp(next);
            spawnFloat(`+${heal}`, playerPosRef.current.x, playerPosRef.current.y, 'heal');
          }

          if (newHp === 0) handleEnemyDeath(id, enemy.x, enemy.y, enemy.name, enemy.rarity);
        }
      }
    }

    if (skill.healSelf > 0) {
      const pp = playerPosRef.current;
      const newHp = Math.min(playerMaxHpRef.current, playerHpRef.current + skill.healSelf);
      playerHpRef.current = newHp; setPlayerHp(newHp);
      spawnFloat(`+${skill.healSelf}`, pp.x, pp.y, 'heal');
      log(`${skill.emoji} ${skill.name}: +${skill.healSelf} HP!`);
    }
  }, [skillsCd, log, spawnFloat, handleEnemyDeath]);

  return { grantXp, useSkill, useClassSkill };
}
