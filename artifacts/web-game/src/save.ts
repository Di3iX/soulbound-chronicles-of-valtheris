// ─── SAVE / LOAD ──────────────────────────────────────────────────────────────
import type { Item } from './inventory';
import type { Equipment, EquipBonuses } from './equipment';
import type { LocationId, Enemy } from './combat';
interface Stats  { strength: number; agility: number; endurance: number; }

export interface SaveData {
  version:         number;
  playerLevel:     number;
  playerXp:        number;
  xpToNext:        number;
  playerGold:      number;
  playerBonusDmg:  number;
  levelHpBonus:    number;
  playerHp:        number;
  playerMaxHp:     number;
  stats:           Stats;
  statPoints:      number;
  inventory:       Item[];
  equipment:       Equipment;
  equipBonuses:    EquipBonuses;
  playerPos:       { x: number; y: number };
  currentLocation: LocationId;
  enemies:         Enemy[];
}

const SAVE_KEY     = 'dungeon_rpg_v1';
const SAVE_VERSION = 2;   // bumped: LocationId set changed (village/forest/cave/ruins/swamp)

export function saveGame(data: Omit<SaveData, 'version'>): void {
  const payload: SaveData = { version: SAVE_VERSION, ...data };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    console.debug('[Save] Written — Lv.%d  XP %d  Gold %d', data.playerLevel, data.playerXp, data.playerGold);
  } catch (e) {
    console.warn('[Save] localStorage write failed:', e);
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) { console.debug('[Save] No save found in localStorage'); return null; }
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== SAVE_VERSION) {
      console.warn('[Save] Incompatible save version (%d), starting fresh', data.version);
      return null;
    }
    console.debug('[Save] Loaded — Lv.%d  XP %d  Gold %d', data.playerLevel, data.playerXp, data.playerGold);
    return data;
  } catch (e) {
    console.warn('[Save] Failed to parse save:', e);
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
