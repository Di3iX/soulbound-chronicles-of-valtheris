import { useCallback } from 'react';
import type { MutableRefObject, Dispatch, SetStateAction } from 'react';
import { Item } from '../inventory';
import { Equipment, EquipBonuses, calcEquipBonuses } from '../equipment';
import { BaseStats, SkillBonuses, computeStats } from '../stats';

export interface EquipmentCtx {
  equipmentRef:    MutableRefObject<Equipment>;
  equipBonusesRef: MutableRefObject<EquipBonuses>;
  statsRef:        MutableRefObject<BaseStats>;
  levelHpBonusRef: MutableRefObject<number>;
  playerBonusDmgRef: MutableRefObject<number>;
  skillBonusesRef: MutableRefObject<SkillBonuses>;
  playerMaxHpRef:  MutableRefObject<number>;
  playerHpRef:     MutableRefObject<number>;

  setEquipment:    (v: Equipment) => void;
  setInventory:    Dispatch<SetStateAction<Item[]>>;
  setEquipBonuses: (v: EquipBonuses) => void;
  setPlayerMaxHp:  (v: number) => void;
  setPlayerHp:     (v: number) => void;
  setSelectedItem: (v: Item | null) => void;

  log: (msg: string) => void;
}

/** Equip/unequip: swaps gear, recalcs equipment bonuses and max HP from scratch each time (no double-counting). */
export function useEquipment(ctx: EquipmentCtx) {
  const {
    equipmentRef, equipBonusesRef, statsRef, levelHpBonusRef, playerBonusDmgRef,
    skillBonusesRef, playerMaxHpRef, playerHpRef,
    setEquipment, setInventory, setEquipBonuses, setPlayerMaxHp, setPlayerHp, setSelectedItem,
    log,
  } = ctx;

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

  return { equipItem, unequipItem };
}
