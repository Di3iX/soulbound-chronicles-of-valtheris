// ─── WORLD / LOCATIONS ────────────────────────────────────────────────────────
import type { LocationId } from '../combat';

// ── Map viewport constants ────────────────────────────────────────────────────
export const MAP_COLS = 20;
export const MAP_ROWS = 20;
export const VP_COLS  = 10;   // tiles visible horizontally
export const VP_ROWS  = 10;   // tiles visible vertically

// ── Supporting types ──────────────────────────────────────────────────────────
export type ExitDef = { to: LocationId; spawnAt: { x: number; y: number } };
export interface NpcDef { id: string; name: string; emoji: string; x: number; y: number; }

// ── Location type ─────────────────────────────────────────────────────────────
export interface Location {
  /** Unique location identifier. */
  id:          LocationId;
  /** Display name shown in the UI (Russian). */
  name:        string;
  /** Short flavour description. */
  description: string;
  /** Recommended player level. */
  level:       number;
  /** Biome tag used for tile-rendering hints. */
  biome:       'city' | 'forest' | 'cave' | 'fields' | 'graveyard';
  /** Names of enemy types that spawn here. */
  enemies:     string[];
  /** Exit portals keyed by "x,y" tile coordinates. */
  exits:       Map<string, ExitDef>;
  /** Whether the player can travel here yet. */
  unlocked:    boolean;
  /** CSS background colour for the map area. */
  background:  string;

  // ── Additional runtime data (used by App.tsx directly) ────────────────────
  /** True when combat cannot start here. */
  safe:  boolean;
  /** Emoji shown in the status bar and transition overlay. */
  emoji: string;
  /** 20×20 tile grid. 0=floor 1=wall/tree 2=rock 3=water 4=exit. */
  map:   number[][];
  /** Default player spawn coordinates for this location. */
  spawn: { x: number; y: number };
  /** NPCs present in this location. */
  npcs:  NpcDef[];
}

// ── Internal exit-map builder ─────────────────────────────────────────────────
function buildExits(
  defs: Array<[number, number, LocationId, number, number]>,
): Map<string, ExitDef> {
  const m = new Map<string, ExitDef>();
  for (const [x, y, to, sx, sy] of defs)
    m.set(`${x},${y}`, { to, spawnAt: { x: sx, y: sy } });
  return m;
}

