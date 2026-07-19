import { useCallback } from 'react';
import { xpRequired, STAT_POINTS_PER_LEVEL } from '../combat';
import { SKILL_POINTS_PER_LEVEL } from '../skills/skills';
import { computeStats, BaseStats } from '../stats';
import { EquipBonuses } from '../equipment';
import { SkillBonuses } from '../skills/skillTree';

export interface LevelUpResult {
  newXp: number;
  newLevel: number;
  newBonusDmg: number;
  newLevelHpBonus: number;
  newMaxHp: number;
  newStatPts: number;
  newSkillPts: number;
  leveledUp: boolean;
  xpToNext: number;
}

interface LevelUpParams {
  currentXp: number;
  currentLevel: number;
  currentBonusDmg: number;
  currentLevelHpBonus: number;
  stats: BaseStats;
  equipBonuses: EquipBonuses;
  skillBonuses: SkillBonuses;
  xpGain: number;
}

/**
 * Вычисляет результат получения опыта, включая level-up логику
 * Используется в applyRewards, handleBossDeath, handleQuestAction
 */
export function useLevelUp() {
  const calculateLevelUp = useCallback((params: LevelUpParams): LevelUpResult => {
    const {
      currentXp,
      currentLevel,
      currentBonusDmg,
      currentLevelHpBonus,
      stats,
      equipBonuses,
      skillBonuses,
      xpGain,
    } = params;

    let newXp = currentXp + xpGain;
    let newLevel = currentLevel;
    let newBonusDmg = currentBonusDmg;
    let hpBonusDelta = 0;
    let newStatPts = 0;
    let newSkillPts = 0;
    let leveledUp = false;
    let needed = xpRequired(newLevel);

    // Level-up loop
    while (newXp >= needed) {
      newXp -= needed;
      newLevel++;
      newBonusDmg += 2;
      hpBonusDelta += 20;
      newStatPts += STAT_POINTS_PER_LEVEL;
      newSkillPts += SKILL_POINTS_PER_LEVEL;
      needed = xpRequired(newLevel);
      leveledUp = true;
    }

    const newLevelHpBonus = currentLevelHpBonus + hpBonusDelta;
    const newMaxHp = computeStats({
      base: stats,
      levelHpBonus: newLevelHpBonus,
      bonusDmg: newBonusDmg,
      equip: equipBonuses,
      skills: skillBonuses,
    }).maxHp;

    return {
      newXp,
      newLevel,
      newBonusDmg,
      newLevelHpBonus,
      newMaxHp,
      newStatPts,
      newSkillPts,
      leveledUp,
      xpToNext: needed,
    };
  }, []);

  return { calculateLevelUp };
}
