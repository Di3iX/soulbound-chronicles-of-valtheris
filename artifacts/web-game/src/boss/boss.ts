// ─── BOSS SYSTEM ──────────────────────────────────────────────────────────────
import type { Enemy } from '../combat';
import type { Item } from '../inventory';

/** Unique enemy id reserved for the cave boss so it is never confused with
 *  normal enemies (which are assigned ids 1…N by makeLocationEnemies). */
export const BOSS_ID = 9999;

// ── Goblin Chief — Cave Boss ──────────────────────────────────────────────────
// Reference: normal Goblin  hp:150  attackInterval:2200  dmgMin:5  dmgMax:12

export const CAVE_BOSS_DEF: Omit<Enemy, 'id'> = {
  name:            'Главарь гоблинов',
  emoji:           '👑',
  x:               10,
  y:               10,
  hp:              750,          // 5 × Goblin HP   (150 × 5)
  maxHp:           750,
  attackInterval:  1760,         // 20% faster       (2200 × 0.8)
  dmgMin:          10,           // 2 × Goblin min   (5 × 2)
  dmgMax:          24,           // 2 × Goblin max   (12 × 2)
  dead:            false,
};

// ── Boss reward constants ─────────────────────────────────────────────────────
export const BOSS_REWARD     = { xp: 500, gold: 300 } as const;
export const BOSS_RARE_CHANCE = 0.25;          // 25% chance for a rare item
export const BOSS_COMMON_LOOT = ['iron_sword', 'orc_axe', 'iron_helm', 'chainmail', 'battle_gloves', 'scout_boots'] as const;
export const BOSS_RARE_LOOT   = ['shadow_blade', 'void_plate', 'titan_gauntlets'] as const;

// ── Trophy — first kill only ──────────────────────────────────────────────────
const GOBLIN_CHIEF_TROPHY: Omit<Item, 'id'> = {
  key:     'goblin_chief_trophy',
  name:    'Трофей главаря гоблинов',
  type:    'weapon',
  rarity:  'epic',
  bonuses: { damage: 12, strength: 2 },
};

export function makeBossTrophy(): Item {
  return {
    ...GOBLIN_CHIEF_TROPHY,
    id: `goblin_chief_trophy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  };
}

// ── Persistent boss state (saved to localStorage) ─────────────────────────────
export interface BossState {
  caveChief: {
    firstKillDone: boolean;   // trophy given + ruins permanently unlocked
  };
}

export const INITIAL_BOSS_STATE: BossState = {
  caveChief: { firstKillDone: false },
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
