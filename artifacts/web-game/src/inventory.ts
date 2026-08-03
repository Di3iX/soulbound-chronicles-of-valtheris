// ─── INVENTORY / ITEM SYSTEM ──────────────────────────────────────────────────
import { buildDropTables } from './monsters';

export type ItemType = 'weapon' | 'helmet' | 'armor' | 'gloves' | 'boots' | 'ring' | 'amulet' | 'consumable';

/** Gear tier T1–T6 (level bands). */
export type ItemTier = 1 | 2 | 3 | 4 | 5 | 6;

export interface ItemAffix {
  id: string;
  /** Short Russian label for UI */
  label: string;
  bonuses: ItemBonuses;
}

export type Rarity   = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface ItemBonuses {
  damage?:          number;
  hp?:              number;
  strength?:        number;
  agility?:         number;
  atkSpeedPenalty?: number;
  vitality?:        number;
  intelligence?:    number;
  defense?:         number;
  critChance?:      number;
  critDamage?:      number;
  dodgeChance?:     number;
  blockChance?:     number;
  fireResist?:      number;
  electricResist?:  number;
  iceResist?:       number;
  mana?:            number;
}

export interface Item {
  id:      string;
  key:     string;
  name:    string;
  type:    ItemType;
  rarity:  Rarity;
  bonuses: ItemBonuses;
  /** Equipment tier T1–T6 (see ITEM_TIERS.md). */
  tier?: ItemTier;
  /** Explicit level requirement; if absent, derived from `tier`'s minimum level. */
  requiredLevel?: number;
  /** Upgrade level applied via the blacksmith (0–5). */
  upgradeLevel?: number;
  /** Rolled affixes (rarity-based bonus rolls). */
  affixes?: ItemAffix[];
  /** Currently applied enchantment id (see enchant.ts). One per item; new replaces old. */
  enchantId?: string;
  /** Display name of the currently applied enchantment. */
  enchantName?: string;
}


/** Level bands for tiers: T1 = 1–10 … T6 = 51–60. */
export const TIER_LEVEL_RANGE: Record<ItemTier, { min: number; max: number; label: string }> = {
  1: { min: 1,  max: 10, label: 'T1' },
  2: { min: 11, max: 20, label: 'T2' },
  3: { min: 21, max: 30, label: 'T3' },
  4: { min: 31, max: 40, label: 'T4' },
  5: { min: 41, max: 50, label: 'T5' },
  6: { min: 51, max: 60, label: 'T6' },
};

export const TIER_STYLE: Record<ItemTier, { color: string; border: string }> = {
  1: { color: '#9ca3af', border: 'border-[#555]' },
  2: { color: '#4ade80', border: 'border-green-700/50' },
  3: { color: '#60a5fa', border: 'border-blue-600/50' },
  4: { color: '#c084fc', border: 'border-purple-500/50' },
  5: { color: '#f472b6', border: 'border-pink-500/50' },
  6: { color: '#fbbf24', border: 'border-amber-500/50' },
};

/** Player level → recommended tier. */
export function tierForPlayerLevel(level: number): ItemTier {
  if (level <= 10) return 1;
  if (level <= 20) return 2;
  if (level <= 30) return 3;
  if (level <= 40) return 4;
  if (level <= 50) return 5;
  return 6;
}

export function minLevelForTier(tier: ItemTier): number {
  return TIER_LEVEL_RANGE[tier].min;
}

/** Effective required level for equipping. */
export function itemRequiredLevel(item: { tier?: ItemTier; requiredLevel?: number; type: ItemType }): number {
  if (item.type === 'consumable') return 1;
  if (item.requiredLevel != null) return item.requiredLevel;
  if (item.tier != null) return minLevelForTier(item.tier);
  return 1;
}

export function canEquipItem(
  item: { tier?: ItemTier; requiredLevel?: number; type: ItemType },
  playerLevel: number,
): { ok: true } | { ok: false; required: number } {
  if (item.type === 'consumable') return { ok: true };
  const need = itemRequiredLevel(item);
  if (playerLevel >= need) return { ok: true };
  return { ok: false, required: need };
}

export function tierLabel(tier: ItemTier | undefined): string {
  if (!tier) return '';
  return TIER_LEVEL_RANGE[tier].label;
}

