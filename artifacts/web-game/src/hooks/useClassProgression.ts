// ─── CLASS PROGRESSION (archetype, profession, specialization, trials, stat points) ─
// Extracted from App.tsx: everything about the class/mastery system and base-stat
// spending. Touches questProgress only for trial-eligibility bookkeeping.
import { useCallback, useMemo } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { BaseStats } from '../stats';
import { computeStats } from '../stats';
import type { EquipBonuses } from '../equipment';
import type { SkillBonuses } from '../skills/skillTree';
import type { QuestProgress } from '../quests/quests';
import { SKILLS } from '../combat';
import { getCombatClassSkills } from '../classes/classCombatSkills';
import {
  createClassState, createMasteryState, grantClassAndMasteryPoints,
  chooseProfession, chooseSpecialization, archetypeBaseStats,
  type PlayerClassState, type PlayerMasteryState,
} from '../classes/playerClass';
import type { ArchetypeId } from '../classes/classSystem';
import {
  offerTrialIfEligible, getTrial20ForArchetype, getTrial40ForProfession,
  completeTrial, applyTrialChoice,
} from '../classes/trials';

export interface ClassProgressionCtx {
  classState:   PlayerClassState | null;
  masteryState: PlayerMasteryState;
  playerLevel:  number;
  questProgress: QuestProgress;
  stats:         BaseStats;
  equipBonuses:  EquipBonuses;

  statsRef:          MutableRefObject<BaseStats>;
  statPointsRef:     MutableRefObject<number>;
  levelHpBonusRef:   MutableRefObject<number>;
  levelMpBonusRef:   MutableRefObject<number>;
  playerBonusDmgRef: MutableRefObject<number>;
  equipBonusesRef:   MutableRefObject<EquipBonuses>;
  skillBonusesRef:   MutableRefObject<SkillBonuses>;
  playerMaxHpRef:    MutableRefObject<number>;

  setClassState:      Dispatch<SetStateAction<PlayerClassState | null>>;
  setMasteryState:    Dispatch<SetStateAction<PlayerMasteryState>>;
  setShowClassSelect: Dispatch<SetStateAction<boolean>>;
  setShowTrial:       Dispatch<SetStateAction<boolean>>;
  setQuestProgress:   Dispatch<SetStateAction<QuestProgress>>;
  setStats:           Dispatch<SetStateAction<BaseStats>>;
  setStatPoints:      Dispatch<SetStateAction<number>>;
  setPlayerMaxHp:     Dispatch<SetStateAction<number>>;

  log: (msg: string) => void;
}

