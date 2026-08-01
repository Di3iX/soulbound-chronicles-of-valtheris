// ─── BOSS SYSTEM ──────────────────────────────────────────────────────────────
import type { Enemy } from '../combat';
import type { Item } from '../inventory';

/** Unique enemy ids reserved for bosses (normal enemies use 1…N). */
export const BOSS_ID       = 9999; // Главарь гоблинов (пещера)
export const FIELD_BOSS_ID = 9998; // Огромный Кабан (Тихие поля)
export const RUINS_BOSS_ID = 9997; // Хранитель склепа (Древние руины)
export const SWAMP_BOSS_ID = 9996; // Трясинный ужас (Гнилые болота)
export const MINE_BOSS_ID  = 9995; // Каменный страж (Заброшенная шахта)
export const PASS_BOSS_ID  = 9994; // Владыка перевала (Каменный перевал)

export const CAVE_BOSS_DEF: Omit<Enemy, 'id'> = {
  name: 'Главарь гоблинов', emoji: '👑', x: 10, y: 10,
  hp: 750, maxHp: 750, baseMaxHp: 750, rarity: 'common',
  attackInterval: 1760, dmgMin: 10, dmgMax: 24, dead: false,
};

export const FIELD_BOSS_DEF: Omit<Enemy, 'id'> = {
  name: 'Огромный Кабан', emoji: '🐗', x: 10, y: 10,
  hp: 520, maxHp: 520, baseMaxHp: 520, rarity: 'common',
  attackInterval: 2000, dmgMin: 14, dmgMax: 26, dead: false,
};

export const RUINS_BOSS_DEF: Omit<Enemy, 'id'> = {
  name: 'Хранитель склепа', emoji: '⚰️', x: 10, y: 10,
  hp: 1100, maxHp: 1100, baseMaxHp: 1100, rarity: 'common',
  attackInterval: 1600, dmgMin: 22, dmgMax: 36, dead: false,
};

export const SWAMP_BOSS_DEF: Omit<Enemy, 'id'> = {
  name: 'Трясинный ужас', emoji: '🫧', x: 10, y: 10,
  hp: 1400, maxHp: 1400, baseMaxHp: 1400, rarity: 'common',
  attackInterval: 1700, dmgMin: 26, dmgMax: 42, dead: false,
};

export const MINE_BOSS_DEF: Omit<Enemy, 'id'> = {
  name: 'Каменный страж', emoji: '🗿', x: 10, y: 10,
  hp: 1700, maxHp: 1700, baseMaxHp: 1700, rarity: 'common',
  attackInterval: 1900, dmgMin: 30, dmgMax: 48, dead: false,
};

export const PASS_BOSS_DEF: Omit<Enemy, 'id'> = {
  name: 'Владыка перевала', emoji: '🏔️', x: 10, y: 10,
  hp: 2000, maxHp: 2000, baseMaxHp: 2000, rarity: 'common',
  attackInterval: 1800, dmgMin: 34, dmgMax: 52, dead: false,
};

export const BOSS_REWARD       = { xp: 500, gold: 300 } as const;
export const FIELD_BOSS_REWARD = { xp: 120, gold: 50 } as const;
export const RUINS_BOSS_REWARD = { xp: 650, gold: 400 } as const;
export const SWAMP_BOSS_REWARD = { xp: 800, gold: 500 } as const;
export const MINE_BOSS_REWARD  = { xp: 950, gold: 600 } as const;
export const PASS_BOSS_REWARD  = { xp: 1100, gold: 700 } as const;
export const BOSS_RARE_CHANCE  = 0.25;
export const BOSS_COMMON_LOOT  = [
  'black_crystal', 'iron_sword', 'orc_axe', 'iron_helm', 'chainmail',
  'battle_gloves', 'scout_boots', 'silver_ring', 'amulet_of_wisdom',
] as const;
export const BOSS_RARE_LOOT = [
  'shadow_blade', 'void_plate', 'titan_gauntlets', 'band_of_eternity', 'heart_of_mountain',
] as const;

export const BOSS_RESPAWN_MS       = 10 * 60 * 1000;
export const FIELD_BOSS_RESPAWN_MS = 15 * 60 * 1000;
export const RUINS_BOSS_RESPAWN_MS = 12 * 60 * 1000;
export const SWAMP_BOSS_RESPAWN_MS = 12 * 60 * 1000;
export const MINE_BOSS_RESPAWN_MS  = 12 * 60 * 1000;
export const PASS_BOSS_RESPAWN_MS  = 12 * 60 * 1000;