export const ITEM_CATALOG: Record<string, Omit<Item, 'id'>> = {
  healing_potion:         { key: 'healing_potion',         name: 'Зелье лечения',        type: 'consumable', rarity: 'common',    bonuses: {} },
  greater_healing_potion: { key: 'greater_healing_potion', name: 'Большое зелье лечения', type: 'consumable', rarity: 'uncommon',  bonuses: {} },
  mana_potion:            { key: 'mana_potion',            name: 'Зелье маны',            type: 'consumable', rarity: 'common',    bonuses: {} },
  greater_mana_potion:    { key: 'greater_mana_potion',    name: 'Большое зелье маны',    type: 'consumable', rarity: 'uncommon',  bonuses: {} },
  rusty_sword:      { key: 'rusty_sword',      name: 'Ржавый меч',         type: 'weapon',  rarity: 'common',    bonuses: { damage: 2 }, tier: 1 as ItemTier },
  iron_sword:       { key: 'iron_sword',       name: 'Железный меч',       type: 'weapon',  rarity: 'uncommon',  bonuses: { damage: 5 }, tier: 2 as ItemTier },
  orc_axe:          { key: 'orc_axe',          name: 'Топор орка',         type: 'weapon',  rarity: 'rare',      bonuses: { damage: 9, atkSpeedPenalty: 5 }, tier: 3 as ItemTier },
  shadow_blade:     { key: 'shadow_blade',     name: 'Теневой клинок',     type: 'weapon',  rarity: 'epic',      bonuses: { damage: 15, agility: 2 }, tier: 4 as ItemTier },
  dragon_fang:      { key: 'dragon_fang',      name: 'Клык дракона',       type: 'weapon',  rarity: 'legendary', bonuses: { damage: 25, strength: 3 }, tier: 5 as ItemTier },
  leather_helm:     { key: 'leather_helm',     name: 'Кожаный шлем',       type: 'helmet',  rarity: 'common',    bonuses: { hp: 10 }, tier: 1 as ItemTier },
  iron_helm:        { key: 'iron_helm',        name: 'Железный шлем',      type: 'helmet',  rarity: 'uncommon',  bonuses: { hp: 20 }, tier: 2 as ItemTier },
  mage_hood:        { key: 'mage_hood',        name: 'Капюшон мага',       type: 'helmet',  rarity: 'rare',      bonuses: { hp: 30, strength: 1 }, tier: 3 as ItemTier },
  leather_armor:    { key: 'leather_armor',    name: 'Кожаная броня',      type: 'armor',   rarity: 'common',    bonuses: { hp: 20 }, tier: 1 as ItemTier },
  chainmail:        { key: 'chainmail',        name: 'Кольчуга',           type: 'armor',   rarity: 'uncommon',  bonuses: { hp: 40 }, tier: 2 as ItemTier },
  plate_armor:      { key: 'plate_armor',      name: 'Латные доспехи',     type: 'armor',   rarity: 'rare',      bonuses: { hp: 60 }, tier: 3 as ItemTier },
  void_plate:       { key: 'void_plate',       name: 'Доспехи пустоты',    type: 'armor',   rarity: 'epic',      bonuses: { hp: 90, strength: 2 }, tier: 4 as ItemTier },
  leather_gloves:   { key: 'leather_gloves',   name: 'Кожаные перчатки',   type: 'gloves',  rarity: 'common',    bonuses: { strength: 1 }, tier: 1 as ItemTier },
  battle_gloves:    { key: 'battle_gloves',    name: 'Боевые перчатки',    type: 'gloves',  rarity: 'uncommon',  bonuses: { strength: 2 }, tier: 2 as ItemTier },
  titan_gauntlets:  { key: 'titan_gauntlets',  name: 'Рукавицы титана',    type: 'gloves',  rarity: 'epic',      bonuses: { strength: 4, hp: 20 }, tier: 4 as ItemTier },
  light_boots:      { key: 'light_boots',      name: 'Лёгкие сапоги',      type: 'boots',   rarity: 'common',    bonuses: { agility: 1 }, tier: 1 as ItemTier },
  scout_boots:      { key: 'scout_boots',      name: 'Сапоги разведчика',  type: 'boots',   rarity: 'uncommon',  bonuses: { agility: 2 }, tier: 2 as ItemTier },
  wind_walkers:     { key: 'wind_walkers',     name: 'Сапоги ветра',       type: 'boots',   rarity: 'legendary', bonuses: { agility: 5, hp: 15 }, tier: 5 as ItemTier },
  arcane_staff:     { key: 'arcane_staff',     name: 'Магический посох',   type: 'weapon',  rarity: 'rare',      bonuses: { damage: 8, hp: 20 }, tier: 3 as ItemTier },
  copper_ring:      { key: 'copper_ring',      name: 'Медное кольцо',      type: 'ring',    rarity: 'common',    bonuses: { critChance: 1 }, tier: 1 as ItemTier },
  silver_ring:      { key: 'silver_ring',      name: 'Серебряное кольцо',  type: 'ring',    rarity: 'uncommon',  bonuses: { dodgeChance: 2 }, tier: 2 as ItemTier },
  ring_of_vigor:    { key: 'ring_of_vigor',    name: 'Кольцо бодрости',    type: 'ring',    rarity: 'rare',      bonuses: { mana: 15, hp: 5 }, tier: 3 as ItemTier },
  ring_of_phoenix:  { key: 'ring_of_phoenix',  name: 'Кольцо феникса',     type: 'ring',    rarity: 'epic',      bonuses: { critDamage: 8, hp: 10 }, tier: 4 as ItemTier },
  band_of_eternity: { key: 'band_of_eternity', name: 'Обод вечности',      type: 'ring',    rarity: 'legendary', bonuses: { critChance: 6, dodgeChance: 4, hp: 20 }, tier: 5 as ItemTier },
  bone_amulet:      { key: 'bone_amulet',      name: 'Костяной амулет',    type: 'amulet',  rarity: 'common',    bonuses: { hp: 10 }, tier: 1 as ItemTier },
  amulet_of_wisdom: { key: 'amulet_of_wisdom', name: 'Амулет мудрости',    type: 'amulet',  rarity: 'uncommon',  bonuses: { mana: 20 }, tier: 2 as ItemTier },
  pendant_of_protection: { key: 'pendant_of_protection', name: 'Кулон защиты', type: 'amulet', rarity: 'rare',    bonuses: { defense: 6, hp: 15 }, tier: 3 as ItemTier },
  amulet_of_dragon: { key: 'amulet_of_dragon', name: 'Амулет дракона',     type: 'amulet',  rarity: 'epic',      bonuses: { damage: 8, fireResist: 5 }, tier: 4 as ItemTier },
  heart_of_mountain:{ key: 'heart_of_mountain',name: 'Сердце горы',        type: 'amulet',  rarity: 'legendary', bonuses: { hp: 45, defense: 8, blockChance: 4 }, tier: 5 as ItemTier },
  // Materials
  // Upgrade protection
  upgrade_protect:     { key: 'upgrade_protect',     name: 'Свиток защиты (+)',      type: 'consumable', rarity: 'uncommon', bonuses: {} },
  upgrade_protect_plus:{ key: 'upgrade_protect_plus',name: 'Свиток надёжной защиты', type: 'consumable', rarity: 'rare',     bonuses: {} },
  upgrade_blessing:    { key: 'upgrade_blessing',    name: 'Свиток благословения',   type: 'consumable', rarity: 'epic',     bonuses: {} },

  // Recipe scrolls (unlock blacksmith recipes)
  recipe_iron_edge:   { key: 'recipe_iron_edge',   name: 'Рецепт: Железный клинок', type: 'consumable', rarity: 'uncommon', bonuses: {} },
  recipe_chain_patch: { key: 'recipe_chain_patch', name: 'Рецепт: Кольчуга',         type: 'consumable', rarity: 'rare', bonuses: {} },
  recipe_ice_charm:   { key: 'recipe_ice_charm',   name: 'Рецепт: Талисман льда',   type: 'consumable', rarity: 'epic',     bonuses: {} },
  recipe_boar_blade:  { key: 'recipe_boar_blade',  name: 'Рецепт: Клинок с клыком', type: 'consumable', rarity: 'uncommon', bonuses: {} },
  recipe_crystal_charm: { key: 'recipe_crystal_charm', name: 'Рецепт: Кулон защиты', type: 'consumable', rarity: 'rare',  bonuses: {} },

  black_crystal:  { key: 'black_crystal',  name: 'Чёрный кристалл', type: 'consumable', rarity: 'uncommon', bonuses: {} },
  rat_tail:       { key: 'rat_tail',       name: 'Крысиный хвост',   type: 'consumable', rarity: 'common',   bonuses: {} },
  rabbit_fur:     { key: 'rabbit_fur',     name: 'Кроличий мех',     type: 'consumable', rarity: 'common',   bonuses: {} },
  raw_meat:       { key: 'raw_meat',       name: 'Сырое мясо',       type: 'consumable', rarity: 'common',   bonuses: {} },
  raven_feather:  { key: 'raven_feather',  name: 'Перо ворона',      type: 'consumable', rarity: 'common',   bonuses: {} },
  boar_hide:      { key: 'boar_hide',      name: 'Шкура кабана',     type: 'consumable', rarity: 'common',   bonuses: {} },
  boar_tusk:      { key: 'boar_tusk',      name: 'Клык кабана',      type: 'consumable', rarity: 'uncommon', bonuses: {} },
  snake_skin:     { key: 'snake_skin',     name: 'Змеиная кожа',     type: 'consumable', rarity: 'common',   bonuses: {} },
  wolf_hide:      { key: 'wolf_hide',      name: 'Шкура волка',      type: 'consumable', rarity: 'common',   bonuses: {} },
  wolf_fang:      { key: 'wolf_fang',      name: 'Клык волка',       type: 'consumable', rarity: 'uncommon', bonuses: {} },
  goblin_ear:     { key: 'goblin_ear',     name: 'Ухо гоблина',      type: 'consumable', rarity: 'common',   bonuses: {} },
  bat_wing:       { key: 'bat_wing',       name: 'Крыло мыши',       type: 'consumable', rarity: 'common',   bonuses: {} },
  ice_shard:      { key: 'ice_shard',      name: 'Осколок льда',     type: 'consumable', rarity: 'uncommon', bonuses: {} },
  spider_silk:    { key: 'spider_silk',    name: 'Паутинный шёлк',   type: 'consumable', rarity: 'uncommon', bonuses: {} },
  yeti_fur:       { key: 'yeti_fur',       name: 'Мех йети',         type: 'consumable', rarity: 'rare',     bonuses: {} },
  slime_gel:      { key: 'slime_gel',      name: 'Слизь',            type: 'consumable', rarity: 'common',   bonuses: {} },
  golem_core:     { key: 'golem_core',     name: 'Ядро голема',      type: 'consumable', rarity: 'rare',     bonuses: {} },
  troll_blood:    { key: 'troll_blood',    name: 'Кровь тролля',     type: 'consumable', rarity: 'uncommon', bonuses: {} },
  harpy_feather:  { key: 'harpy_feather',  name: 'Перо гарпии',      type: 'consumable', rarity: 'uncommon', bonuses: {} },
};

