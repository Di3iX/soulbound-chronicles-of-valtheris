// ─── ITEM TIER PROMOTION (T1 → T6) ─────────────────────────────────────────────
import type { Item, ItemBonuses, ItemTier } from '../inventory';
import { ITEM_CATALOG, minLevelForTier } from '../inventory';

// Re-implement scale without depending on upgrade.ts circularly
function scaleBonuses(base: ItemBonuses, mult: number): ItemBonuses {
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

/** Multiplier on catalog base stats by tier (T1 = 1.0). */
export const TIER_STAT_MULT: Record<ItemTier, number> = {
  1: 1.0,
  2: 1.18,
  3: 1.38,
  4: 1.62,
  5: 1.90,
  6: 2.25,
};

/** Gold to promote FROM current tier TO tier+1. */
export function tierPromoteGoldCost(item: Item): number {
  const t = (item.tier ?? 1) as ItemTier;
  const rarityMult: Record<string, number> = {
    common: 1, uncommon: 1.3, rare: 1.7, epic: 2.3, legendary: 3,
  };
  const m = rarityMult[item.rarity] ?? 1;
  // cost grows sharply: T1→2 cheap, T5→6 expensive
  return Math.floor(120 * t * t * m);
}

/** Black crystals to promote TO next tier. */
export function tierPromoteCrystalCost(currentTier: ItemTier): number {
  return currentTier; // 1→2: 1, 2→3: 2, … 5→6: 5
}

export function canPromoteTier(item: Item): boolean {
  if (item.type === 'consumable') return false;
  const t = item.tier ?? 1;
  return t < 6;
}

export function nextTier(item: Item): ItemTier | null {
  if (!canPromoteTier(item)) return null;
  return ((item.tier ?? 1) + 1) as ItemTier;
}

/**
 * Full stat recalc: catalog base × tier mult × (1 + 0.12 * upgradeLevel).
 */
export function recomputeItemBonuses(item: Item): ItemBonuses {
  const base = { ...(ITEM_CATALOG[item.key]?.bonuses ?? item.bonuses) };
  const tier = (item.tier ?? 1) as ItemTier;
  const up = item.upgradeLevel ?? 0;
  const mult = TIER_STAT_MULT[tier] * (1 + up * 0.12);
  return scaleBonuses(base, mult);
}

export function previewTierPromote(item: Item): {
  from: ItemTier;
  to: ItemTier;
  gold: number;
  crystals: number;
  requiredLevel: number;
  bonuses: ItemBonuses;
} | null {
  const to = nextTier(item);
  if (to == null) return null;
  const from = (item.tier ?? 1) as ItemTier;
  const promoted: Item = { ...item, tier: to, requiredLevel: minLevelForTier(to) };
  return {
    from,
    to,
    gold: tierPromoteGoldCost(item),
    crystals: tierPromoteCrystalCost(from),
    requiredLevel: minLevelForTier(to),
    bonuses: recomputeItemBonuses(promoted),
  };
}

function spendCrystals(inventory: Item[], n: number): Item[] | null {
  if (inventory.filter(i => i.key === 'black_crystal').length < n) return null;
  let left = n;
  const out: Item[] = [];
  for (const it of inventory) {
    if (it.key === 'black_crystal' && left > 0) {
      left -= 1;
      continue;
    }
    out.push(it);
  }
  return out;
}

export type TierPromoteResult =
  | { ok: true; item: Item; inventory: Item[]; gold: number; msg: string }
  | { ok: false; reason: string };

/**
 * Promote tier by +1. Inventory must contain the item (bag) OR item is separate (equipped).
 * `itemInBag`: if true, remove old id and push new; if false, only spend crystals from bag.
 */
export function promoteItemTier(
  item: Item,
  inventory: Item[],
  gold: number,
  itemInBag: boolean,
): TierPromoteResult {
  const to = nextTier(item);
  if (to == null) return { ok: false, reason: 'Уже максимальный тир (T6).' };

  const from = (item.tier ?? 1) as ItemTier;
  const costG = tierPromoteGoldCost(item);
  const costC = tierPromoteCrystalCost(from);
  if (gold < costG) return { ok: false, reason: `Нужно ${costG} золота.` };

  let bag = itemInBag ? inventory.filter(i => i.id !== item.id) : [...inventory];
  const after = spendCrystals(bag, costC);
  if (!after) return { ok: false, reason: `Нужно ${costC} чёрных кристалла.` };

  const promoted: Item = {
    ...item,
    tier: to,
    requiredLevel: minLevelForTier(to),
  };
  promoted.bonuses = recomputeItemBonuses(promoted);

  const inv = itemInBag ? [...after, promoted] : after;
  return {
    ok: true,
    item: promoted,
    inventory: inv,
    gold: gold - costG,
    msg: `⬆️ ${item.name}: T${from} → T${to} (−${costG}💰, −${costC} кристалл). Нужен ур. ${minLevelForTier(to)}`,
  };
}