// ── Location definitions ──────────────────────────────────────────────────────
// Tile key: 0=floor  1=wall/tree  2=rock  3=water  4=exit
const LOCATIONS: Record<LocationId, Location> = {
  city: {
    id:          'city',
    name:        'Город',
    description: 'Безопасный торговый город, укреплённый каменными стенами.',
    level:       1,
    biome:       'city',
    enemies:     [],
    exits:       buildExits([
      [19,  9, 'forest', 1,  9],
      [19, 10, 'forest', 1, 10],
      [ 9, 19, 'fields', 9,  1],
      [10, 19, 'fields',10,  1],
    ]),
    unlocked:    true,
    background:  '#1e1e28',
    safe:        true,
    emoji:       '🏰',
    spawn:       { x: 2, y: 16 },
    npcs: [
      { id: 'smith',    name: 'Кузнец',   emoji: '⚒️', x:  4, y:  5 },
      { id: 'alch',     name: 'Алхимик',  emoji: '🧪', x: 15, y:  5 },
      { id: 'merchant', name: 'Торговец', emoji: '🛒', x:  4, y: 13 },
      { id: 'elder',    name: 'Староста', emoji: '👴', x: 15, y: 13 },
    ],
    map: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,0,1],
      [1,0,0,0,1,0,0,0,1,0,0,1,0,0,0,1,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1],
      [1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,4],
      [1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,4],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1],
      [1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,1],
    ],
  },

  forest: {
    id:          'forest',
    name:        'Лес',
    description: 'Густой тёмный лес, населённый гоблинами и волками.',
    level:       2,
    biome:       'forest',
    enemies:     ['Гоблин', 'Волк'],
    exits:       buildExits([
      [ 0,  9, 'city',   18,  9],
      [ 0, 10, 'city',   18, 10],
      [19,  9, 'cave',    1,  9],
      [19, 10, 'cave',    1, 10],
    ]),
    unlocked:    true,
    background:  '#0d1a0f',
    safe:        false,
    emoji:       '🌲',
    spawn:       { x: 2, y: 9 },
    npcs:        [],
    map: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,1,1,0,1,1,0,0,1,1,0,0,1,1,0,1,1,1],
      [1,0,1,1,0,0,1,1,0,1,1,1,0,0,1,0,0,0,1,1],
      [1,0,1,0,0,1,1,0,0,0,1,0,0,1,1,0,1,0,0,1],
      [1,0,0,0,1,1,0,0,1,0,0,0,1,1,0,0,0,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
      [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
      [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
      [1,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
      [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,1],
      [1,1,0,0,1,1,0,0,1,0,0,0,1,0,0,1,1,0,0,1],
      [1,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1,0,0,1,1],
      [1,0,0,1,1,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },

  cave: {
    id:          'cave',
    name:        'Пещера',
    description: 'Мрачная пещера с орками и гигантскими пауками.',
    level:       5,
    biome:       'cave',
    enemies:     ['Орк', 'Гигантский паук'],
    exits:       buildExits([
      [0,  9, 'forest', 17,  9],
      [0, 10, 'forest', 17, 10],
    ]),
    unlocked:    true,
    background:  '#111118',
    safe:        false,
    emoji:       '⛏️',
    spawn:       { x: 2, y: 9 },
    npcs:        [],
    map: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,2,0,0,0,2,0,0,2,0,0,0,0,2,0,0,0,1],
      [1,0,2,0,0,0,0,0,0,2,0,0,0,0,0,0,0,2,0,1],
      [1,2,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,0,1],
      [1,0,0,0,0,2,0,0,0,0,0,0,0,0,2,0,0,0,2,1],
      [1,0,0,2,0,0,0,2,0,0,0,0,2,0,0,0,0,2,0,1],
      [1,0,0,0,2,0,0,0,0,2,0,0,0,0,0,2,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,2,0,0,0,2,0,0,0,0,0,2,0,0,0,1],
      [1,0,2,0,0,0,0,2,0,0,0,0,2,0,0,0,0,2,0,1],
      [1,2,0,0,2,0,0,0,0,0,0,0,0,0,2,0,0,0,0,1],
      [1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,2,0,0,1],
      [1,0,0,0,2,0,0,0,0,2,0,0,0,2,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },

  fields: {
    id:          'fields',
    name:        'Поля',
    description: 'Открытые равнины с волками и кабанами.',
    level:       3,
    biome:       'fields',
    enemies:     ['Волк', 'Кабан'],
    exits:       buildExits([
      [ 9, 0, 'city',      9, 17],
      [10, 0, 'city',     10, 17],
      [19, 9, 'graveyard', 1,  9],
      [19,10, 'graveyard', 1, 10],
    ]),
    unlocked:    true,
    background:  '#0f1a0a',
    safe:        false,
    emoji:       '🌾',
    spawn:       { x: 9, y: 2 },
    npcs:        [],
    map: [
      [1,1,1,1,1,1,1,1,1,4,4,1,1,1,1,1,1,1,1,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [0,0,0,0,2,2,0,0,0,0,0,0,0,2,2,0,0,0,0,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
      [0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1],
      [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [0,0,0,0,2,2,0,0,0,0,0,0,0,2,2,0,0,0,0,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },

  graveyard: {
    id:          'graveyard',
    name:        'Кладбище',
    description: 'Проклятое кладбище со скелетами и зомби.',
    level:       6,
    biome:       'graveyard',
    enemies:     ['Скелет', 'Зомби'],
    exits:       buildExits([
      [0,  9, 'fields', 17,  9],
      [0, 10, 'fields', 17, 10],
    ]),
    unlocked:    true,
    background:  '#0d0f0d',
    safe:        false,
    emoji:       '🪦',
    spawn:       { x: 2, y: 9 },
    npcs:        [],
    map: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,2,0,2,0,0,2,0,0,2,0,0,2,0,0,2,0,0,1],
      [1,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,1],
      [1,2,0,2,0,0,0,0,0,2,0,0,0,0,2,0,2,0,0,1],
      [1,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,2,1],
      [1,0,2,0,0,0,0,2,0,0,0,0,0,2,0,0,0,2,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,2,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,2,1],
      [1,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,2,0,0,1],
      [1,2,0,0,0,0,0,2,0,0,0,0,0,0,2,0,0,0,0,1],
      [1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
      [1,0,0,0,0,2,0,0,0,2,0,0,0,0,2,0,0,0,0,1],
      [1,0,2,0,0,0,0,0,0,0,0,2,0,0,0,0,2,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },
};

// ── Public helper functions ───────────────────────────────────────────────────

/** Return the full Location object for a given id. */
export function getLocation(id: LocationId): Location {
  return LOCATIONS[id];
}

/**
 * Return the default spawn coordinates for a location.
 * Use when teleporting the player to a new area.
 */
export function moveToLocation(id: LocationId): { x: number; y: number } {
  return LOCATIONS[id].spawn;
}

/**
 * Look up an exit portal at tile (x, y) in the given location.
 * Returns the ExitDef if one exists there, otherwise undefined.
 */
export function getAvailableExits(
  locationId: LocationId,
  x: number,
  y: number,
): ExitDef | undefined {
  return LOCATIONS[locationId].exits.get(`${x},${y}`);
}

// ── Backward-compatible flat records (consumed by App.tsx) ────────────────────
// These are derived from the canonical LOCATIONS record so there is a single
// source of truth; App.tsx can use the same identifiers without changes.

export const LOCATION_META: Record<LocationId, { label: string; emoji: string; safe: boolean }> =
  (Object.keys(LOCATIONS) as LocationId[]).reduce((acc, id) => {
    const loc = LOCATIONS[id];
    acc[id] = { label: loc.name, emoji: loc.emoji, safe: loc.safe };
    return acc;
  }, {} as Record<LocationId, { label: string; emoji: string; safe: boolean }>);

export const LOCATION_SPAWN: Record<LocationId, { x: number; y: number }> =
  (Object.keys(LOCATIONS) as LocationId[]).reduce((acc, id) => {
    acc[id] = LOCATIONS[id].spawn;
    return acc;
  }, {} as Record<LocationId, { x: number; y: number }>);

export const LOCATION_EXITS: Record<LocationId, Map<string, ExitDef>> =
  (Object.keys(LOCATIONS) as LocationId[]).reduce((acc, id) => {
    acc[id] = LOCATIONS[id].exits;
    return acc;
  }, {} as Record<LocationId, Map<string, ExitDef>>);

export const LOCATION_MAPS: Record<LocationId, number[][]> =
  (Object.keys(LOCATIONS) as LocationId[]).reduce((acc, id) => {
    acc[id] = LOCATIONS[id].map;
    return acc;
  }, {} as Record<LocationId, number[][]>);

export const LOCATION_NPCS: Partial<Record<LocationId, NpcDef[]>> =
  (Object.keys(LOCATIONS) as LocationId[]).reduce((acc, id) => {
    const npcs = LOCATIONS[id].npcs;
    if (npcs.length > 0) acc[id] = npcs;
    return acc;
  }, {} as Partial<Record<LocationId, NpcDef[]>>);