/** Drop tables — generated from MONSTER_DEFS. */
export const DROP_TABLES: Record<string, { chance: number; pool: string[] }> = buildDropTables();

export const RARITY_STYLE: Record<Rarity, { label: string; border: string; text: string; glow: string; bg: string }> = {
  common:    { label: 'Обычный',     border: 'border-[#555]',       text: 'text-[#aaa]',      glow: '',                                           bg: 'bg-[#111118]' },
  uncommon:  { label: 'Необычный',   border: 'border-green-700',    text: 'text-green-400',   glow: 'shadow-[0_0_6px_rgba(34,197,94,0.25)]',      bg: 'bg-green-950/30' },
  rare:      { label: 'Редкий',      border: 'border-blue-600',     text: 'text-blue-400',    glow: 'shadow-[0_0_8px_rgba(59,130,246,0.35)]',     bg: 'bg-blue-950/30' },
  epic:      { label: 'Эпический',   border: 'border-purple-500',   text: 'text-purple-300',  glow: 'shadow-[0_0_10px_rgba(168,85,247,0.45)]',    bg: 'bg-purple-950/30' },
  legendary: { label: 'Легендарный', border: 'border-yellow-500',   text: 'text-yellow-300',  glow: 'shadow-[0_0_12px_rgba(234,179,8,0.50)]',     bg: 'bg-yellow-950/20' },
};

