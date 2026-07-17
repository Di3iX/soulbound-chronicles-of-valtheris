// ─── INVENTORY / ITEM SYSTEM ──────────────────────────────────────────────────

export type ItemType = 'weapon' | 'helmet' | 'armor' | 'gloves' | 'boots';
export type Rarity   = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface ItemBonuses {
  damage?:          number;
  hp?:              number;
  strength?:        number;
  agility?:         number;
  atkSpeedPenalty?: number; // % increase to attack interval (slower)
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
  weapon: 'Оружие', helmet: 'Шлем', armor: 'Броня', gloves: 'Перчатки', boots: 'Обувь',
};

/** Instantiate an item from the catalog with a unique runtime ID. */
export function makeItem(key: string): Item {
  const tpl = ITEM_CATALOG[key];
  return { ...tpl, id: `${key}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` };
}

/** Human-readable bonus lines for display in the item tooltip. */
export function formatBonuses(b: ItemBonuses): string[] {
  const lines: string[] = [];
  if (b.damage)          lines.push(`+${b.damage} урона`);
  if (b.hp)              lines.push(`+${b.hp} HP`);
  if (b.strength)        lines.push(`+${b.strength} Сила`);
  if (b.agility)         lines.push(`+${b.agility} Ловкость`);
  if (b.atkSpeedPenalty) lines.push(`−${b.atkSpeedPenalty}% скор.`);
  return lines;
}
