// ─── MONSTER CATALOG ──────────────────────────────────────────────────────────
// Single source of truth for all enemy stats, rewards, drops and abilities.
export type DamageType = 'physical' | 'fire' | 'electric' | 'ice';
export type StatusEffectType = 'poison' | 'burn' | 'slow' | 'stun';

export type SpeedTier = 'very_slow' | 'slow' | 'normal' | 'fast' | 'very_fast';

export const SPEED_LABEL: Record<SpeedTier, string> = {
  very_slow: 'очень низкая',
  slow:      'низкая',
  normal:    'средняя',
  fast:      'высокая',
  very_fast: 'очень высокая',
};

/** attackInterval ms derived from speed tier (lower = attacks more often). */
export const SPEED_INTERVAL: Record<SpeedTier, number> = {
  very_slow: 4500,
  slow:      3200,
  normal:    2000,
  fast:      1200,
  very_fast: 800,
};

export interface MonsterAbility {
  effect: StatusEffectType;
  chance: number;   // 0–1
  label:  string;   // Russian description
}

export interface MonsterDef {
  name:     string;
  emoji:    string;
  level:    number;
  hp:       number;
  dmgMin:   number;
  dmgMax:   number;
  speed:    SpeedTier;
  xp:       number;
  goldMin:  number;
  goldMax:  number;
  /** Base chance to drop ONE item from dropPool (0–1). */
  dropChance: number;
  dropPool:   string[];
  ability?:   MonsterAbility;
  resists?:   Partial<Record<DamageType, number>>;
  /** Optional flavour line for codex / tooltips. */
  note?: string;
}

/**
 * All monsters used in the world.
 * makeLocationEnemies / REWARD_TABLE / DROP_TABLES / effects read from here.
 */