export const TYPE_LABEL: Record<ItemType, string> = {
  weapon: 'Оружие', helmet: 'Шлем', armor: 'Броня', gloves: 'Перчатки', boots: 'Обувь',
  ring: 'Кольцо', amulet: 'Амулет', consumable: 'Предмет',
};

export const TYPE_ICON: Record<ItemType, string> = {
  weapon: '⚔️', helmet: '⛑️', armor: '🧥', gloves: '🧤', boots: '👟',
  ring: '💍', amulet: '📿', consumable: '🧪',
};

export const ITEM_EMOJI: Partial<Record<string, string>> = {
  dragon_fang: '🐉', shadow_blade: '🗡️', arcane_staff: '🪄', void_plate: '🌌',
  wind_walkers: '🌪️', heart_of_mountain: '⛰️', band_of_eternity: '♾️',
  ring_of_phoenix: '🔥', bone_amulet: '🦴',
  black_crystal: '🖤', healing_potion: '🧪', greater_healing_potion: '🍷', mana_potion: '🔷', greater_mana_potion: '💠',
  wolf_hide: '🐺', wolf_fang: '🦷', raw_meat: '🥩', boar_hide: '🐗', ice_shard: '❄️',
  spider_silk: '🕸️', golem_core: '🗿', troll_blood: '🩸',
};

