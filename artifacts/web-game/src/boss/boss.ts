// ─── BOSS SYSTEM ──────────────────────────────────────────────────────────────
import type { Enemy, LocationId } from '../combat';
import type { Item } from '../inventory';

interface BossConfig {
  /** Unique enemy id reserved for this boss (normal enemies use 1…N). */
  id: number;
  def: Omit<Enemy, 'id'>;
  reward: { xp: number; gold: number };
  respawnMs: number;
  trophy: Omit<Item, 'id'>;
  isMiniBoss: boolean;
  /** Location this boss spawns in (drives the respawn-check loop in useCombat). */
  locationId: LocationId;
  /** Whether every non-boss enemy in the location must be dead before this boss can (re)spawn. */
  requiresAreaClear: boolean;
  /** Extra log line shown once, right after the trophy pickup, only on the very first kill. */
  unlockMessage?: string;
  /** Narrative log lines shown only on the very first kill of this boss. */
  firstKillStoryLines: string[];
}

/**
 * Single source of truth for every boss: id, spawn/combat stats, reward,
 * respawn timer, trophy drop and combat-flow metadata (spawn location,
 * area-clear requirement, first-kill story beats). `useCombat` drives all
 * boss spawn/death/respawn logic generically off this map — no boss is
 * ever hand-coded in more than one place.
 */