export const MONSTER_DEFS: Record<string, MonsterDef> = {
  // ── Тихие поля (1–5) ──────────────────────────────────────────────────────
  'Крыса': {
    name: 'Крыса', emoji: '🐀', level: 1, hp: 60, dmgMin: 2, dmgMax: 6,
    speed: 'normal', xp: 12, goldMin: 2, goldMax: 5,
    dropChance: 0.20, dropPool: ['rat_tail', 'healing_potion'],
    note: 'Слабая, но кусачая тварь у амбаров.',
  },
  'Кролик': {
    name: 'Кролик', emoji: '🐇', level: 1, hp: 40, dmgMin: 1, dmgMax: 3,
    speed: 'slow', xp: 8, goldMin: 1, goldMax: 3,
    dropChance: 0.25, dropPool: ['raw_meat', 'rabbit_fur'],
    note: 'Почти не опасен. Хороший источник мяса.',
  },
  'Ворон': {
    name: 'Ворон', emoji: '🐦', level: 2, hp: 80, dmgMin: 3, dmgMax: 7,
    speed: 'fast', xp: 18, goldMin: 3, goldMax: 7,
    dropChance: 0.15, dropPool: ['raven_feather'],
  },
  'Молодой кабан': {
    name: 'Молодой кабан', emoji: '🐗', level: 3, hp: 140, dmgMin: 6, dmgMax: 12,
    speed: 'slow', xp: 28, goldMin: 5, goldMax: 10,
    dropChance: 0.30, dropPool: ['raw_meat', 'boar_hide', 'boar_tusk'],
  },
  'Полевая змея': {
    name: 'Полевая змея', emoji: '🐍', level: 4, hp: 110, dmgMin: 5, dmgMax: 11,
    speed: 'fast', xp: 35, goldMin: 6, goldMax: 12,
    dropChance: 0.25, dropPool: ['snake_skin', 'healing_potion'],
    ability: { effect: 'poison', chance: 0.40, label: 'Яд (40%)' },
  },
  'Огромный Кабан': {
    name: 'Огромный Кабан', emoji: '🐗', level: 5, hp: 520, dmgMin: 14, dmgMax: 26,
    speed: 'normal', xp: 120, goldMin: 30, goldMax: 50,
    dropChance: 0.80, dropPool: ['boar_hide', 'boar_tusk', 'raw_meat', 'iron_sword'],
    note: 'Мини-босс Тихих полей.',
  },

  // ── Тёмный лес (6–10) ─────────────────────────────────────────────────────
  'Волк': {
    name: 'Волк', emoji: '🐺', level: 6, hp: 120, dmgMin: 18, dmgMax: 22,
    speed: 'fast', xp: 40, goldMin: 8, goldMax: 14,
    dropChance: 0.35, dropPool: ['wolf_hide', 'wolf_fang', 'raw_meat'],
    note: 'Быстрый хищник. Лут: шкура, клык, мясо.',
  },
  'Гоблин': {
    name: 'Гоблин', emoji: '👺', level: 6, hp: 160, dmgMin: 6, dmgMax: 13,
    speed: 'normal', xp: 25, goldMin: 5, goldMax: 10,
    dropChance: 0.30, dropPool: ['rusty_sword', 'leather_helm', 'copper_ring', 'goblin_ear'],
  },
  'Бандит': {
    name: 'Бандит', emoji: '🥷', level: 8, hp: 200, dmgMin: 10, dmgMax: 18,
    speed: 'normal', xp: 55, goldMin: 12, goldMax: 22,
    dropChance: 0.40, dropPool: ['iron_sword', 'leather_armor', 'silver_ring', 'healing_potion'],
    ability: { effect: 'stun', chance: 0.15, label: 'Оглушение (15%)' },
  },

  // ── Волчья пещера (8–12) ──────────────────────────────────────────────────
  'Летучая мышь': {
    name: 'Летучая мышь', emoji: '🦇', level: 8, hp: 100, dmgMin: 5, dmgMax: 11,
    speed: 'very_fast', xp: 40, goldMin: 8, goldMax: 15,
    dropChance: 0.20, dropPool: ['bat_wing'],
  },
  'Альфа-волк': {
    name: 'Альфа-волк', emoji: '🐺', level: 11, hp: 320, dmgMin: 14, dmgMax: 24,
    speed: 'fast', xp: 85, goldMin: 18, goldMax: 30,
    dropChance: 0.55, dropPool: ['wolf_hide', 'wolf_fang', 'raw_meat', 'bone_amulet'],
    note: 'Вожак стаи в Волчьей пещере.',
  },

  // ── Ледяные пики (9–15) ───────────────────────────────────────────────────
  'Ледяной волк': {
    name: 'Ледяной волк', emoji: '🐺', level: 10, hp: 250, dmgMin: 12, dmgMax: 20,
    speed: 'fast', xp: 70, goldMin: 15, goldMax: 28,
    dropChance: 0.35, dropPool: ['wolf_hide', 'wolf_fang', 'ice_shard'],
    resists: { fire: -25, ice: 40 },
  },
  'Снежный паук': {
    name: 'Снежный паук', emoji: '🕷️', level: 11, hp: 220, dmgMin: 10, dmgMax: 18,
    speed: 'fast', xp: 75, goldMin: 16, goldMax: 28,
    dropChance: 0.35, dropPool: ['spider_silk', 'ice_shard'],
    ability: { effect: 'slow', chance: 0.30, label: 'Замедление (30%)' },
    resists: { fire: -20, ice: 30 },
  },
  'Йети': {
    name: 'Йети', emoji: '👹', level: 14, hp: 450, dmgMin: 20, dmgMax: 32,
    speed: 'slow', xp: 110, goldMin: 25, goldMax: 40,
    dropChance: 0.45, dropPool: ['yeti_fur', 'ice_shard', 'healing_potion'],
    ability: { effect: 'slow', chance: 0.30, label: 'Замедление (30%)' },
    resists: { fire: -40, ice: 50 },
  },

  // ── Заброшенная дорога (10–15) ─────────────────────────────────────────────
  'Разбойник': {
    name: 'Разбойник', emoji: '🗡️', level: 11, hp: 220, dmgMin: 12, dmgMax: 20,
    speed: 'normal', xp: 65, goldMin: 14, goldMax: 25,
    dropChance: 0.40, dropPool: ['iron_sword', 'leather_armor', 'copper_ring', 'healing_potion'],
    ability: { effect: 'stun', chance: 0.15, label: 'Оглушение (15%)' },
  },
  'Лучник': {
    name: 'Лучник', emoji: '🏹', level: 12, hp: 180, dmgMin: 14, dmgMax: 22,
    speed: 'fast', xp: 70, goldMin: 15, goldMax: 26,
    dropChance: 0.40, dropPool: ['scout_boots', 'leather_gloves', 'silver_ring'],
  },
  'Наёмник': {
    name: 'Наёмник', emoji: '⚔️', level: 14, hp: 300, dmgMin: 16, dmgMax: 28,
    speed: 'normal', xp: 90, goldMin: 20, goldMax: 35,
    dropChance: 0.50, dropPool: ['iron_sword', 'chainmail', 'battle_gloves', 'silver_ring'],
    ability: { effect: 'stun', chance: 0.20, label: 'Оглушение (20%)' },
  },

  // ── Древние руины (15–20) ─────────────────────────────────────────────────
  'Скелет': {
    name: 'Скелет', emoji: '💀', level: 15, hp: 200, dmgMin: 12, dmgMax: 20,
    speed: 'normal', xp: 50, goldMin: 10, goldMax: 18,
    dropChance: 0.35, dropPool: ['bone_amulet', 'iron_helm', 'rusty_sword'],
  },
  'Зомби': {
    name: 'Зомби', emoji: '🧟', level: 17, hp: 350, dmgMin: 18, dmgMax: 28,
    speed: 'very_slow', xp: 80, goldMin: 20, goldMax: 35,
    dropChance: 0.45, dropPool: ['chainmail', 'iron_sword', 'amulet_of_wisdom'],
    resists: { electric: -30 },
  },
  'Призрак': {
    name: 'Призрак', emoji: '👻', level: 18, hp: 280, dmgMin: 15, dmgMax: 25,
    speed: 'fast', xp: 100, goldMin: 22, goldMax: 38,
    dropChance: 0.40, dropPool: ['arcane_staff', 'amulet_of_wisdom', 'mana_potion'],
    ability: { effect: 'slow', chance: 0.30, label: 'Холод души (30%)' },
    resists: { physical: 30, electric: -20 },
  },

  // ── Гнилые болота (18–25) ─────────────────────────────────────────────────
  'Слизень': {
    name: 'Слизень', emoji: '🟢', level: 18, hp: 280, dmgMin: 12, dmgMax: 20,
    speed: 'slow', xp: 95, goldMin: 18, goldMax: 32,
    dropChance: 0.30, dropPool: ['slime_gel', 'healing_potion'],
    ability: { effect: 'slow', chance: 0.35, label: 'Слизь (35%)' },
  },
  'Ядовитый паук': {
    name: 'Ядовитый паук', emoji: '🕷️', level: 20, hp: 240, dmgMin: 14, dmgMax: 22,
    speed: 'fast', xp: 110, goldMin: 22, goldMax: 38,
    dropChance: 0.40, dropPool: ['spider_silk', 'snake_skin'],
    ability: { effect: 'poison', chance: 0.45, label: 'Сильный яд (45%)' },
  },
  'Болотник': {
    name: 'Болотник', emoji: '🐸', level: 22, hp: 380, dmgMin: 18, dmgMax: 28,
    speed: 'slow', xp: 120, goldMin: 25, goldMax: 42,
    dropChance: 0.40, dropPool: ['slime_gel', 'raw_meat', 'pendant_of_protection'],
  },

  // ── Заброшенная шахта (25–30) ─────────────────────────────────────────────
  'Шахтёр-зомби': {
    name: 'Шахтёр-зомби', emoji: '🧟', level: 26, hp: 400, dmgMin: 20, dmgMax: 30,
    speed: 'slow', xp: 130, goldMin: 28, goldMax: 45,
    dropChance: 0.45, dropPool: ['iron_sword', 'iron_helm', 'chainmail'],
    resists: { electric: -25 },
  },
  'Голем': {
    name: 'Голем', emoji: '🗿', level: 28, hp: 550, dmgMin: 25, dmgMax: 38,
    speed: 'very_slow', xp: 150, goldMin: 30, goldMax: 50,
    dropChance: 0.50, dropPool: ['golem_core', 'plate_armor', 'pendant_of_protection'],
    resists: { physical: 20, fire: -15 },
  },

  // ── Каменный перевал (30–35) ──────────────────────────────────────────────
  'Горный тролль': {
    name: 'Горный тролль', emoji: '👾', level: 32, hp: 600, dmgMin: 28, dmgMax: 42,
    speed: 'very_slow', xp: 180, goldMin: 35, goldMax: 55,
    dropChance: 0.50, dropPool: ['troll_blood', 'plate_armor', 'orc_axe'],
    ability: { effect: 'stun', chance: 0.25, label: 'Удар дубиной (25%)' },
    resists: { fire: -40 },
  },
  'Гарпия': {
    name: 'Гарпия', emoji: '🦅', level: 31, hp: 320, dmgMin: 18, dmgMax: 28,
    speed: 'very_fast', xp: 160, goldMin: 32, goldMax: 50,
    dropChance: 0.45, dropPool: ['harpy_feather', 'scout_boots', 'silver_ring'],
  },

  // ── Ледяная крепость (35–40) ──────────────────────────────────────────────
  'Рыцарь льда': {
    name: 'Рыцарь льда', emoji: '🛡️', level: 36, hp: 700, dmgMin: 30, dmgMax: 45,
    speed: 'slow', xp: 220, goldMin: 45, goldMax: 70,
    dropChance: 0.55, dropPool: ['ice_shard', 'plate_armor', 'iron_sword', 'pendant_of_protection'],
    ability: { effect: 'slow', chance: 0.25, label: 'Ледяной удар (25%)' },
    resists: { fire: -30, ice: 60 },
  },
  'Маг льда': {
    name: 'Маг льда', emoji: '❄️', level: 38, hp: 450, dmgMin: 28, dmgMax: 42,
    speed: 'normal', xp: 200, goldMin: 40, goldMax: 65,
    dropChance: 0.55, dropPool: ['ice_shard', 'arcane_staff', 'mana_potion', 'amulet_of_wisdom'],
    ability: { effect: 'slow', chance: 0.40, label: 'Мороз (40%)' },
    resists: { fire: -35, ice: 50 },
  },

  // ── Legacy (старые имена, если встретятся в сейвах) ────────────────────────
  'Орк': {
    name: 'Орк', emoji: '👹', level: 10, hp: 300, dmgMin: 15, dmgMax: 25,
    speed: 'slow', xp: 60, goldMin: 15, goldMax: 25,
    dropChance: 0.50, dropPool: ['iron_sword', 'orc_axe', 'chainmail'],
    ability: { effect: 'stun', chance: 0.20, label: 'Оглушение (20%)' },
  },
  'Кабан': {
    name: 'Кабан', emoji: '🐗', level: 5, hp: 220, dmgMin: 10, dmgMax: 18,
    speed: 'slow', xp: 35, goldMin: 6, goldMax: 12,
    dropChance: 0.25, dropPool: ['boar_hide', 'raw_meat'],
  },
  'Гигантский паук': {
    name: 'Гигантский паук', emoji: '🕷️', level: 9, hp: 180, dmgMin: 8, dmgMax: 16,
    speed: 'fast', xp: 45, goldMin: 8, goldMax: 15,
    dropChance: 0.35, dropPool: ['spider_silk'],
    ability: { effect: 'poison', chance: 0.35, label: 'Яд (35%)' },
  },
  'Тролль': {
    name: 'Тролль', emoji: '👾', level: 12, hp: 400, dmgMin: 18, dmgMax: 30,
    speed: 'very_slow', xp: 90, goldMin: 22, goldMax: 38,
    dropChance: 0.40, dropPool: ['troll_blood', 'chainmail'],
    ability: { effect: 'slow', chance: 0.35, label: 'Замедление (35%)' },
    resists: { fire: -50 },
  },
};

