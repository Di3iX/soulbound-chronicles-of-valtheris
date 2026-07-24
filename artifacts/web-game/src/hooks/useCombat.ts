import { useCallback, useEffect } from 'react';
import type { MutableRefObject, Dispatch, SetStateAction } from 'react';
import {
  Enemy, KillReward, LocationId, Phase, SKILLS,
  REWARD_TABLE, applyXpGain,
} from '../combat';
import { Item, DROP_TABLES, makeItem } from '../inventory';
import { EquipBonuses } from '../equipment';
import { BaseStats, computeStats } from '../stats';
import { SkillBonuses } from '../skills/skillTree';
import { QuestProgress, QUEST_DEFS } from '../quests/quests';
import {
  BOSS_ID, CAVE_BOSS_DEF, BOSS_REWARD, BOSS_RARE_CHANCE, BOSS_RARE_LOOT, BOSS_COMMON_LOOT,
  BossState, BossRewardInfo, makeBossTrophy,
} from '../boss/boss';
import { FloatingNum } from '../types/ui';

export interface CombatCtx {
  // ── Reactive state (read each render; needed for effect deps / checks) ────
  phase: Phase;
  skillsCd: Record<number, number>;

  // ── Refs (mutable, stable identity — safe to read/write directly) ─────────
  activeEnemyIdRef:  MutableRefObject<number | null>;
  bossDefeatedThisVisitRef: MutableRefObject<boolean>;
  bossSpawnedThisVisitRef:  MutableRefObject<boolean>;
  bossStateRef:      MutableRefObject<BossState>;
  currentLocationRef: MutableRefObject<LocationId>;
  enemiesRef:        MutableRefObject<Enemy[]>;
  enemyAttackTimeout: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  equipBonusesRef:   MutableRefObject<EquipBonuses>;
  inventoryRef:      MutableRefObject<Item[]>;
  levelHpBonusRef:   MutableRefObject<number>;
  phaseRef:          MutableRefObject<Phase>;
  playerAttackTimeout: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  playerBonusDmgRef: MutableRefObject<number>;
  playerGoldRef:     MutableRefObject<number>;
  playerHpRef:       MutableRefObject<number>;
  playerLevelRef:    MutableRefObject<number>;
  playerMaxHpRef:    MutableRefObject<number>;
  playerPosRef:      MutableRefObject<{ x: number; y: number }>;
  playerXpRef:       MutableRefObject<number>;
  questProgressRef:  MutableRefObject<QuestProgress>;
  shieldRef:         MutableRefObject<boolean>;
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
  setBossDefeatedThisVisit: (v: boolean) => void;
  setBossRewardInfo: (v: BossRewardInfo) => void;
  setBossSpawnedThisVisit: (v: boolean) => void;
  setBossState: (v: BossState) => void;
  setEnemies: Dispatch<SetStateAction<Enemy[]>>;
  setInventory: Dispatch<SetStateAction<Item[]>>;
  setLastKillReward: (v: KillReward) => void;
  setLevelHpBonus: (v: number) => void;
  setLootNotif: (v: string | null) => void;
  setPhase: (v: Phase) => void;
  setPlayerBonusDmg: (v: number) => void;
  setPlayerGold: (v: number) => void;
  setPlayerHp: (v: number) => void;
  setPlayerLevel: (v: number) => void;
  setPlayerMaxHp: (v: number) => void;
  setPlayerPos: (v: { x: number; y: number }) => void;
  setPlayerXp: (v: number) => void;
  setQuestProgress: (v: QuestProgress) => void;
  setShieldActive: (v: boolean) => void;
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
  } = ctx;

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
  // ── Grant XP + resolve any level-ups (single source of truth) ──────────────
  // Used by applyRewards, handleBossDeath, and the quest-completion handler —
  // previously each of the three duplicated this ~20-line calculation inline.
  const grantXp = useCallback((xpGained: number) => {
    const result = applyXpGain(
      playerXpRef.current, playerLevelRef.current,
      playerBonusDmgRef.current, levelHpBonusRef.current,
      xpGained,
    );

    const newMaxHp = computeStats({
      base: statsRef.current, levelHpBonus: result.levelHpBonus,
      bonusDmg: result.bonusDmg, equip: equipBonusesRef.current,
      skills: skillBonusesRef.current,
    }).maxHp;

    playerLevelRef.current    = result.level;
    playerBonusDmgRef.current = result.bonusDmg;
    levelHpBonusRef.current   = result.levelHpBonus;
    playerMaxHpRef.current    = newMaxHp;
    playerXpRef.current       = result.xp;

    setPlayerXp(result.xp); setXpToNext(result.xpToNext); setPlayerLevel(result.level);
    setPlayerBonusDmg(result.bonusDmg); setLevelHpBonus(result.levelHpBonus); setPlayerMaxHp(newMaxHp);

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
      log(`🌟 Новый уровень ${result.level}! HP восстановлено!`);
    }

    return result;
  }, [log]);

  const applyRewards = useCallback((enemyName: string): KillReward => {
    const reward = REWARD_TABLE[enemyName] ?? { xp: 10, goldMin: 1, goldMax: 3 };

    const goldGained = Math.floor(Math.random() * (reward.goldMax - reward.goldMin + 1)) + reward.goldMin;
    playerGoldRef.current += goldGained;
    setPlayerGold(playerGoldRef.current);
    log(`💰 Получено ${goldGained} золота!`);

    const xpGained = Math.floor(reward.xp * (1 + skillBonusesRef.current.xpBonusPct / 100));
    log(`✨ Получено ${xpGained} опыта!`);

    const { leveledUp, level: newLevel, statPointsGained } = grantXp(xpGained);

    const droppedItem = rollLoot(enemyName);
    return { xp: xpGained, gold: goldGained, leveledUp, newLevel, statPtsGained: statPointsGained, droppedItem };
  }, [log, rollLoot, grantXp]);

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
  }, [log, grantXp]);

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

      // Same stats as above — nothing changed them in between, so no need to recompute.
      if (phaseRef.current === 'combat') {
        playerAttackTimeout.current = setTimeout(doPlayerAttack, _cs.attackInterval);
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

  return { grantXp, useSkill };
}
