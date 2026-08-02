// ─── EQUIPMENT UPGRADE SYSTEM ─────────────────────────────────────────────────
import type { Item, ItemBonuses } from '../inventory';
import { ITEM_CATALOG } from '../inventory';

export const MAX_UPGRADE_LEVEL = 5;

const RARITY_GOLD_MULT: Record<string, number> = {
  common: 1,
  uncommon: 1.4,
  rare: 2,
  epic: 3,
  legendary: 4.5,
};

/** Gold cost to reach `nextLevel` (1..MAX). */
export function upgradeGoldCost(item: Item, nextLevel: number): number {
  const m = RARITY_GOLD_MULT[item.rarity] ?? 1;
  return Math.floor(40 * nextLevel * nextLevel * m);
}

export function upgradeCrystalCost(nextLevel: number): number {
  if (nextLevel <= 2) return 1;
  if (nextLevel <= 4) return 2;
  return 3;
}

export function canUpgradeItem(item: Item): boolean {
  if (item.type === 'consumable') return false;
  return (item.upgradeLevel ?? 0) < MAX_UPGRADE_LEVEL;
}

/** Scale catalog base bonuses: +12% per upgrade level. */
export function bonusesAtLevel(base: ItemBonuses, level: number): ItemBonuses {
  if (level <= 0) return { ...base };
  const mult = 1 + level * 0.12;
  const out: ItemBonuses = {};
  for (const key of Object.keys(base) as (keyof ItemBonuses)[]) {
    const v = base[key];
    if (v === undefined || v === 0) continue;
    const scaled = typeof v === 'number' && Number.isInteger(v)
      ? Math.round(v * mult)
      : Math.round((v as number) * mult * 10) / 10;
    (out as Record<string, number>)[key] = scaled;
  }
  return out;
}

function catalogBase(item: Item): ItemBonuses {
  return { ...(ITEM_CATALOG[item.key]?.bonuses ?? item.bonuses) };
}

export function previewUpgrade(item: Item): {
  nextLevel: number;
  gold: number;
  crystals: number;
  bonuses: ItemBonuses;
} | null {
  if (!canUpgradeItem(item)) return null;
  const next = (item.upgradeLevel ?? 0) + 1;
  return {
    nextLevel: next,
    gold: upgradeGoldCost(item, next),
    crystals: upgradeCrystalCost(next),
    bonuses: bonusesAtLevel(catalogBase(item), next),
  };
}

/**
 * Upgrade one step. Removes the old item id from inventory, adds upgraded copy.
 * Does NOT handle equipped gear — App should unequip or upgrade equipment slot separately.
 */
export function upgradeItemInInventory(
  itemId: string,
  inventory: Item[],
  gold: number,
): {
  ok: true;
  item: Item;
  inventory: Item[];
  gold: number;
  msg: string;
} | {
  ok: false;
  reason: string;
} {
  const item = inventory.find(i => i.id === itemId);
  if (!item) return { ok: false, reason: 'Предмет не найден в инвентаре.' };
  if (!canUpgradeItem(item)) {
    return { ok: false, reason: 'Достигнут макс. уровень или это расходник.' };
  }

  const next = (item.upgradeLevel ?? 0) + 1;
  const costGold = upgradeGoldCost(item, next);
  const costCry = upgradeCrystalCost(next);
  if (gold < costGold) return { ok: false, reason: `Нужно ${costGold} золота.` };

  const cryCount = inventory.filter(i => i.key === 'black_crystal').length;
  if (cryCount < costCry) return { ok: false, reason: `Нужно ${costCry} чёрных кристалла.` };

  let cryLeft = costCry;
  const nextInv: Item[] = [];
  for (const it of inventory) {
    if (it.id === itemId) continue;
    if (it.key === 'black_crystal' && cryLeft > 0) {
      cryLeft -= 1;
      continue;
    }
    nextInv.push(it);
  }

  const upgraded: Item = {
    ...item,
    upgradeLevel: next,
    bonuses: bonusesAtLevel(catalogBase(item), next),
  };
  nextInv.push(upgraded);

  return {
    ok: true,
    item: upgraded,
    inventory: nextInv,
    gold: gold - costGold,
    msg: `⚒️ ${item.name} → +${next} (−${costGold}💰, −${costCry} кристалл)`,
  };
}

/** Upgrade an equipped item in place (same id). */
export function upgradeEquippedItem(
  item: Item,
  inventory: Item[],
  gold: number,
): {
  ok: true;
  item: Item;
  inventory: Item[];
  gold: number;
  msg: string;
} | {
  ok: false;
  reason: string;
} {
  if (!canUpgradeItem(item)) {
    return { ok: false, reason: 'Достигнут макс. уровень или это расходник.' };
  }
  const next = (item.upgradeLevel ?? 0) + 1;
  const costGold = upgradeGoldCost(item, next);
  const costCry = upgradeCrystalCost(next);
  if (gold < costGold) return { ok: false, reason: `Нужно ${costGold} золота.` };
  const cryCount = inventory.filter(i => i.key === 'black_crystal').length;
  if (cryCount < costCry) return { ok: false, reason: `Нужно ${costCry} чёрных кристалла.` };

  let cryLeft = costCry;
  const nextInv: Item[] = [];
  for (const it of inventory) {
    if (it.key === 'black_crystal' && cryLeft > 0) {
      cryLeft -= 1;
      continue;
    }
    nextInv.push(it);
  }

  const upgraded: Item = {
    ...item,
    upgradeLevel: next,
    bonuses: bonusesAtLevel(catalogBase(item), next),
  };

  return {
    ok: true,
    item: upgraded,
    inventory: nextInv,
    gold: gold - costGold,
    msg: `⚒️ ${item.name} → +${next} (−${costGold}💰, −${costCry} кристалл)`,
  };
}
