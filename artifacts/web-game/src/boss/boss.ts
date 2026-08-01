// ─── BOSS SYSTEM ──────────────────────────────────────────────────────────────
import type { Enemy } from '../combat';
import type { Item } from '../inventory';

/** Unique enemy ids reserved for bosses (normal enemies use 1…N). */
export const BOSS_ID       = 9999; // Главарь гоблинов (пещера)
export const FIELD_BOSS_ID = 9998; // Огромный Кабан (Тихие поля)
export const RUINS_BOSS_ID = 9997; // Хранитель склепа (Древние руины)

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

export const BOSS_REWARD       = { xp: 500, gold: 300 } as const;
export const FIELD_BOSS_REWARD = { xp: 120, gold: 50 } as const;
export const RUINS_BOSS_REWARD = { xp: 650, gold: 400 } as const;
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

export const ALL_BOSS_IDS = new Set([BOSS_ID, FIELD_BOSS_ID, RUINS_BOSS_ID]);

export interface BossState {
  caveChief:   { firstKillDone: boolean; deadAt?: number };
  fieldBoar:   { firstKillDone: boolean; deadAt?: number };
  ruinsKeeper: { firstKillDone: boolean; deadAt?: number };
}

export const INITIAL_BOSS_STATE: BossState = {
  caveChief:   { firstKillDone: false },
  fieldBoar:   { firstKillDone: false },
  ruinsKeeper: { firstKillDone: false },
};

export function normalizeBossState(raw: Partial<BossState> | null | undefined): BossState {
  return {
    caveChief:   raw?.caveChief   ?? { firstKillDone: false },
    fieldBoar:   raw?.fieldBoar   ?? { firstKillDone: false },
    ruinsKeeper: raw?.ruinsKeeper ?? { firstKillDone: false },
  };
}

export interface BossRewardInfo {
  xp: number; gold: number; dropItem: Item; trophyItem?: Item;
  leveledUp: boolean; newLevel: number; wasFirstKill: boolean;
}
