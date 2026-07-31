// ─── BOSS SYSTEM ──────────────────────────────────────────────────────────────
import type { Enemy } from '../combat';
import type { Item } from '../inventory';

/** Unique enemy ids reserved for bosses (normal enemies use 1…N). */
export const BOSS_ID       = 9999; // Главарь гоблинов (пещера)
export const FIELD_BOSS_ID = 9998; // Огромный Кабан (Тихие поля)

// ── Goblin Chief — Cave Boss ──────────────────────────────────────────────────
export const CAVE_BOSS_DEF: Omit<Enemy, 'id'> = {
  name:            'Главарь гоблинов',
  emoji:           '👑',
  x:               10,
  y:               10,
  hp:              750,
  maxHp:           750,
  baseMaxHp:       750,
  rarity:          'common',
  attackInterval:  1760,
  dmgMin:          10,
  dmgMax:          24,
  dead:            false,
};

// ── Huge Boar — Field Mini-Boss (Тихие поля) ─────────────────────────────────
// Reference: Молодой кабан  hp:140  interval:2400  dmg:6–12
export const FIELD_BOSS_DEF: Omit<Enemy, 'id'> = {
  name:            'Огромный Кабан',
  emoji:           '🐗',
  x:               10,
  y:               10,
  hp:              520,          // ~3.7 × young boar
  maxHp:           520,
  baseMaxHp:       520,
  rarity:          'common',
  attackInterval:  2000,         // slightly faster than young boar
  dmgMin:          14,           // ~2.3 × young min
  dmgMax:          26,           // ~2.2 × young max
  dead:            false,
};

// ── Boss reward constants ─────────────────────────────────────────────────────
export const BOSS_REWARD     = { xp: 500, gold: 300 } as const;
export const FIELD_BOSS_REWARD = { xp: 120, gold: 50 } as const;
export const BOSS_RARE_CHANCE = 0.25;
export const BOSS_COMMON_LOOT = ['black_crystal', 'iron_sword', 'orc_axe', 'iron_helm', 'chainmail', 'battle_gloves', 'scout_boots', 'silver_ring', 'amulet_of_wisdom'] as const;
export const BOSS_RARE_LOOT   = ['shadow_blade', 'void_plate', 'titan_gauntlets', 'band_of_eternity', 'heart_of_mountain'] as const;

/** Cave boss respawn (10 min). */
export const BOSS_RESPAWN_MS = 10 * 60 * 1000;

/** Field mini-boss respawn (15 min). */
export const FIELD_BOSS_RESPAWN_MS = 15 * 60 * 1000;

// ── Trophies ──────────────────────────────────────────────────────────────────
const GOBLIN_CHIEF_TROPHY: Omit<Item, 'id'> = {
  key:     'goblin_chief_trophy',
  name:    'Трофей главаря гоблинов',
  type:    'weapon',
  rarity:  'epic',
  bonuses: { damage: 12, strength: 2 },
};

const HUGE_BOAR_TROPHY: Omit<Item, 'id'> = {
  key:     'huge_boar_trophy',
  name:    'Клык огромного кабана',
  type:    'weapon',
  rarity:  'rare',
  bonuses: { damage: 6, strength: 1 },
};

export function makeBossTrophy(): Item {
  return {
    ...GOBLIN_CHIEF_TROPHY,
    id: `goblin_chief_trophy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };
}

export function makeFieldBossTrophy(): Item {
  return {
    ...HUGE_BOAR_TROPHY,
    id: `huge_boar_trophy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };
}

// ── Persistent boss state (saved to localStorage) ─────────────────────────────
export interface BossState {
  caveChief: {
    firstKillDone: boolean;
    deadAt?: number;
  };
  fieldBoar: {
    firstKillDone: boolean;
    deadAt?: number;
  };
}

export const INITIAL_BOSS_STATE: BossState = {
  caveChief: { firstKillDone: false },
  fieldBoar: { firstKillDone: false },
};

// ── Reward summary passed to the victory panel ────────────────────────────────
export interface BossRewardInfo {
  xp:          number;
  gold:        number;
  dropItem:    Item;
  trophyItem?: Item;
  leveledUp:   boolean;
  newLevel:    number;
  wasFirstKill: boolean;
}
