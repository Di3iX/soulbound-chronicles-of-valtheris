// ─── INVENTORY / ITEM SYSTEM ──────────────────────────────────────────────────

export type ItemType = 'weapon' | 'helmet' | 'armor' | 'gloves' | 'boots' | 'consumable';
export type Rarity   = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface ItemBonuses {
  damage?:          number;
  hp?:              number;
  strength?:        number;
  agility?:         number;
  atkSpeedPenalty?: number; // % increase to attack interval (slower)
  // v0.1.4 extended stats
  vitality?:        number;
  intelligence?:    number;
  defense?:         number;
  critChance?:      number; // flat % added to crit chance
  critDamage?:      number; // flat % added to crit damage bonus
  dodgeChance?:     number; // flat % added to dodge chance
}

export interface Item {
  id:      string;   // unique instance ID
  key:     string;   // template key
  name:    string;
  type:    ItemType;
  rarity:  Rarity;
  bonuses: ItemBonuses;
}

export const ITEM_CATALOG: Record<string, Omit<Item, 'id'>> = {
  // Consumables
  healing_potion:         { key: 'healing_potion',         name: 'Зелье лечения',        type: 'consumable', rarity: 'common',    bonuses: {} },
  greater_healing_potion: { key: 'greater_healing_potion', name: 'Большое зелье лечения', type: 'consumable', rarity: 'uncommon',  bonuses: {} },
  // Weapons
  rusty_sword:      { key: 'rusty_sword',      name: 'Ржавый меч',         type: 'weapon',  rarity: 'common',    bonuses: { damage: 2 } },
  iron_sword:       { key: 'iron_sword',       name: 'Железный меч',       type: 'weapon',  rarity: 'uncommon',  bonuses: { damage: 5 } },
  orc_axe:          { key: 'orc_axe',          name: 'Топор орка',         type: 'weapon',  rarity: 'rare',      bonuses: { damage: 9, atkSpeedPenalty: 5 } },
  shadow_blade:     { key: 'shadow_blade',     name: 'Теневой клинок',     type: 'weapon',  rarity: 'epic',      bonuses: { damage: 15, agility: 2 } },
  dragon_fang:      { key: 'dragon_fang',      name: 'Клык дракона',       type: 'weapon',  rarity: 'legendary', bonuses: { damage: 25, strength: 3 } },
  // Helmets
  leather_helm:     { key: 'leather_helm',     name: 'Кожаный шлем',       type: 'helmet',  rarity: 'common',    bonuses: { hp: 10 } },
  iron_helm:        { key: 'iron_helm',        name: 'Железный шлем',      type: 'helmet',  rarity: 'uncommon',  bonuses: { hp: 20 } },
  mage_hood:        { key: 'mage_hood',        name: 'Капюшон мага',       type: 'helmet',  rarity: 'rare',      bonuses: { hp: 30, strength: 1 } },
  // Armor
  leather_armor:    { key: 'leather_armor',    name: 'Кожаная броня',      type: 'armor',   rarity: 'common',    bonuses: { hp: 20 } },
  chainmail:        { key: 'chainmail',        name: 'Кольчуга',           type: 'armor',   rarity: 'uncommon',  bonuses: { hp: 40 } },
  plate_armor:      { key: 'plate_armor',      name: 'Латные доспехи',     type: 'armor',   rarity: 'rare',      bonuses: { hp: 60 } },
  void_plate:       { key: 'void_plate',       name: 'Доспехи пустоты',    type: 'armor',   rarity: 'epic',      bonuses: { hp: 90, strength: 2 } },
  // Gloves
  leather_gloves:   { key: 'leather_gloves',   name: 'Кожаные перчатки',   type: 'gloves',  rarity: 'common',    bonuses: { strength: 1 } },
  battle_gloves:    { key: 'battle_gloves',    name: 'Боевые перчатки',    type: 'gloves',  rarity: 'uncommon',  bonuses: { strength: 2 } },
  titan_gauntlets:  { key: 'titan_gauntlets',  name: 'Рукавицы титана',    type: 'gloves',  rarity: 'epic',      bonuses: { strength: 4, hp: 20 } },
  // Boots
  light_boots:      { key: 'light_boots',      name: 'Лёгкие сапоги',      type: 'boots',   rarity: 'common',    bonuses: { agility: 1 } },
  scout_boots:      { key: 'scout_boots',      name: 'Сапоги разведчика',  type: 'boots',   rarity: 'uncommon',  bonuses: { agility: 2 } },
  wind_walkers:     { key: 'wind_walkers',     name: 'Сапоги ветра',       type: 'boots',   rarity: 'legendary', bonuses: { agility: 5, hp: 15 } },
  // Magic weapons
  arcane_staff:     { key: 'arcane_staff',     name: 'Магический посох',   type: 'weapon',  rarity: 'rare',      bonuses: { damage: 8, hp: 20 } },
};