export function useClassProgression(ctx: ClassProgressionCtx) {
  const {
    classState, masteryState, playerLevel, questProgress, stats, equipBonuses,
    statsRef, statPointsRef, levelHpBonusRef, levelMpBonusRef, playerBonusDmgRef,
    equipBonusesRef, skillBonusesRef, playerMaxHpRef,
    setClassState, setMasteryState, setShowClassSelect, setShowTrial, setQuestProgress,
    setStats, setStatPoints, setPlayerMaxHp,
    log,
  } = ctx;

  /** StatBlock (str/agi/int/spi/vit/lck) → BaseStats проекта (нет slots под spi/lck пока). */
  const mapStatBlockToBaseStats = useCallback((block: { str: number; agi: number; int: number; vit: number }): BaseStats => ({
    strength:     block.str,
    agility:      block.agi,
    vitality:     block.vit,
    intelligence: block.int,
  }), []);

  /** Обратный маппер для формул урона навыков (StatBlock). spi/lck пока не отслеживаются игрой — базовое значение 5. */
  const mapBaseStatsToStatBlock = useCallback((base: BaseStats) => ({
    str: base.strength,
    agi: base.agility,
    int: base.intelligence,
    vit: base.vitality,
    spi: 5,
    lck: 5,
  }), []);

  const handlePickArchetype = useCallback((id: ArchetypeId) => {
    const cs = createClassState(id);
    setClassState(cs);
    setMasteryState(createMasteryState());
    setShowClassSelect(false);

    const base = mapStatBlockToBaseStats(archetypeBaseStats(id));
    statsRef.current = { ...base };
    setStats({ ...base });
    log(`Путь выбран: ${id === 'warrior' ? 'Воин' : id === 'ranger' ? 'Следопыт' : id === 'mage' ? 'Маг' : 'Послушник'}`);
  }, [log, mapStatBlockToBaseStats]);

  const handleLevelUp = useCallback((levelsGained: number) => {
    if (!classState) return;
    const r = grantClassAndMasteryPoints(classState, masteryState, levelsGained);
    setClassState(r.classState);
    setMasteryState(r.masteryState);
    r.logs.forEach(log);

    // Испытания 20/40 (см. STEP5_APP.md). playerLevel здесь — значение ДО этого
    // прироста (стейт ещё не перерендерился), поэтому + levelsGained = новый уровень.
    const newLevel = playerLevel + levelsGained;
    const t = offerTrialIfEligible(questProgress, r.classState, newLevel);
    if (t.offered) {
      setQuestProgress(t.progress);
      if (t.log) log(t.log);
    }
  }, [classState, masteryState, log, playerLevel, questProgress]);

  // Активные навыки текущего архетипа/профессии (см. STEP4_APP.md).
  // Фоллбэк на старые SKILLS, пока класс не выбран (showClassSelect ещё не пройден).
  const classSkills = useMemo(() => {
    if (!classState) {
      return SKILLS.map(s => ({ ...s, id: String(s.id), kind: 'active' as const, description: s.name }));
    }
    return getCombatClassSkills(
      classState,
      playerLevel,
      mapBaseStatsToStatBlock(stats),
      equipBonuses?.damage ?? 0,
    );
  }, [classState, playerLevel, stats, equipBonuses, mapBaseStatsToStatBlock]);

  // Испытание, доступное сейчас (20 ур. без профессии, либо 40 ур. без специализации).
  const activeTrial = useMemo(() => {
    if (!classState) return undefined;
    if (!classState.profession && playerLevel >= 20) {
      return getTrial20ForArchetype(classState.archetype);
    }
    if (classState.profession && !classState.specialization && playerLevel >= 40) {
      return getTrial40ForProfession(classState.profession);
    }
    return undefined;
  }, [classState, playerLevel]);

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
        base: newStats, levelHpBonus: levelHpBonusRef.current, levelMpBonus: levelMpBonusRef.current,
        bonusDmg: playerBonusDmgRef.current, equip: equipBonusesRef.current,
        skills: skillBonusesRef.current,
      }).maxHp;
      playerMaxHpRef.current = newMaxHp;
      setPlayerMaxHp(newMaxHp);
    }
  }, []);

  // ── ClassPanel: profession / specialization choice ──────────────────────────
  const handleChooseProfession = useCallback((pid: string) => {
    if (!classState) return;
    const r = chooseProfession(classState, pid as Parameters<typeof chooseProfession>[1], playerLevel);
    if (r.error) log(r.error);
    else { setClassState(r.state); log('Профессия получена!'); }
  }, [classState, playerLevel, log]);

  const handleChooseSpecialization = useCallback((sid: string) => {
    if (!classState) return;
    const r = chooseSpecialization(classState, sid as Parameters<typeof chooseSpecialization>[1], playerLevel);
    if (r.error) log(r.error);
    else { setClassState(r.state); log('Специализация получена!'); }
  }, [classState, playerLevel, log]);

  // ── TrialPanel: complete the 20/40 trial and apply the player's unlock choice ──
  const handleTrialChoice = useCallback((unlockId: string) => {
    if (!classState || !activeTrial) return;
    const done = completeTrial(questProgress, classState, activeTrial.id, playerLevel);
    setQuestProgress(done.progress);

    const applied = applyTrialChoice(done.classState, unlockId, activeTrial.tier, playerLevel);
    if (applied.error) { log(applied.error); return; }
    setClassState(applied.classState);
    if (applied.log) log(applied.log);
    setShowTrial(false);
  }, [classState, activeTrial, questProgress, playerLevel, log]);

  return {
    handlePickArchetype, handleLevelUp, spendStat,
    classSkills, activeTrial,
    handleChooseProfession, handleChooseSpecialization, handleTrialChoice,
  };
}
