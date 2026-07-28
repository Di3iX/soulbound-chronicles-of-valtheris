// ─── EQUIPMENT SYSTEM ─────────────────────────────────────────────────────────
import type { Item } from './inventory';

export interface Equipment {
  weapon:  Item | null;
  helmet:  Item | null;
  armor:   Item | null;
  gloves:  Item | null;
  boots:   Item | null;
  ring1:   Item | null;
  ring2:   Item | null;
  amulet:  Item | null;
}

/** All bonus fields that equipment can contribute. Extended in v0.1.4. */
export interface EquipBonuses {
  // Original fields
  damage:          number;
  hp:              number;
  strength:        number;
  agility:         number;
  atkSpeedPenalty: number;
  // v0.1.4 extended stats
  vitality:        number;
  intelligence:    number;
  defense:         number;
  critChance:      number;
  critDamage:      number;
  dodgeChance:     number;
  blockChance:     number;
  fireResist:      number;
  electricResist:  number;
  iceResist:       number;
  mana:            number;
}

export const EMPTY_EQUIPMENT: Equipment = {
  weapon: null, helmet: null, armor: null, gloves: null, boots: null,
  ring1: null, ring2: null, amulet: null,
};
export const ZERO_EQUIP_BONUSES: EquipBonuses = {
  damage: 0, hp: 0, strength: 0, agility: 0, atkSpeedPenalty: 0,
  vitality: 0, intelligence: 0, defense: 0, critChance: 0, critDamage: 0, dodgeChance: 0, blockChance: 0, mana: 0,
  fireResist: 0, electricResist: 0, iceResist: 0,
};

export const SLOT_META: Record<keyof Equipment, { label: string; icon: string }> = {
  weapon: { label: 'Оружие',   icon: '⚔️' },
  helmet: { label: 'Шлем',     icon: '⛑️' },
  armor:  { label: 'Броня',    icon: '🧥' },
  gloves: { label: 'Перчатки', icon: '🧤' },
  boots:  { label: 'Обувь',    icon: '👟' },
  ring1:  { label: 'Кольцо 1', icon: '💍' },
  ring2:  { label: 'Кольцо 2', icon: '💍' },
  amulet: { label: 'Амулет',   icon: '📿' },
};

/** Which equipment slot (if any) currently holds this exact item instance. Handles ring1/ring2 correctly. */
export function findEquippedSlot(eq: Equipment, item: Item): keyof Equipment | null {
  const entry = (Object.entries(eq) as [keyof Equipment, Item | null][]).find(([, v]) => v?.id === item.id);
  return entry ? entry[0] : null;
}

/** Sum all stat bonuses from currently equipped items. */
export function calcEquipBonuses(eq: Equipment): EquipBonuses {
  return (Object.values(eq).filter(Boolean) as Item[]).reduce(
    (acc, item) => ({
      damage:          acc.damage          + (item.bonuses.damage          ?? 0),
      hp:              acc.hp              + (item.bonuses.hp              ?? 0),
      strength:        acc.strength        + (item.bonuses.strength        ?? 0),
      agility:         acc.agility         + (item.bonuses.agility         ?? 0),
      atkSpeedPenalty: acc.atkSpeedPenalty + (item.bonuses.atkSpeedPenalty ?? 0),
      vitality:        acc.vitality        + (item.bonuses.vitality        ?? 0),
      intelligence:    acc.intelligence    + (item.bonuses.intelligence    ?? 0),
      defense:         acc.defense         + (item.bonuses.defense         ?? 0),
      critChance:      acc.critChance      + (item.bonuses.critChance      ?? 0),
      critDamage:      acc.critDamage      + (item.bonuses.critDamage      ?? 0),
      dodgeChance:     acc.dodgeChance     + (item.bonuses.dodgeChance     ?? 0),
      blockChance:     acc.blockChance     + (item.bonuses.blockChance     ?? 0),
      fireResist:      acc.fireResist      + (item.bonuses.fireResist     ?? 0),
      electricResist:  acc.electricResist  + (item.bonuses.electricResist ?? 0),
      iceResist:       acc.iceResist       + (item.bonuses.iceResist      ?? 0),
      mana:            acc.mana            + (item.bonuses.mana           ?? 0),
    }),
    { ...ZERO_EQUIP_BONUSES }
  );
}