export const DROP_TABLES: Record<string, { chance: number; pool: string[] }> = {
  'Гоблин':          { chance: 0.20, pool: ['rusty_sword', 'leather_helm', 'leather_armor', 'leather_gloves', 'light_boots'] },
  'Волк':            { chance: 0.15, pool: ['rusty_sword', 'leather_helm', 'light_boots',   'leather_gloves'] },
  'Орк':             { chance: 0.50, pool: ['iron_sword',  'orc_axe',      'iron_helm',     'chainmail',     'battle_gloves', 'scout_boots'] },
  'Кабан':           { chance: 0.25, pool: ['rusty_sword', 'leather_armor', 'light_boots'] },
  'Гигантский паук': { chance: 0.35, pool: ['iron_sword',  'leather_gloves', 'scout_boots'] },
  'Скелет':          { chance: 0.30, pool: ['orc_axe',     'iron_helm',      'chainmail'] },
  'Зомби':           { chance: 0.45, pool: ['iron_sword',  'orc_axe',        'iron_helm',  'chainmail', 'battle_gloves', 'scout_boots', 'arcane_staff'] },
};

export const RARITY_STYLE: Record<Rarity, { label: string; border: string; text: string; glow: string; bg: string }> = {
  common:    { label: 'Обычный',     border: 'border-[#555]',       text: 'text-[#aaa]',      glow: '',                                           bg: 'bg-[#111118]' },
  uncommon:  { label: 'Необычный',   border: 'border-green-700',    text: 'text-green-400',   glow: 'shadow-[0_0_6px_rgba(34,197,94,0.25)]',      bg: 'bg-green-950/30' },
  rare:      { label: 'Редкий',      border: 'border-blue-600',     text: 'text-blue-400',    glow: 'shadow-[0_0_8px_rgba(59,130,246,0.35)]',     bg: 'bg-blue-950/30' },
  epic:      { label: 'Эпический',   border: 'border-purple-500',   text: 'text-purple-300',  glow: 'shadow-[0_0_10px_rgba(168,85,247,0.45)]',    bg: 'bg-purple-950/30' },
  legendary: { label: 'Легендарный', border: 'border-yellow-500',   text: 'text-yellow-300',  glow: 'shadow-[0_0_12px_rgba(234,179,8,0.50)]',     bg: 'bg-yellow-950/20' },
};

export const TYPE_LABEL: Record<ItemType, string> = {
  weapon: 'Оружие', helmet: 'Шлем', armor: 'Броня', gloves: 'Перчатки', boots: 'Обувь', consumable: 'Зелье',
};

// ─── AFFIX SYSTEM ─────────────────────────────────────────────────────────────

/** Rarity multiplier applied to the maximum of each rolled bonus range. */
export const RARITY_MULT: Record<Rarity, number> = {
  common:    1.00,
  uncommon:  1.15,
  rare:      1.30,
  epic:      1.50,
  legendary: 1.80,
};

type AffixRange = Partial<Record<keyof ItemBonuses, [number, number]>>;

/**
 * Per-item bonus ranges [min, max] at common (100%) tier.
 * Rarity multiplier is applied to max at roll time (except atkSpeedPenalty).
 * Items absent from this table keep their static catalog bonuses.
 */
