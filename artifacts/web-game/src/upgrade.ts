// ─── EQUIPMENT UPGRADE SYSTEM (failure + protection scrolls) ──────────────────
import type { Item, ItemBonuses } from './inventory';
import { ITEM_CATALOG, mergeBonuses } from './inventory';

export const MAX_UPGRADE_LEVEL = 5;

/** Protection tier chosen by player for this attempt. */
export type ProtectMode = 'none' | 'protect' | 'protect_plus' | 'blessing';

export const PROTECT_ITEM_KEY: Record<Exclude<ProtectMode, 'none'>, string> = {
  protect:      'upgrade_protect',
  protect_plus: 'upgrade_protect_plus',
  blessing:     'upgrade_blessing',
};

export const PROTECT_LABEL: Record<ProtectMode, string> = {
  none:         'Без защиты',
  protect:      'Свиток защиты — нет уничтожения',
  protect_plus: 'Надёжная защита — нет уничтожения и отката',
  blessing:     'Благословение — гарантия успеха',
};

const RARITY_GOLD_MULT: Record<string, number> = {
  common: 1, uncommon: 1.4, rare: 2, epic: 3, legendary: 4.5,
};

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
  return { ...(ITEM_CATALOG[item.key]?.bonuses ?? {}) };
}

function finalItemBonuses(item: Item, level: number): ItemBonuses {
  return mergeBonuses(bonusesAtLevel(catalogBase(item), level), item.affixes);
}

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

export function upgradeSuccessChance(item: Item, nextLevel: number): number {
  const byLevel = [0, 0.92, 0.80, 0.65, 0.50, 0.35][nextLevel] ?? 0.30;
  const rarityPenalty: Record<string, number> = {
    common: 0, uncommon: 0.03, rare: 0.06, epic: 0.10, legendary: 0.14,
  };
  const p = byLevel - (rarityPenalty[item.rarity] ?? 0);
  return Math.max(0.12, Math.min(0.95, p));
}

export type UpgradeFailKind = 'safe' | 'downgrade' | 'destroy';

export function rollFailSeverity(nextLevel: number): UpgradeFailKind {
  const r = Math.random();
  if (nextLevel >= 4 && r < 0.05) return 'destroy';
  if (r < 0.30) return 'downgrade';
  return 'safe';
}

export function previewUpgrade(item: Item, protect: ProtectMode = 'none'): {
  nextLevel: number;
  gold: number;
  crystals: number;
  bonuses: ItemBonuses;
  successChance: number;
  riskNote: string;
  protectKey?: string;
} | null {
  if (!canUpgradeItem(item)) return null;
  const next = (item.upgradeLevel ?? 0) + 1;
  let chance = upgradeSuccessChance(item, next);
  let riskNote = 'При провале: материалы сгорают';
  if (protect === 'blessing') {
    chance = 1;
    riskNote = 'Благословение: успех 100%, свиток расходуется';
  } else if (protect === 'protect_plus') {
    riskNote = 'Надёжная защита: при провале только потеря материалов (нет отката/уничтожения)';
  } else if (protect === 'protect') {
    riskNote = 'Защита: нет уничтожения; возможен откат уровня';
    if (next >= 3) riskNote += '';
  } else {
    if (next >= 3) riskNote += ', возможен откат';
    if (next >= 4) riskNote += ', редкий шанс уничтожения';
  }
  return {
    nextLevel: next,
    gold: upgradeGoldCost(item, next),
    crystals: upgradeCrystalCost(next),
    bonuses: finalItemBonuses(item, next),
    successChance: chance,
    riskNote,
    protectKey: protect === 'none' ? undefined : PROTECT_ITEM_KEY[protect],
  };
}

