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
  levelMpBonusRef: MutableRefObject<number>;
  playerBonusDmgRef: MutableRefObject<number>;
  skillBonusesRef: MutableRefObject<SkillBonuses>;
  playerMaxHpRef:  MutableRefObject<number>;
  playerHpRef:     MutableRefObject<number>;
  playerMaxMpRef:  MutableRefObject<number>;
  playerMpRef:     MutableRefObject<number>;

  setEquipment:    (v: Equipment) => void;
  setInventory:    Dispatch<SetStateAction<Item[]>>;
  setEquipBonuses: (v: EquipBonuses) => void;
  setPlayerMaxHp:  (v: number) => void;
  setPlayerHp:     (v: number) => void;
  setPlayerMaxMp:  (v: number) => void;
  setPlayerMp:     (v: number) => void;
  setSelectedItem: (v: Item | null) => void;

  log: (msg: string) => void;
}

/** Equip/unequip: swaps gear, recalcs equipment bonuses and max HP/MP from scratch each time (no double-counting). */
export function useEquipment(ctx: EquipmentCtx) {
  const {
    equipmentRef, equipBonusesRef, statsRef, levelHpBonusRef, levelMpBonusRef, playerBonusDmgRef,
    skillBonusesRef, playerMaxHpRef, playerHpRef, playerMaxMpRef, playerMpRef,
    setEquipment, setInventory, setEquipBonuses, setPlayerMaxHp, setPlayerHp,
    setPlayerMaxMp, setPlayerMp, setSelectedItem,
    log,
  } = ctx;

  const equipItem = useCallback((item: Item) => {
    // Rings are the only type with more than one slot: fill an empty ring slot
    // first, falling back to replacing ring1 if both are already occupied.
    const slot: keyof Equipment = item.type === 'ring'
      ? (!equipmentRef.current.ring1 ? 'ring1' : !equipmentRef.current.ring2 ? 'ring2' : 'ring1')
      : (item.type as keyof Equipment);
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

    // Recalc max HP/MP via central stats module
    const newStats = computeStats({
      base: statsRef.current, levelHpBonus: levelHpBonusRef.current, levelMpBonus: levelMpBonusRef.current,
      bonusDmg: playerBonusDmgRef.current, equip: newBonuses,
      skills: skillBonusesRef.current,
    });
    const newMaxHp = newStats.maxHp;
    const newMaxMp = newStats.maxMp;
    playerMaxHpRef.current = newMaxHp;
    setPlayerMaxHp(newMaxHp);
    playerMaxMpRef.current = newMaxMp;
    setPlayerMaxMp(newMaxMp);

    // Increase current HP by the positive HP delta (first equip of HP item)
    const hpDelta = newBonuses.hp - oldBonuses.hp;
    if (hpDelta > 0) {
      const newHp = Math.min(newMaxHp, playerHpRef.current + hpDelta);
      playerHpRef.current = newHp;
      setPlayerHp(newHp);
    }

    // Increase current MP by the positive MP delta (first equip of a mana item)
    const mpDelta = newBonuses.mana - oldBonuses.mana;
    if (mpDelta > 0) {
      const newMp = Math.min(newMaxMp, playerMpRef.current + mpDelta);
      playerMpRef.current = newMp;
      setPlayerMp(newMp);
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

    // Recalc max HP/MP via central stats module
    const newStats = computeStats({
      base: statsRef.current, levelHpBonus: levelHpBonusRef.current, levelMpBonus: levelMpBonusRef.current,
      bonusDmg: playerBonusDmgRef.current, equip: newBonuses,
      skills: skillBonusesRef.current,
    });
    const newMaxHp = newStats.maxHp;
    const newMaxMp = newStats.maxMp;
    playerMaxHpRef.current = newMaxHp;
    setPlayerMaxHp(newMaxHp);
    playerMaxMpRef.current = newMaxMp;
    setPlayerMaxMp(newMaxMp);

    // Clamp current HP to new (lower) max if necessary
    const hpDelta = newBonuses.hp - oldBonuses.hp; // will be negative or zero
    if (hpDelta < 0) {
      const clampedHp = Math.min(playerHpRef.current, newMaxHp);
      if (clampedHp !== playerHpRef.current) {
        playerHpRef.current = clampedHp;
        setPlayerHp(clampedHp);
      }
    }

    // Clamp current MP to new (lower) max if necessary
    const mpDelta = newBonuses.mana - oldBonuses.mana; // will be negative or zero
    if (mpDelta < 0) {
      const clampedMp = Math.min(playerMpRef.current, newMaxMp);
      if (clampedMp !== playerMpRef.current) {
        playerMpRef.current = clampedMp;
        setPlayerMp(clampedMp);
      }
    }

    setSelectedItem(null);
    log(`📤 Снято: ${item.name}`);
  }, [log]);

  return { equipItem, unequipItem };
}