export const AFFIX_TABLE: Record<string, AffixRange> = {
  // ── Weapons ──────────────────────────────────────────────────────────────────
  rusty_sword:     { damage: [2,  5]                              },  // spec: +2–5
  iron_sword:      { damage: [4,  7]                              },
  orc_axe:         { damage: [7, 12], atkSpeedPenalty: [3, 7]    },  // penalty NOT scaled
  shadow_blade:    { damage: [12, 18], agility: [1, 3]           },
  dragon_fang:     { damage: [20, 30], strength: [2, 4]          },
  // ── Helmets ───────────────────────────────────────────────────────────────────
  leather_helm:    { hp: [10, 20]                                 },  // spec: +10–20
  iron_helm:       { hp: [16, 25]                                 },
  mage_hood:       { hp: [22, 38], strength: [1, 2]              },
  // ── Armor ─────────────────────────────────────────────────────────────────────
  leather_armor:   { hp: [20, 40]                                 },  // spec: +20–40
  chainmail:       { hp: [32, 50]                                 },
  plate_armor:     { hp: [48, 72]                                 },
  void_plate:      { hp: [70, 110], strength: [1, 3]             },
  // ── Gloves ───────────────────────────────────────────────────────────────────
  leather_gloves:  { strength: [1, 3]                             },  // spec: +1–3
  battle_gloves:   { strength: [1, 3]                             },
  titan_gauntlets: { strength: [3,  5], hp: [15, 25]             },
  // ── Boots ────────────────────────────────────────────────────────────────────
  light_boots:     { agility: [1, 2]                              },
  scout_boots:     { agility: [1, 3]                              },  // spec: +1–3
  wind_walkers:    { agility: [4,  6], hp: [10, 20]              },
  // ── Magic weapons ────────────────────────────────────────────────────────────
  arcane_staff:    { damage: [6, 10], hp: [15, 25]               },
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Roll randomised bonuses for an item, scaling the ceiling by rarity.
 * Returns static catalog bonuses for items not in AFFIX_TABLE (e.g. consumables).
 */
export function rollAffixedBonuses(key: string, rarity: Rarity): ItemBonuses {
  const ranges = AFFIX_TABLE[key];
  if (!ranges) return { ...(ITEM_CATALOG[key]?.bonuses ?? {}) };

  const mult   = RARITY_MULT[rarity];
  const result: ItemBonuses = {};

  for (const [stat, range] of Object.entries(ranges) as [keyof ItemBonuses, [number, number]][]) {
    const [min, max] = range;
    // atkSpeedPenalty is a debuff — never reward higher rarity with a harsher penalty
    const scaledMax = stat === 'atkSpeedPenalty' ? max : Math.floor(max * mult);
    (result as Record<string, number>)[stat] = randInt(min, Math.max(min, scaledMax));
  }

  return result;
}

/** Instantiate an item from the catalog with a unique runtime ID and rolled bonuses. */
export function makeItem(key: string): Item {
  const tpl = ITEM_CATALOG[key];
  if (!tpl) throw new Error(`makeItem: unknown item key "${key}" — add it to ITEM_CATALOG`);
  return {
    ...tpl,
    bonuses: rollAffixedBonuses(key, tpl.rarity),
    id: `${key}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  };
}

/** Human-readable bonus lines for display in the item tooltip. */
export function formatBonuses(b: ItemBonuses): string[] {
  const lines: string[] = [];
  if (b.damage)          lines.push(`+${b.damage} урона`);
  if (b.hp)              lines.push(`+${b.hp} HP`);
  if (b.strength)        lines.push(`+${b.strength} Сила`);
  if (b.agility)         lines.push(`+${b.agility} Ловкость`);
  if (b.vitality)        lines.push(`+${b.vitality} Живучесть`);
  if (b.intelligence)    lines.push(`+${b.intelligence} Интел.`);
  if (b.defense)         lines.push(`+${b.defense} Защита`);
  if (b.critChance)      lines.push(`+${b.critChance}% крит.`);
  if (b.critDamage)      lines.push(`+${b.critDamage}% крит.урон`);
  if (b.dodgeChance)     lines.push(`+${b.dodgeChance}% уклон.`);
  if (b.atkSpeedPenalty) lines.push(`−${b.atkSpeedPenalty}% скор.`);
  return lines;
}
