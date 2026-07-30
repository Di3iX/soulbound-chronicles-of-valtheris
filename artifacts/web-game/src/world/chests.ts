// ─── WORLD CHESTS ─────────────────────────────────────────────────────────────
import type { LocationId } from '../combat';
import { makeItem, type Item } from '../inventory';

export interface ChestDef {
  /** Unique id — used in save (openedChests). */
  id: string;
  location: LocationId;
  x: number;
  y: number;
  /** Gold range (inclusive). */
  goldMin: number;
  goldMax: number;
  /** Possible item keys; one is rolled if pool is non-empty. */
  itemPool: string[];
  /** Chance 0–1 to get an item from the pool (gold always granted). */
  itemChance: number;
}

/** All chests in the world. Coordinates must sit on walkable floor tiles (0). */
export const CHEST_DEFS: ChestDef[] = [
  // ── Village ──────────────────────────────────────────────────────────────
  {
    id: 'village_storage',
    location: 'village',
    x: 14, y: 12,
    goldMin: 8, goldMax: 18,
    itemPool: ['healing_potion', 'raw_meat'],
    itemChance: 0.7,
  },
  // ── Тихие поля (forest) ──────────────────────────────────────────────────
  {
    id: 'fields_north',
    location: 'forest',
    x: 4, y: 4,
    goldMin: 12, goldMax: 28,
    itemPool: ['healing_potion', 'mana_potion', 'raw_meat'],
    itemChance: 0.75,
  },
  {
    id: 'fields_east',
    location: 'forest',
    x: 15, y: 8,
    goldMin: 15, goldMax: 35,
    itemPool: ['healing_potion', 'rusty_sword', 'leather_gloves'],
    itemChance: 0.6,
  },
  {
    id: 'fields_south',
    location: 'forest',
    x: 8, y: 14,
    goldMin: 10, goldMax: 22,
    itemPool: ['raw_meat', 'rabbit_fur'],
    itemChance: 0.8,
  },
  // ── Тёмный лес ───────────────────────────────────────────────────────────
  {
    id: 'darkforest_clearing',
    location: 'darkforest',
    x: 6, y: 6,
    goldMin: 25, goldMax: 50,
    itemPool: ['greater_healing_potion', 'mana_potion', 'leather_armor'],
    itemChance: 0.65,
  },
  {
    id: 'darkforest_ruins',
    location: 'darkforest',
    x: 14, y: 12,
    goldMin: 30, goldMax: 55,
    itemPool: ['iron_sword', 'wolf_hide', 'healing_potion'],
    itemChance: 0.55,
  },
  // ── Волчья пещера ────────────────────────────────────────────────────────
  {
    id: 'wolfcave_cache',
    location: 'wolfcave',
    x: 10, y: 8,
    goldMin: 35, goldMax: 70,
    itemPool: ['greater_healing_potion', 'wolf_fang', 'leather_helm'],
    itemChance: 0.7,
  },
  // ── Заброшенная дорога ───────────────────────────────────────────────────
  {
    id: 'road_wagon',
    location: 'road',
    x: 7, y: 10,
    goldMin: 40, goldMax: 80,
    itemPool: ['iron_sword', 'greater_mana_potion', 'light_boots'],
    itemChance: 0.6,
  },
  {
    id: 'road_camp',
    location: 'road',
    x: 14, y: 5,
    goldMin: 35, goldMax: 65,
    itemPool: ['healing_potion', 'mana_potion', 'leather_gloves'],
    itemChance: 0.7,
  },
  // ── Древние руины ────────────────────────────────────────────────────────
  {
    id: 'ruins_altar',
    location: 'ruins',
    x: 9, y: 9,
    goldMin: 60, goldMax: 110,
    itemPool: ['greater_healing_potion', 'iron_sword', 'leather_armor'],
    itemChance: 0.55,
  },
];

export type OpenedChests = Record<string, boolean>;

export function getChestsAt(
  location: LocationId,
  x: number,
  y: number,
  opened: OpenedChests,
): ChestDef | undefined {
  return CHEST_DEFS.find(
    c => c.location === location && c.x === x && c.y === y && !opened[c.id],
  );
}

export function getLocationChests(
  location: LocationId,
  opened: OpenedChests,
): Array<ChestDef & { opened: boolean }> {
  return CHEST_DEFS
    .filter(c => c.location === location)
    .map(c => ({ ...c, opened: !!opened[c.id] }));
}

export interface ChestLootResult {
  gold: number;
  item?: Item;
  logs: string[];
}

/** Roll gold + optional item for a chest. Does not mutate save state. */
export function openChest(def: ChestDef): ChestLootResult {
  const gold =
    Math.floor(Math.random() * (def.goldMax - def.goldMin + 1)) + def.goldMin;
  const logs: string[] = [`📦 Сундук открыт! +${gold} золота`];
  let item: Item | undefined;

  if (def.itemPool.length > 0 && Math.random() < def.itemChance) {
    const key = def.itemPool[Math.floor(Math.random() * def.itemPool.length)];
    try {
      item = makeItem(key);
      logs.push(`🎁 Найдено: ${item.name}!`);
    } catch {
      // unknown key — skip item
    }
  }

  return { gold, item, logs };
}
