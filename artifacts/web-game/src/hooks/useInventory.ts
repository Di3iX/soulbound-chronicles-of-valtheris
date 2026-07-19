import { useCallback } from 'react';
import { Item, makeItem } from '../inventory';
import { Equipment, EquipBonuses, calcEquipBonuses, ZERO_EQUIP_BONUSES, EMPTY_EQUIPMENT } from '../equipment';
import { computeStats, BaseStats } from '../stats';
import { SkillBonuses } from '../skills/skillTree';

interface EquipItemParams {
  item: Item;
  currentEquipment: Equipment;
  currentEquipBonuses: EquipBonuses;
  stats: BaseStats;
  levelHpBonus: number;
  bonusDmg: number;
  skillBonuses: SkillBonuses;
}

interface EquipItemResult {
  newEquipment: Equipment;
  newBonuses: EquipBonuses;
  newMaxHp: number;
  hpDelta: number;
  displacedItem: Item | null;
}

interface UnequipItemParams {
  slot: keyof Equipment;
  currentEquipment: Equipment;
  currentEquipBonuses: EquipBonuses;
  stats: BaseStats;
  levelHpBonus: number;
  bonusDmg: number;
  skillBonuses: SkillBonuses;
  currentHp: number;
}

interface UnequipItemResult {
  newEquipment: Equipment;
  newBonuses: EquipBonuses;
  newMaxHp: number;
  hpDelta: number;
  item: Item | null;
  clampedHp: number;
}

/**
 * Хук для управления экипировкой и инвентарём
 */
export function useInventory() {
  const equipItem = useCallback((params: EquipItemParams): EquipItemResult => {
    const {
      item,
      currentEquipment,
      currentEquipBonuses,
      stats,
      levelHpBonus,
      bonusDmg,
      skillBonuses,
    } = params;

    const slot = item.type as keyof Equipment;
    const prevItem = currentEquipment[slot];
    const oldBonuses = currentEquipBonuses;

    const newEquipment: Equipment = { ...currentEquipment, [slot]: item };

    // Recalc bonuses from scratch
    const newBonuses = calcEquipBonuses(newEquipment);

    // Recalc max HP
    const newMaxHp = computeStats({
      base: stats,
      levelHpBonus,
      bonusDmg,
      equip: newBonuses,
      skills: skillBonuses,
    }).maxHp;

    // Calculate HP delta
    const hpDelta = newBonuses.hp - oldBonuses.hp;

    return {
      newEquipment,
      newBonuses,
      newMaxHp,
      hpDelta,
      displacedItem: prevItem ?? null,
    };
  }, []);

  const unequipItem = useCallback((params: UnequipItemParams): UnequipItemResult => {
    const {
      slot,
      currentEquipment,
      currentEquipBonuses,
      stats,
      levelHpBonus,
      bonusDmg,
      skillBonuses,
      currentHp,
    } = params;

    const item = currentEquipment[slot];
    if (!item) {
      return {
        newEquipment: currentEquipment,
        newBonuses: currentEquipBonuses,
        newMaxHp: 0,
        hpDelta: 0,
        item: null,
        clampedHp: currentHp,
      };
    }

    const oldBonuses = currentEquipBonuses;
    const newEquipment: Equipment = { ...currentEquipment, [slot]: null };

    // Recalc bonuses from scratch
    const newBonuses = calcEquipBonuses(newEquipment);

    // Recalc max HP
    const newMaxHp = computeStats({
      base: stats,
      levelHpBonus,
      bonusDmg,
      equip: newBonuses,
      skills: skillBonuses,
    }).maxHp;

    // Calculate HP delta (will be negative or zero)
    const hpDelta = newBonuses.hp - oldBonuses.hp;
    const clampedHp = hpDelta < 0 ? Math.min(currentHp, newMaxHp) : currentHp;

    return {
      newEquipment,
      newBonuses,
      newMaxHp,
      hpDelta,
      item,
      clampedHp,
    };
  }, []);

  return {
    equipItem,
    unequipItem,
  };
}