export function itemIcon(item: Pick<Item, 'key' | 'type'>): string {
  return ITEM_EMOJI[item.key] ?? TYPE_ICON[item.type];
}

export const RARITY_MULT: Record<Rarity, number> = {
  common: 1.00, uncommon: 1.15, rare: 1.30, epic: 1.50, legendary: 1.80,
};

type AffixRange = Partial<Record<keyof ItemBonuses, [number, number]>>;

export const AFFIX_TABLE: Record<string, AffixRange> = {
  rusty_sword:     { damage: [2,  5] },
  iron_sword:      { damage: [4,  7] },
  orc_axe:         { damage: [7, 12], atkSpeedPenalty: [3, 7] },
  shadow_blade:    { damage: [12, 18], agility: [1, 3] },
  dragon_fang:     { damage: [20, 30], strength: [2, 4] },
  leather_helm:    { hp: [10, 20] },
  iron_helm:       { hp: [16, 25], blockChance: [2, 4] },
  mage_hood:       { hp: [22, 38], strength: [1, 2], mana: [10, 20] },
  leather_armor:   { hp: [20, 40] },
  chainmail:       { hp: [32, 50], blockChance: [3, 6] },
  plate_armor:     { hp: [48, 72], fireResist: [3, 6] },
  void_plate:      { hp: [70, 110], strength: [1, 3], electricResist: [4, 8] },
  leather_gloves:  { strength: [1, 3] },
  battle_gloves:   { strength: [1, 3] },
  titan_gauntlets: { strength: [3,  5], hp: [15, 25], fireResist: [2, 4] },
  light_boots:     { agility: [1, 2] },
  scout_boots:     { agility: [1, 3] },
  wind_walkers:    { agility: [4,  6], hp: [10, 20], iceResist: [3, 5] },
  arcane_staff:    { damage: [6, 10], hp: [15, 25], mana: [15, 25] },
  copper_ring:      { critChance: [1, 2] },
  silver_ring:      { dodgeChance: [2, 3] },
  ring_of_vigor:    { mana: [12, 20], hp: [5, 10] },
  ring_of_phoenix:  { critDamage: [6, 12], hp: [8, 15] },
  band_of_eternity: { critChance: [5, 8], dodgeChance: [3, 6], hp: [15, 25] },
  bone_amulet:      { hp: [10, 18] },
  amulet_of_wisdom: { mana: [16, 26] },
  pendant_of_protection: { defense: [5, 9], hp: [10, 18] },
  amulet_of_dragon: { damage: [6, 10], fireResist: [4, 7] },
  heart_of_mountain:{ hp: [35, 55], defense: [6, 10], blockChance: [3, 5] },
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function rollAffixedBonuses(key: string, rarity: Rarity): ItemBonuses {
  const ranges = AFFIX_TABLE[key];
  if (!ranges) return { ...(ITEM_CATALOG[key]?.bonuses ?? {}) };
  const mult = RARITY_MULT[rarity];
  const result: ItemBonuses = {};
  for (const [stat, range] of Object.entries(ranges) as [keyof ItemBonuses, [number, number]][]) {
    const [min, max] = range;
    const scaledMax = stat === 'atkSpeedPenalty' ? max : Math.floor(max * mult);
    (result as Record<string, number>)[stat] = randInt(min, Math.max(min, scaledMax));
  }
  return result;
}


// ─── RANDOM AFFIXES ───────────────────────────────────────────────────────────
interface AffixDef {
  id: string;
  label: (v: number) => string;
  /** Roll integer in [min, max] inclusive */
  min: number;
  max: number;
  apply: (v: number) => ItemBonuses;
  /** Weight in the pool */
  weight: number;
  /** Allowed item types; empty = all gear */
  types?: ItemType[];
}

const AFFIX_POOL: AffixDef[] = [
  { id: 'str', label: v => `+${v} к силе`, min: 1, max: 4, weight: 10,
    apply: v => ({ strength: v }) },
  { id: 'agi', label: v => `+${v} к ловкости`, min: 1, max: 4, weight: 10,
    apply: v => ({ agility: v }) },
  { id: 'vit', label: v => `+${v} к живучести`, min: 1, max: 4, weight: 10,
    apply: v => ({ vitality: v }) },
  { id: 'int', label: v => `+${v} к интеллекту`, min: 1, max: 4, weight: 8,
    apply: v => ({ intelligence: v }) },
  { id: 'hp', label: v => `+${v} HP`, min: 5, max: 25, weight: 12,
    apply: v => ({ hp: v }) },
  { id: 'mana', label: v => `+${v} MP`, min: 5, max: 20, weight: 8,
    apply: v => ({ mana: v }) },
  { id: 'def', label: v => `+${v} к защите`, min: 1, max: 5, weight: 10,
    apply: v => ({ defense: v }), types: ['helmet', 'armor', 'gloves', 'boots', 'amulet'] },
  { id: 'dmg', label: v => `+${v} к урону`, min: 1, max: 6, weight: 10,
    apply: v => ({ damage: v }), types: ['weapon', 'ring', 'amulet'] },
  { id: 'crit', label: v => `+${v}% к криту`, min: 1, max: 4, weight: 6,
    apply: v => ({ critChance: v }) },
  { id: 'critdmg', label: v => `+${v}% к крит.урону`, min: 3, max: 10, weight: 5,
    apply: v => ({ critDamage: v }) },
  { id: 'dodge', label: v => `+${v}% к уклонению`, min: 1, max: 4, weight: 6,
    apply: v => ({ dodgeChance: v }) },
  { id: 'block', label: v => `+${v}% к блоку`, min: 1, max: 4, weight: 5,
    apply: v => ({ blockChance: v }), types: ['armor', 'gloves', 'helmet'] },
  { id: 'fire_res', label: v => `+${v}% сопр. огню`, min: 2, max: 8, weight: 4,
    apply: v => ({ fireResist: v }) },
  { id: 'ice_res', label: v => `+${v}% сопр. льду`, min: 2, max: 8, weight: 4,
    apply: v => ({ iceResist: v }) },
  { id: 'elec_res', label: v => `+${v}% сопр. молнии`, min: 2, max: 8, weight: 4,
    apply: v => ({ electricResist: v }) },
];

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickWeighted(pool: AffixDef[], exclude: Set<string>): AffixDef | null {
  const avail = pool.filter(a => !exclude.has(a.id));
  if (!avail.length) return null;
  const total = avail.reduce((s, a) => s + a.weight, 0);
  let r = Math.random() * total;
  for (const a of avail) {
    r -= a.weight;
    if (r <= 0) return a;
  }
  return avail[avail.length - 1];
}

/** How many affixes to roll by rarity. */
export function affixCountForRarity(rarity: ItemRarity): number {
  switch (rarity) {
    case 'common':    return Math.random() < 0.35 ? 1 : 0;
    case 'uncommon':  return Math.random() < 0.55 ? 1 : (Math.random() < 0.15 ? 2 : 0);
    case 'rare':      return Math.random() < 0.5 ? 2 : 1;
    case 'epic':      return Math.random() < 0.4 ? 3 : 2;
    case 'legendary': return Math.random() < 0.5 ? 3 : 2;
    default:          return 0;
  }
}

/** Scale affix roll range slightly by tier. */
function tierAffixScale(tier?: ItemTier): number {
  if (!tier || tier <= 1) return 1;
  return 1 + (tier - 1) * 0.12;
}

export function rollAffixes(
  type: ItemType,
  rarity: ItemRarity,
  tier?: ItemTier,
): ItemAffix[] {
  if (type === 'consumable') return [];
  const count = affixCountForRarity(rarity);
  if (count <= 0) return [];

  const pool = AFFIX_POOL.filter(a => !a.types || a.types.includes(type));
  const used = new Set<string>();
  const out: ItemAffix[] = [];
  const scale = tierAffixScale(tier);

  for (let i = 0; i < count; i++) {
    const def = pickWeighted(pool, used);
    if (!def) break;
    used.add(def.id);
    let v = randInt(def.min, def.max);
    v = Math.max(1, Math.round(v * scale));
    out.push({
      id: def.id,
      label: def.label(v),
      bonuses: def.apply(v),
    });
  }
  return out;
}

/** Merge base + affix bonuses into one object. */
export function mergeBonuses(base: ItemBonuses, affixes?: ItemAffix[]): ItemBonuses {
  if (!affixes?.length) return { ...base };
  const out: ItemBonuses = { ...base };
  for (const ax of affixes) {
    for (const key of Object.keys(ax.bonuses) as (keyof ItemBonuses)[]) {
      const add = ax.bonuses[key];
      if (add === undefined) continue;
      const prev = (out[key] as number | undefined) ?? 0;
      (out as Record<string, number>)[key] = prev + add;
    }
  }
  return out;
}

export function makeItem(key: string, opts?: { rollAffixes?: boolean }): Item {
  const tpl = ITEM_CATALOG[key];
  if (!tpl) throw new Error(`makeItem: unknown item key "${key}" — add it to ITEM_CATALOG`);
  const doRoll = opts?.rollAffixes !== false && tpl.type !== 'consumable';
  const affixes = doRoll ? rollAffixes(tpl.type, tpl.rarity, tpl.tier) : [];
  const baseBonuses = { ...(tpl.bonuses ?? {}) };
  // Optional random ranges if BONUS_RANGES exists - keep simple: use catalog + affixes
  const bonuses = mergeBonuses(baseBonuses, affixes);
  return {
    ...tpl,
    id: `${key}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    bonuses,
    affixes: affixes.length ? affixes : undefined,
  };
}

export function formatBonuses(b: ItemBonuses): string[] {
  const lines: string[] = [];
  if (b.damage)          lines.push(`+${b.damage} урона`);
  if (b.hp)              lines.push(`+${b.hp} HP`);
  if (b.mana)            lines.push(`+${b.mana} MP`);
  if (b.strength)        lines.push(`+${b.strength} Сила`);
  if (b.agility)         lines.push(`+${b.agility} Ловкость`);
  if (b.vitality)        lines.push(`+${b.vitality} Живучесть`);
  if (b.intelligence)    lines.push(`+${b.intelligence} Интел.`);
  if (b.defense)         lines.push(`+${b.defense} Защита`);
  if (b.critChance)      lines.push(`+${b.critChance}% крит.`);
  if (b.critDamage)      lines.push(`+${b.critDamage}% крит.урон`);
  if (b.dodgeChance)     lines.push(`+${b.dodgeChance}% уклон.`);
  if (b.blockChance)     lines.push(`+${b.blockChance}% блок`);
  if (b.fireResist)      lines.push(`${b.fireResist > 0 ? '+' : ''}${b.fireResist}% огн.рез.`);
  if (b.electricResist)  lines.push(`${b.electricResist > 0 ? '+' : ''}${b.electricResist}% электр.рез.`);
  if (b.iceResist)       lines.push(`${b.iceResist > 0 ? '+' : ''}${b.iceResist}% лед.рез.`);
  if (b.atkSpeedPenalty) lines.push(`−${b.atkSpeedPenalty}% скор.`);
  return lines;
}

/** Name with +N suffix for upgraded gear. */
export function itemDisplayName(item: Item): string {
  const n = item.upgradeLevel ?? 0;
  const t = item.tier ? ` ${tierLabel(item.tier)}` : '';
  const up = n > 0 ? ` +${n}` : '';
  return `${item.name}${t}${up}`;
}

export function formatAffixes(item: Item): string[] {
  return (item.affixes ?? []).map(a => a.label);
}
