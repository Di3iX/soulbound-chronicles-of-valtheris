// ─── SAVE / LOAD ──────────────────────────────────────────────────────────────
// All types below are local to this module.
// Structural compatibility with the matching types in App.tsx is enforced by
// TypeScript's structural type system — no circular imports needed.

type LocationId = 'city' | 'forest' | 'cave' | 'fields' | 'graveyard';

type ItemType = 'weapon' | 'helmet' | 'armor' | 'gloves' | 'boots';
type Rarity   = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

interface ItemBonuses {
  damage?:          number;
  hp?:              number;
  strength?:        number;
  agility?:         number;
  atkSpeedPenalty?: number;
}

interface Item {
  id:      string;
  key:     string;
  name:    string;
  type:    ItemType;
  rarity:  Rarity;
  bonuses: ItemBonuses;
}

interface Equipment {
  weapon:  Item | null;
  helmet:  Item | null;
  armor:   Item | null;
  gloves:  Item | null;
  boots:   Item | null;
}

interface EquipBonuses {
  damage: number; hp: number; strength: number; agility: number; atkSpeedPenalty: number;
}

interface Stats {
  strength: number; agility: number; endurance: number;
}

interface Enemy {
  id: number; name: string; emoji: string;
  x: number; y: number;
  hp: number; maxHp: number;
  attackInterval: number; dmgMin: number; dmgMax: number;
  dead: boolean;
}

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
const SAVE_VERSION = 1;

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