export const BOSS_CONFIGS = {
  caveChief: {
    id: 9999, // Главарь гоблинов (пещера)
    def: {
      name: 'Главарь гоблинов', emoji: '👑', x: 19, y: 25,
      hp: 750, maxHp: 750, baseMaxHp: 750, rarity: 'common',
      attackInterval: 1760, dmgMin: 10, dmgMax: 24, dead: false,
    },
    reward: { xp: 500, gold: 300 },
    respawnMs: 10 * 60 * 1000,
    trophy: {
      key: 'goblin_chief_trophy', name: 'Трофей главаря гоблинов',
      type: 'weapon', rarity: 'epic', bonuses: { damage: 12, strength: 2 },
    },
    isMiniBoss: false,
    locationId: 'wolfcave',
    requiresAreaClear: true,
    unlockMessage: '🏛️ Руины разблокированы! Путь на восток открыт.',
    firstKillStoryLines: [
      '🌑 У главаря в мешке — чёрные осколки и карта тропы глубже в руины…',
      '📜 Вернись к старосте — ему нужно это услышать.',
    ],
  },
  fieldBoar: {
    id: 9998, // Огромный Кабан (Тихие поля)
    def: {
      name: 'Огромный Кабан', emoji: '🐗', x: 14, y: 16,
      hp: 520, maxHp: 520, baseMaxHp: 520, rarity: 'common',
      attackInterval: 2000, dmgMin: 14, dmgMax: 26, dead: false,
    },
    reward: { xp: 120, gold: 50 },
    respawnMs: 15 * 60 * 1000,
    trophy: {
      key: 'huge_boar_trophy', name: 'Клык огромного кабана',
      type: 'weapon', rarity: 'rare', bonuses: { damage: 6, strength: 1 },
    },
    isMiniBoss: true,
    locationId: 'forest',
    requiresAreaClear: false,
    firstKillStoryLines: [
      '🌑 На земле рядом с тушей мерцают чёрные осколки…',
      '📜 Стоит рассказать об этом старосте в деревне.',
    ],
    unlockMessage: undefined,
  },
  ruinsKeeper: {
    id: 9997, // Хранитель склепа (Древние руины)
    def: {
      name: 'Хранитель склепа', emoji: '⚰️', x: 19, y: 25,
      hp: 1100, maxHp: 1100, baseMaxHp: 1100, rarity: 'common',
      attackInterval: 1600, dmgMin: 22, dmgMax: 36, dead: false,
    },
    reward: { xp: 650, gold: 400 },
    respawnMs: 12 * 60 * 1000,
    trophy: {
      key: 'tomb_keeper_trophy', name: 'Печать склепа',
      type: 'amulet', rarity: 'epic', bonuses: { defense: 6, hp: 40, iceResist: 8 },
    },
    isMiniBoss: false,
    locationId: 'ruins',
    requiresAreaClear: true,
    firstKillStoryLines: [
      '🌑 Склеп затих. Печать на амулете холодит ладонь…',
      '📜 Староста должен узнать: руины ещё живы.',
    ],
    unlockMessage: undefined,
  },
  swampHorror: {
    id: 9996, // Трясинный ужас (Гнилые болота)
    def: {
      name: 'Трясинный ужас', emoji: '🫧', x: 22, y: 24,
      hp: 1400, maxHp: 1400, baseMaxHp: 1400, rarity: 'common',
      attackInterval: 1700, dmgMin: 26, dmgMax: 42, dead: false,
    },
    reward: { xp: 800, gold: 500 },
    respawnMs: 12 * 60 * 1000,
    trophy: {
      key: 'swamp_horror_trophy', name: 'Сердце трясины',
      type: 'amulet', rarity: 'epic', bonuses: { hp: 50, defense: 5, vitality: 2 },
    },
    isMiniBoss: false,
    locationId: 'swamp',
    requiresAreaClear: true,
    firstKillStoryLines: [
      '🌑 Трясина оседает. В центре — пульсирующий сгусток…',
      '📜 Отнеси весть старосте. Болота ещё не побеждены, но ранены.',
    ],
    unlockMessage: undefined,
  },
  mineGuardian: {
    id: 9995, // Каменный страж (Заброшенная шахта)
    def: {
      name: 'Каменный страж', emoji: '🗿', x: 19, y: 25,
      hp: 1700, maxHp: 1700, baseMaxHp: 1700, rarity: 'common',
      attackInterval: 1900, dmgMin: 30, dmgMax: 48, dead: false,
    },
    reward: { xp: 950, gold: 600 },
    respawnMs: 12 * 60 * 1000,
    trophy: {
      key: 'stone_guardian_trophy', name: 'Осколок ядра голема',
      type: 'ring', rarity: 'epic', bonuses: { defense: 8, strength: 2, hp: 30 },
    },
    isMiniBoss: false,
    locationId: 'mine',
    requiresAreaClear: true,
    firstKillStoryLines: [
      '🌑 Шахта гулко молчит. В обломках — тёплый осколок ядра…',
      '📜 Старосте будет что рассказать о глубинах.',
    ],
    unlockMessage: undefined,
  },
  passLord: {
    id: 9994, // Владыка перевала (Каменный перевал)
    def: {
      name: 'Владыка перевала', emoji: '🏔️', x: 22, y: 23,
      hp: 2000, maxHp: 2000, baseMaxHp: 2000, rarity: 'common',
      attackInterval: 1800, dmgMin: 34, dmgMax: 52, dead: false,
    },
    reward: { xp: 1100, gold: 700 },
    respawnMs: 12 * 60 * 1000,
    trophy: {
      key: 'pass_lord_trophy', name: 'Корона ветров',
      type: 'helmet', rarity: 'epic', bonuses: { defense: 6, agility: 3, hp: 35 },
    },
    isMiniBoss: false,
    locationId: 'pass',
    requiresAreaClear: true,
    firstKillStoryLines: [
      '🌑 Ветер на перевале стих. В снегу — корона из кованого льда и камня…',
      '📜 Путь к крепости открыт. Староста ждёт вестей.',
    ],
    unlockMessage: undefined,
  },
  iceKing: {
    id: 9993, // Король льда (Ледяная крепость)
    def: {
      name: 'Король льда', emoji: '❄️', x: 15, y: 7,
      hp: 2500, maxHp: 2500, baseMaxHp: 2500, rarity: 'common',
      attackInterval: 1650, dmgMin: 38, dmgMax: 58, dead: false,
    },
    reward: { xp: 1500, gold: 1000 },
    respawnMs: 15 * 60 * 1000,
    trophy: {
      key: 'ice_king_trophy', name: 'Корона вечной зимы',
      type: 'helmet', rarity: 'legendary', bonuses: { defense: 10, iceResist: 15, hp: 50, intelligence: 3 },
    },
    isMiniBoss: false,
    locationId: 'icefort',
    requiresAreaClear: true,
    firstKillStoryLines: [
      '🌑 Крепость дрогнула. В тронном зале тает чёрный лёд — след Бездны.',
      '📜 Вернись в долину. Эта победа — конец главы… и начало чего-то большего.',
    ],
    unlockMessage: undefined,
  },
} satisfies Record<string, BossConfig>;