const GOBLIN_CHIEF_TROPHY: Omit<Item, 'id'> = {
  key: 'goblin_chief_trophy', name: 'Трофей главаря гоблинов',
  type: 'weapon', rarity: 'epic', bonuses: { damage: 12, strength: 2 },
};
const HUGE_BOAR_TROPHY: Omit<Item, 'id'> = {
  key: 'huge_boar_trophy', name: 'Клык огромного кабана',
  type: 'weapon', rarity: 'rare', bonuses: { damage: 6, strength: 1 },
};
const TOMB_KEEPER_TROPHY: Omit<Item, 'id'> = {
  key: 'tomb_keeper_trophy', name: 'Печать склепа',
  type: 'amulet', rarity: 'epic', bonuses: { defense: 6, hp: 40, iceResist: 8 },
};

export function makeBossTrophy(): Item {
  return { ...GOBLIN_CHIEF_TROPHY, id: `goblin_chief_trophy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
}
export function makeFieldBossTrophy(): Item {
  return { ...HUGE_BOAR_TROPHY, id: `huge_boar_trophy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
}
export function makeRuinsBossTrophy(): Item {
  return { ...TOMB_KEEPER_TROPHY, id: `tomb_keeper_trophy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
}

const SWAMP_HORROR_TROPHY: Omit<Item, 'id'> = {
  key: 'swamp_horror_trophy', name: 'Сердце трясины',
  type: 'amulet', rarity: 'epic', bonuses: { hp: 50, defense: 5, vitality: 2 },
};
export function makeSwampBossTrophy(): Item {
  return { ...SWAMP_HORROR_TROPHY, id: `swamp_horror_trophy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
}

const STONE_GUARDIAN_TROPHY: Omit<Item, 'id'> = {
  key: 'stone_guardian_trophy', name: 'Осколок ядра голема',
  type: 'ring', rarity: 'epic', bonuses: { defense: 8, strength: 2, hp: 30 },
};
export function makeMineBossTrophy(): Item {
  return { ...STONE_GUARDIAN_TROPHY, id: `stone_guardian_trophy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
}

const PASS_LORD_TROPHY: Omit<Item, 'id'> = {
  key: 'pass_lord_trophy', name: 'Корона ветров',
  type: 'helmet', rarity: 'epic', bonuses: { defense: 6, agility: 3, hp: 35 },
};
export function makePassBossTrophy(): Item {
  return { ...PASS_LORD_TROPHY, id: `pass_lord_trophy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
}

export const ALL_BOSS_IDS = new Set([BOSS_ID, FIELD_BOSS_ID, RUINS_BOSS_ID, SWAMP_BOSS_ID, MINE_BOSS_ID, PASS_BOSS_ID]);

export interface BossState {
  caveChief:    { firstKillDone: boolean; deadAt?: number };
  fieldBoar:    { firstKillDone: boolean; deadAt?: number };
  ruinsKeeper:  { firstKillDone: boolean; deadAt?: number };
  swampHorror:  { firstKillDone: boolean; deadAt?: number };
  mineGuardian: { firstKillDone: boolean; deadAt?: number };
  passLord:     { firstKillDone: boolean; deadAt?: number };
}

export const INITIAL_BOSS_STATE: BossState = {
  caveChief:    { firstKillDone: false },
  fieldBoar:    { firstKillDone: false },
  ruinsKeeper:  { firstKillDone: false },
  swampHorror:  { firstKillDone: false },
  mineGuardian: { firstKillDone: false },
  passLord:     { firstKillDone: false },
};

export function normalizeBossState(raw: Partial<BossState> | null | undefined): BossState {
  return {
    caveChief:    raw?.caveChief    ?? { firstKillDone: false },
    fieldBoar:    raw?.fieldBoar    ?? { firstKillDone: false },
    ruinsKeeper:  raw?.ruinsKeeper  ?? { firstKillDone: false },
    swampHorror:  raw?.swampHorror  ?? { firstKillDone: false },
    mineGuardian: raw?.mineGuardian ?? { firstKillDone: false },
    passLord:     raw?.passLord     ?? { firstKillDone: false },
  };
}

export interface BossRewardInfo {
  xp: number; gold: number; dropItem: Item; trophyItem?: Item;
  leveledUp: boolean; newLevel: number; wasFirstKill: boolean;
}
