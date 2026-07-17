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
  id:                 LocationId;
  /** Display name shown in the UI (Russian). */
  name:               string;
  /** Short flavour description. */
  description:        string;
  /** Recommended player level. */
  recommendedLevel:   number;
  /** Biome tag. */
  biome:              'village' | 'forest' | 'cave' | 'ruins' | 'swamp';
  /** Names of enemy types that spawn here. */
  enemies:            string[];
  /** Exit portals keyed by "x,y" tile coordinates. */
  exits:              Map<string, ExitDef>;
  /** Whether the player can travel here yet. */
  unlocked:           boolean;
  /** CSS background colour for the map area. */
  background:         string;
  /** True when combat cannot start here (full HP restore on entry). */
  isSafeZone:         boolean;
  /** Emoji shown in the status bar and transition overlay. */
  emoji:              string;
  /** 20×20 tile grid. 0=floor 1=wall/tree 2=rock 3=water 4=exit. */
  map:                number[][];
  /** Default player spawn coordinates for this location. */
  spawn:              { x: number; y: number };
  /** NPCs present in this location. */
  npcs:               NpcDef[];
  /** IDs of directly connected locations (bidirectional graph). */
  connectedLocations: LocationId[];
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

  // ── VILLAGE ──────────────────────────────────────────────────────────────
  village: {
    id:                 'village',
    name:               'Деревня',
    description:        'Небольшая безопасная деревня — здесь можно отдохнуть и восстановить силы.',
    recommendedLevel:   1,
    biome:              'village',
    enemies:            [],
    exits:              buildExits([
      [19, 9, 'forest', 1, 9],
    ]),
    unlocked:           true,
    background:         '#1e1e28',
    isSafeZone:         true,
    emoji:              '🏘️',
    spawn:              { x: 2, y: 16 },
    connectedLocations: ['forest'],
    npcs: [
      { id: 'smith',    name: 'Кузнец',   emoji: '⚒️', x: 4,  y: 5  },
      { id: 'alch',     name: 'Алхимик',  emoji: '🧪', x: 15, y: 5  },
      { id: 'merchant', name: 'Торговец', emoji: '🛒', x: 4,  y: 13 },
      { id: 'elder',    name: 'Старейшина', emoji: '👴', x: 15, y: 13 },
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
      [1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1],
      [1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    ],
  },

  // ── FOREST ───────────────────────────────────────────────────────────────
  forest: {
    id:                 'forest',
    name:               'Лес',
    description:        'Густой тёмный лес, населённый гоблинами и волками.',
    recommendedLevel:   2,
    biome:              'forest',
    enemies:            ['Гоблин', 'Волк'],
    exits:              buildExits([
      [0,  9,  'village', 17, 9],
      [19, 9,  'cave',    1,  9],
      [9,  19, 'swamp',   9,  1],
    ]),
    unlocked:           true,
    background:         '#0d1a0f',
    isSafeZone:         false,
    emoji:              '🌲',
    spawn:              { x: 2, y: 9 },
    connectedLocations: ['village', 'cave', 'swamp'],
    npcs:               [],
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
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
      [1,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
      [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,1],
      [1,1,0,0,1,1,0,0,1,0,0,0,1,0,0,1,1,0,0,1],
      [1,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1,0,0,1,1],
      [1,0,0,1,1,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1],
      [1,1,1,1,1,1,1,1,1,4,1,1,1,1,1,1,1,1,1,1],
    ],
  },

  // ── CAVE ─────────────────────────────────────────────────────────────────
  cave: {
    id:                 'cave',
    name:               'Пещера',
    description:        'Мрачная пещера с орками и гигантскими пауками.',
    recommendedLevel:   4,
    biome:              'cave',
    enemies:            ['Орк', 'Гигантский паук'],
    exits:              buildExits([
      [0,  9,  'forest', 17, 9],
      [19, 9,  'ruins',  1,  9],
    ]),
    unlocked:           true,
    background:         '#111118',
    isSafeZone:         false,
    emoji:              '⛏️',
    spawn:              { x: 2, y: 9 },
    connectedLocations: ['forest', 'ruins'],
    npcs:               [],
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
      [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
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

  // ── RUINS ────────────────────────────────────────────────────────────────
  ruins: {
    id:                 'ruins',
    name:               'Руины',
    description:        'Проклятые руины древнего города, кишащие нежитью.',
    recommendedLevel:   6,
    biome:              'ruins',
    enemies:            ['Скелет', 'Зомби'],
    exits:              buildExits([
      [0, 9, 'cave', 17, 9],
    ]),
    unlocked:           true,
    background:         '#0d0f0d',
    isSafeZone:         false,
    emoji:              '🏚️',
    spawn:              { x: 2, y: 9 },
    connectedLocations: ['cave'],
    npcs:               [],
    map: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,2,0,2,0,0,2,0,0,2,0,0,2,0,0,2,0,0,1],
      [1,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,1],
      [1,2,0,2,0,0,0,0,0,2,0,0,0,0,2,0,2,0,0,1],
      [1,0,0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,2,1],
      [1,0,2,0,0,1,0,2,1,0,0,1,0,2,0,0,0,2,0,1],
      [1,0,0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,1],
      [1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,2,0,0,0,0,0,2,0,0,0,0,2,0,0,0,0,2,1],
      [1,0,0,0,2,1,0,0,1,0,2,1,0,0,0,0,2,0,0,1],
      [1,2,0,0,0,1,0,2,1,0,0,1,0,0,2,0,0,0,0,1],
      [1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,1],
      [1,0,0,0,0,2,0,0,0,2,0,0,0,0,2,0,0,0,0,1],
      [1,0,2,0,0,0,0,0,0,0,0,2,0,0,0,0,2,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
  },

  // ── SWAMP ────────────────────────────────────────────────────────────────
  swamp: {
    id:                 'swamp',
    name:               'Болото',
    description:        'Густое болото с кабанами и троллями, скрывающимися в трясине.',
    recommendedLevel:   4,
    biome:              'swamp',
    enemies:            ['Кабан', 'Тролль'],
    exits:              buildExits([
      [9, 0, 'forest', 9, 17],
    ]),
    unlocked:           true,
    background:         '#0f1a0a',
    isSafeZone:         false,
    emoji:              '🌿',
    spawn:              { x: 9, y: 2 },
    connectedLocations: ['forest'],
    npcs:               [],
    map: [
      [1,1,1,1,1,1,1,1,1,4,1,1,1,1,1,1,1,1,1,1],
      [0,3,0,0,0,0,0,3,0,0,0,0,3,0,0,0,0,3,0,1],
      [0,0,0,2,0,3,0,0,0,0,0,0,0,0,3,0,0,0,0,1],
      [0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,1],
      [0,0,0,0,2,0,3,0,0,0,0,0,3,0,0,2,0,0,0,1],
      [0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1],
      [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1],
      [0,0,0,0,0,3,0,0,0,0,0,0,0,3,0,0,0,0,0,1],
      [0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,1],
      [0,2,0,0,0,3,0,0,0,0,0,0,0,3,0,0,0,0,2,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [0,0,0,0,2,0,0,3,0,0,0,3,0,0,2,0,0,0,0,1],
      [0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [0,3,0,0,0,0,0,3,0,0,0,0,3,0,0,0,0,3,0,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
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

/**
 * Whether `to` is directly connected to `from`.
 */
export function isConnected(from: LocationId, to: LocationId): boolean {
  return LOCATIONS[from].connectedLocations.includes(to);
}

// ── Backward-compatible flat records (consumed by App.tsx) ────────────────────
// Derived from the canonical LOCATIONS record — single source of truth.

export const LOCATION_META: Record<LocationId, { label: string; emoji: string; isSafeZone: boolean }> =
  (Object.keys(LOCATIONS) as LocationId[]).reduce((acc, id) => {
    const loc = LOCATIONS[id];
    acc[id] = { label: loc.name, emoji: loc.emoji, isSafeZone: loc.isSafeZone };
    return acc;
  }, {} as Record<LocationId, { label: string; emoji: string; isSafeZone: boolean }>);

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