export type BossKey = keyof typeof BOSS_CONFIGS;

/** O(1) lookup from an enemy id back to its boss key (undefined if not a boss). */
const ID_TO_BOSS_KEY: ReadonlyMap<number, BossKey> = new Map(
  (Object.keys(BOSS_CONFIGS) as BossKey[]).map((key) => [BOSS_CONFIGS[key].id, key]),
);

export function bossKeyForEnemyId(id: number): BossKey | undefined {
  return ID_TO_BOSS_KEY.get(id);
}

export function makeTrophyForBoss(key: BossKey): Item {
  const { trophy } = BOSS_CONFIGS[key];
  return { ...trophy, id: `${trophy.key}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
}

// ── Individual boss ids — kept exported: the UI (App.tsx, Minimap.tsx) checks
//    against these directly (e.g. "is the active enemy the cave boss?"). ──────
export const BOSS_ID       = BOSS_CONFIGS.caveChief.id;
export const FIELD_BOSS_ID = BOSS_CONFIGS.fieldBoar.id;
export const RUINS_BOSS_ID = BOSS_CONFIGS.ruinsKeeper.id;
export const SWAMP_BOSS_ID = BOSS_CONFIGS.swampHorror.id;
export const MINE_BOSS_ID  = BOSS_CONFIGS.mineGuardian.id;
export const PASS_BOSS_ID  = BOSS_CONFIGS.passLord.id;
export const ICE_BOSS_ID   = BOSS_CONFIGS.iceKing.id;

export const BOSS_RARE_CHANCE = 0.25;
export const BOSS_COMMON_LOOT = [
  'black_crystal', 'iron_sword', 'orc_axe', 'iron_helm', 'chainmail',
  'battle_gloves', 'scout_boots', 'silver_ring', 'amulet_of_wisdom',
] as const;
export const BOSS_RARE_LOOT = [
  'shadow_blade', 'void_plate', 'titan_gauntlets', 'band_of_eternity', 'heart_of_mountain',
] as const;

export const ALL_BOSS_IDS = new Set(Object.values(BOSS_CONFIGS).map((c) => c.id));

export function isBossId(id: number): boolean {
  return ALL_BOSS_IDS.has(id);
}

export const MINI_BOSS_IDS = new Set(
  Object.values(BOSS_CONFIGS).filter((c) => c.isMiniBoss).map((c) => c.id),
);

export function isMiniBossId(id: number): boolean {
  return MINI_BOSS_IDS.has(id);
}

export function bossKindLabel(id: number): string {
  if (isMiniBossId(id)) return 'Мини-босс';
  if (isBossId(id)) return 'Босс';
  return '';
}

export type BossState = {
  [K in BossKey]: { firstKillDone: boolean; deadAt?: number };
};

export const INITIAL_BOSS_STATE: BossState = Object.fromEntries(
  (Object.keys(BOSS_CONFIGS) as BossKey[]).map((key) => [key, { firstKillDone: false }]),
) as BossState;

export function normalizeBossState(raw: Partial<BossState> | null | undefined): BossState {
  return Object.fromEntries(
    (Object.keys(BOSS_CONFIGS) as BossKey[]).map((key) => [key, raw?.[key] ?? { firstKillDone: false }]),
  ) as BossState;
}

export interface BossRewardInfo {
  xp: number; gold: number; dropItem: Item; trophyItem?: Item;
  leveledUp: boolean; newLevel: number; wasFirstKill: boolean;
}
