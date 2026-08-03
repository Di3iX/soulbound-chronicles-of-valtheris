// ─── ENCHANTMENT SYSTEM ───────────────────────────────────────────────────────
import type { Item, ItemBonuses, ItemType } from './inventory';
import { ITEM_CATALOG, mergeBonuses } from './inventory';
import { recomputeItemBonuses } from './tierPromote';

export interface EnchantDef {
  id: string;
  name: string;
  description: string;
  /** Applied bonuses */
  bonuses: ItemBonuses;
  /** Gold cost */
  gold: number;
  /** Black crystals */
  crystals: number;
  /** Allowed gear types */
  types: ItemType[];
  /** Min item tier (1–6) */
  minTier?: number;
}

export const ENCHANT_DEFS: EnchantDef[] = [
  {
    id: 'sharp',
    name: 'Заточка',
    description: '+урона к оружию',
    bonuses: { damage: 3 },
    gold: 80, crystals: 1,
    types: ['weapon'],
    minTier: 1,
  },
  {
    id: 'keen',
    name: 'Острый край',
    description: '+крит к оружию',
    bonuses: { critChance: 3, damage: 1 },
    gold: 150, crystals: 2,
    types: ['weapon'],
    minTier: 2,
  },
  {
    id: 'vampiric',
    name: 'Жажда',
    description: '+HP и урон',
    bonuses: { damage: 2, hp: 15 },
    gold: 220, crystals: 3,
    types: ['weapon'],
    minTier: 3,
  },
  {
    id: 'sturdy',
    name: 'Крепость',
    description: '+защита и HP',
    bonuses: { defense: 3, hp: 20 },
    gold: 100, crystals: 1,
    types: ['helmet', 'armor', 'gloves', 'boots'],
    minTier: 1,
  },
  {
    id: 'guardian',
    name: 'Страж',
    description: '+блок и защита',
    bonuses: { defense: 4, blockChance: 3 },
    gold: 180, crystals: 2,
    types: ['armor', 'helmet'],
    minTier: 2,
  },
  {
    id: 'shadow_step',
    name: 'Шаг тени',
    description: '+уклонение',
    bonuses: { dodgeChance: 4, agility: 2 },
    gold: 160, crystals: 2,
    types: ['boots', 'gloves'],
    minTier: 2,
  },
  {
    id: 'wise',
    name: 'Мудрость',
    description: '+мана и интеллект',
    bonuses: { mana: 25, intelligence: 2 },
    gold: 140, crystals: 2,
    types: ['ring', 'amulet', 'helmet'],
    minTier: 2,
  },
  {
    id: 'flame_ward',
    name: 'Огненный щит',
    description: '+сопр. огню',
    bonuses: { fireResist: 10, defense: 1 },
    gold: 200, crystals: 2,
    types: ['armor', 'amulet', 'ring'],
    minTier: 3,
  },
  {
    id: 'frost_ward',
    name: 'Ледяной щит',
    description: '+сопр. льду',
    bonuses: { iceResist: 10, hp: 10 },
    gold: 200, crystals: 2,
    types: ['armor', 'amulet', 'ring'],
    minTier: 3,
  },
  {
    id: 'abyss_touch',
    name: 'Касание Бездны',
    description: 'Мощный урон и крит',
    bonuses: { damage: 5, critChance: 2, critDamage: 8 },
    gold: 400, crystals: 5,
    types: ['weapon', 'ring', 'amulet'],
    minTier: 4,
  },
];

export function getEnchant(id: string): EnchantDef | undefined {
  return ENCHANT_DEFS.find(e => e.id === id);
}

export function enchantsForItem(item: Item): EnchantDef[] {
  const tier = item.tier ?? 1;
  return ENCHANT_DEFS.filter(e =>
    e.types.includes(item.type) && (e.minTier ?? 1) <= tier,
  );
}

function spendCrystals(inventory: Item[], n: number): Item[] | null {
  if (inventory.filter(i => i.key === 'black_crystal').length < n) return null;
  let left = n;
  const out: Item[] = [];
  for (const it of inventory) {
    if (it.key === 'black_crystal' && left > 0) { left--; continue; }
    out.push(it);
  }
  return out;
}

/**
 * Apply or replace enchant on item.
 * Recalculates bonuses = tier/upgrade base + affixes + enchant.
 */
export function applyEnchant(
  item: Item,
  enchantId: string,
  inventory: Item[],
  gold: number,
  itemInBag: boolean,
): { ok: true; item: Item; inventory: Item[]; gold: number; msg: string } | { ok: false; reason: string } {
  if (item.type === 'consumable') {
    return { ok: false, reason: 'Расходники нельзя зачаровать.' };
  }
  const def = getEnchant(enchantId);
  if (!def) return { ok: false, reason: 'Неизвестное зачарование.' };
  if (!def.types.includes(item.type)) {
    return { ok: false, reason: 'Зачарование не подходит к этому предмету.' };
  }
  if ((item.tier ?? 1) < (def.minTier ?? 1)) {
    return { ok: false, reason: `Нужен тир T${def.minTier}+.` };
  }
  if (gold < def.gold) return { ok: false, reason: `Нужно ${def.gold} золота.` };

  let bag = itemInBag ? inventory.filter(i => i.id !== item.id) : [...inventory];
  const after = spendCrystals(bag, def.crystals);
  if (!after) return { ok: false, reason: `Нужно ${def.crystals} чёрных кристалла.` };

  const enchanted: Item = {
    ...item,
    enchantId: def.id,
    enchantName: def.name,
  };
  // bonuses = recompute (tier+upgrade+affixes) then + enchant
  const core = recomputeItemBonuses({ ...enchanted, enchantId: undefined });
  enchanted.bonuses = mergeBonuses(core, [{ id: def.id, label: def.name, bonuses: def.bonuses }]);

  const inv = itemInBag ? [...after, enchanted] : after;
  const replaced = item.enchantId ? ' (заменено)' : '';
  return {
    ok: true,
    item: enchanted,
    inventory: inv,
    gold: gold - def.gold,
    msg: `🔮 ${item.name}: «${def.name}»${replaced} (−${def.gold}💰, −${def.crystals} кристалл)`,
  };
}

/** Remove enchant, refund nothing. */
export function clearEnchant(item: Item): Item {
  const next = { ...item };
  delete next.enchantId;
  delete next.enchantName;
  next.bonuses = recomputeItemBonuses(next);
  return next;
}
