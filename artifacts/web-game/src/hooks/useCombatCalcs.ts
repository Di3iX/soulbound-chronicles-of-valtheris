import { useCallback } from 'react';
import { computeStats, BaseStats } from '../stats';
import { EquipBonuses } from '../equipment';
import { SkillBonuses } from '../skills/skillTree';

export interface DamageResult {
  damage: number;
  isCrit: boolean;
}

export interface DodgeCheckResult {
  dodged: boolean;
}

export interface DefensiveCalcResult {
  finalDamage: number;
  dodged: boolean;
}

interface ComputeDamageParams {
  stats: BaseStats;
  levelHpBonus: number;
  bonusDmg: number;
  equipBonuses: EquipBonuses;
  skillBonuses: SkillBonuses;
}

interface EnemyDefenseParams {
  enemyDamage: DamageResult;
  shieldActive: boolean;
  defenseStats: ComputedStats;
}

interface ComputedStats {
  dmgMin: number;
  dmgMax: number;
  defense: number;
  dodgeChance: number;
  critChance: number;
  critDamageMult: number;
  attackInterval: number;
}

/**
 * Хук для расчётов урона и защиты в боевой системе
 */
export function useCombatCalcs() {
  const computePlayerDamage = useCallback((params: ComputeDamageParams): DamageResult => {
    const cs = computeStats({
      base: params.stats,
      levelHpBonus: params.levelHpBonus,
      bonusDmg: params.bonusDmg,
      equip: params.equipBonuses,
      skills: params.skillBonuses,
    });

    const damage = Math.floor(Math.random() * (cs.dmgMax - cs.dmgMin + 1)) + cs.dmgMin;
    const isCrit = Math.random() * 100 < cs.critChance;
    const finalDamage = isCrit ? Math.floor(damage * cs.critDamageMult) : damage;

    return { damage: finalDamage, isCrit };
  }, []);

  const checkDodge = useCallback((dodgeChance: number): DodgeCheckResult => {
    const dodged = Math.random() * 100 < dodgeChance;
    return { dodged };
  }, []);

  const computeEnemyDefense = useCallback(
    (
      enemyMinDmg: number,
      enemyMaxDmg: number,
      shieldActive: boolean,
      defenseStats: ComputedStats
    ): DefensiveCalcResult => {
      let damage = Math.floor(Math.random() * (enemyMaxDmg - enemyMinDmg + 1)) + enemyMinDmg;

      // Shield halves damage
      if (shieldActive) {
        damage = Math.ceil(damage / 2);
      }

      // Defense mitigation: dmg × 100/(100+defense)
      if (defenseStats.defense > 0) {
        damage = Math.max(1, Math.floor((damage * 100) / (100 + defenseStats.defense)));
      }

      // Check dodge after damage calculation
      const { dodged } = checkDodge(defenseStats.dodgeChance);

      return {
        finalDamage: dodged ? 0 : damage,
        dodged,
      };
    },
    [checkDodge]
  );

  return {
    computePlayerDamage,
    checkDodge,
    computeEnemyDefense,
  };
}
