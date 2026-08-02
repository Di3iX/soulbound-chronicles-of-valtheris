// ─── EQUIPMENT UPGRADE SYSTEM (with failure chance) ───────────────────────────
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

function catalogBase(item: Item): ItemBonuses {
  return { ...(ITEM_CATALOG[item.key]?.bonuses ?? item.bonuses) };
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

/**
 * Success chance to go FROM current level TO next (0–1).
 * Higher target level and rarity → lower chance.
 */
export function upgradeSuccessChance(item: Item, nextLevel: number): number {
  // Base by target level: +1 easy … +5 hard
  const byLevel = [0, 0.92, 0.80, 0.65, 0.50, 0.35][nextLevel] ?? 0.30;
  const rarityPenalty: Record<string, number> = {
    common: 0,
    uncommon: 0.03,
    rare: 0.06,
    epic: 0.10,
    legendary: 0.14,
  };
  const p = byLevel - (rarityPenalty[item.rarity] ?? 0);
  return Math.max(0.12, Math.min(0.95, p));
}

export type UpgradeFailKind = 'safe' | 'downgrade' | 'destroy';

/**
 * On failure, roll severity (after materials already spent).
 * - safe: ~70% — only lose gold/crystals
 * - downgrade: ~25% — lose 1 upgrade level (min 0)
 * - destroy: ~5% — item destroyed (only if nextLevel >= 4)
 */
export function rollFailSeverity(nextLevel: number): UpgradeFailKind {
  const r = Math.random();
  if (nextLevel >= 4 && r < 0.05) return 'destroy';
  if (r < 0.30) return 'downgrade'; // 25% of remaining ≈ displayed as ~25%
  return 'safe';
}

export function previewUpgrade(item: Item): {
  nextLevel: number;
  gold: number;
  crystals: number;
  bonuses: ItemBonuses;
  successChance: number;
  /** Human-readable risk note */
  riskNote: string;
} | null {
  if (!canUpgradeItem(item)) return null;
  const next = (item.upgradeLevel ?? 0) + 1;
  const chance = upgradeSuccessChance(item, next);
  let riskNote = 'При провале: материалы сгорают';
  if (next >= 3) riskNote += ', возможен откат уровня';
  if (next >= 4) riskNote += ', редкий шанс уничтожения';
  return {
    nextLevel: next,
    gold: upgradeGoldCost(item, next),
    crystals: upgradeCrystalCost(next),
    bonuses: bonusesAtLevel(catalogBase(item), next),
    successChance: chance,
    riskNote,
  };
}

function spendCrystals(inventory: Item[], costCry: number): Item[] | null {
  const have = inventory.filter(i => i.key === 'black_crystal').length;
  if (have < costCry) return null;
  let left = costCry;
  const next: Item[] = [];
  for (const it of inventory) {
    if (it.key === 'black_crystal' && left > 0) {
      left -= 1;
      continue;
    }
    next.push(it);
  }
  return next;
}

export type UpgradeResult =
  | { ok: true; success: true; item: Item; inventory: Item[]; gold: number; msg: string }
  | { ok: true; success: false; failKind: UpgradeFailKind; item: Item | null; inventory: Item[]; gold: number; msg: string }
  | { ok: false; reason: string };

function applyUpgradeAttempt(
  item: Item,
  inventoryWithoutItem: Item[],
  gold: number,
  /** If true, item was equipped and must stay "in play" unless destroyed */
  keepItemReference: boolean,
): UpgradeResult {
  if (!canUpgradeItem(item)) {
    return { ok: false, reason: 'Достигнут макс. уровень или это расходник.' };
  }
  const next = (item.upgradeLevel ?? 0) + 1;
  const costGold = upgradeGoldCost(item, next);
  const costCry = upgradeCrystalCost(next);
  if (gold < costGold) return { ok: false, reason: `Нужно ${costGold} золота.` };

  const afterCry = spendCrystals(inventoryWithoutItem, costCry);
  if (!afterCry) return { ok: false, reason: `Нужно ${costCry} чёрных кристалла.` };

  const newGold = gold - costGold;
  const chance = upgradeSuccessChance(item, next);
  const rolled = Math.random();

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (rolled < chance) {
    const upgraded: Item = {
      ...item,
      upgradeLevel: next,
      bonuses: bonusesAtLevel(catalogBase(item), next),
    };
    const inv = keepItemReference ? afterCry : [...afterCry, upgraded];
    return {
      ok: true,
      success: true,
      item: upgraded,
      inventory: inv,
      gold: newGold,
      msg: `✨ Успех! ${item.name} → +${next} (−${costGold}💰, −${costCry} кристалл)`,
    };
  }

  // ── FAILURE ───────────────────────────────────────────────────────────────
  const kind = rollFailSeverity(next);

  if (kind === 'destroy') {
    return {
      ok: true,
      success: false,
      failKind: 'destroy',
      item: null,
      inventory: afterCry,
      gold: newGold,
      msg: `💥 Провал! ${item.name} разрушен… (−${costGold}💰, −${costCry} кристалл)`,
    };
  }

  if (kind === 'downgrade') {
    const cur = item.upgradeLevel ?? 0;
    const down = Math.max(0, cur - 1);
    const downgraded: Item = {
      ...item,
      upgradeLevel: down,
      bonuses: bonusesAtLevel(catalogBase(item), down),
    };
    const inv = keepItemReference ? afterCry : [...afterCry, downgraded];
    return {
      ok: true,
      success: false,
      failKind: 'downgrade',
      item: downgraded,
      inventory: inv,
      gold: newGold,
      msg: `⚠️ Провал! ${item.name} откат до +${down} (−${costGold}💰, −${costCry} кристалл)`,
    };
  }

  // safe fail — item unchanged
  const inv = keepItemReference ? afterCry : [...afterCry, item];
  return {
    ok: true,
    success: false,
    failKind: 'safe',
    item,
    inventory: inv,
    gold: newGold,
    msg: `❌ Провал улучшения ${item.name}. Вещь цела, материалы сгорели (−${costGold}💰, −${costCry} кристалл). Шанс был ${Math.round(chance * 100)}%.`,
  };
}

/** Upgrade item from inventory bag (by id). */
export function upgradeItemInInventory(
  itemId: string,
  inventory: Item[],
  gold: number,
): UpgradeResult {
  const item = inventory.find(i => i.id === itemId);
  if (!item) return { ok: false, reason: 'Предмет не найден в инвентаре.' };
  const without = inventory.filter(i => i.id !== itemId);
  return applyUpgradeAttempt(item, without, gold, false);
}

/** Upgrade equipped item — inventory is only for paying crystals; item not in bag. */
export function upgradeEquippedItem(
  item: Item,
  inventory: Item[],
  gold: number,
): UpgradeResult {
  return applyUpgradeAttempt(item, inventory, gold, true);
}