/** Build REWARD_TABLE from catalog. */
export function buildRewardTable(): Record<string, { xp: number; goldMin: number; goldMax: number }> {
  const out: Record<string, { xp: number; goldMin: number; goldMax: number }> = {};
  for (const [k, m] of Object.entries(MONSTER_DEFS)) {
    out[k] = { xp: m.xp, goldMin: m.goldMin, goldMax: m.goldMax };
  }
  return out;
}

/** Build DROP_TABLES from catalog. */
export function buildDropTables(): Record<string, { chance: number; pool: string[] }> {
  const out: Record<string, { chance: number; pool: string[] }> = {};
  for (const [k, m] of Object.entries(MONSTER_DEFS)) {
    out[k] = { chance: m.dropChance, pool: m.dropPool };
  }
  return out;
}

/** Build ENEMY_EFFECT_ON_HIT from catalog. */
export function buildEffectOnHit(): Record<string, { effect: StatusEffectType; chance: number }> {
  const out: Record<string, { effect: StatusEffectType; chance: number }> = {};
  for (const [k, m] of Object.entries(MONSTER_DEFS)) {
    if (m.ability) out[k] = { effect: m.ability.effect, chance: m.ability.chance };
  }
  return out;
}

/** Build resistance map from catalog. */
export function buildResistances(): Record<string, Partial<Record<DamageType, number>>> {
  const out: Record<string, Partial<Record<DamageType, number>>> = {};
  for (const [k, m] of Object.entries(MONSTER_DEFS)) {
    if (m.resists) out[k] = m.resists;
  }
  return out;
}