function spendKeys(inventory: Item[], key: string, count: number): Item[] | null {
  const have = inventory.filter(i => i.key === key).length;
  if (have < count) return null;
  let left = count;
  const next: Item[] = [];
  for (const it of inventory) {
    if (it.key === key && left > 0) {
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
  keepItemReference: boolean,
  protect: ProtectMode,
): UpgradeResult {
  if (!canUpgradeItem(item)) {
    return { ok: false, reason: 'Достигнут макс. уровень или это расходник.' };
  }
  const next = (item.upgradeLevel ?? 0) + 1;
  const costGold = upgradeGoldCost(item, next);
  const costCry = upgradeCrystalCost(next);
  if (gold < costGold) return { ok: false, reason: `Нужно ${costGold} золота.` };

  let bag = spendKeys(inventoryWithoutItem, 'black_crystal', costCry);
  if (!bag) return { ok: false, reason: `Нужно ${costCry} чёрных кристалла.` };

  if (protect !== 'none') {
    const pKey = PROTECT_ITEM_KEY[protect];
    const afterP = spendKeys(bag, pKey, 1);
    if (!afterP) {
      return { ok: false, reason: `Нужен: ${ITEM_CATALOG[pKey]?.name ?? pKey}` };
    }
    bag = afterP;
  }

  const newGold = gold - costGold;
  let chance = upgradeSuccessChance(item, next);
  if (protect === 'blessing') chance = 1;

  const rolled = Math.random();
  const protNote = protect !== 'none' ? `, ${PROTECT_LABEL[protect].split('—')[0].trim()}` : '';

  if (rolled < chance) {
    const upgraded: Item = {
      ...item,
      upgradeLevel: next,
      bonuses: finalItemBonuses(item, next),
    };
    const inv = keepItemReference ? bag : [...bag, upgraded];
    return {
      ok: true,
      success: true,
      item: upgraded,
      inventory: inv,
      gold: newGold,
      msg: `✨ Успех! ${item.name} → +${next} (−${costGold}💰, −${costCry} кристалл${protNote})`,
    };
  }

  // Failure — apply protection rules
  let kind = rollFailSeverity(next);
  if (protect === 'protect_plus') {
    kind = 'safe';
  } else if (protect === 'protect' && kind === 'destroy') {
    kind = 'downgrade'; // or safe — softer: destroy → downgrade
    if (Math.random() < 0.5) kind = 'safe';
  }

  if (kind === 'destroy') {
    return {
      ok: true,
      success: false,
      failKind: 'destroy',
      item: null,
      inventory: bag,
      gold: newGold,
      msg: `💥 Провал! ${item.name} разрушен… (−${costGold}💰, −${costCry} кристалл${protNote})`,
    };
  }

  if (kind === 'downgrade') {
    const cur = item.upgradeLevel ?? 0;
    const down = Math.max(0, cur - 1);
    const downgraded: Item = {
      ...item,
      upgradeLevel: down,
      bonuses: finalItemBonuses(item, down),
    };
    const inv = keepItemReference ? bag : [...bag, downgraded];
    return {
      ok: true,
      success: false,
      failKind: 'downgrade',
      item: downgraded,
      inventory: inv,
      gold: newGold,
      msg: `⚠️ Провал! ${item.name} откат до +${down} (−${costGold}💰, −${costCry} кристалл${protNote})`,
    };
  }

  const inv = keepItemReference ? bag : [...bag, item];
  return {
    ok: true,
    success: false,
    failKind: 'safe',
    item,
    inventory: inv,
    gold: newGold,
    msg: `❌ Провал. ${item.name} цел, материалы сгорели (−${costGold}💰, −${costCry} кристалл${protNote}). Шанс был ${Math.round(chance * 100)}%.`,
  };
}

export function upgradeItemInInventory(
  itemId: string,
  inventory: Item[],
  gold: number,
  protect: ProtectMode = 'none',
): UpgradeResult {
  const item = inventory.find(i => i.id === itemId);
  if (!item) return { ok: false, reason: 'Предмет не найден в инвентаре.' };
  const without = inventory.filter(i => i.id !== itemId);
  return applyUpgradeAttempt(item, without, gold, false, protect);
}

export function upgradeEquippedItem(
  item: Item,
  inventory: Item[],
  gold: number,
  protect: ProtectMode = 'none',
): UpgradeResult {
  return applyUpgradeAttempt(item, inventory, gold, true, protect);
}
