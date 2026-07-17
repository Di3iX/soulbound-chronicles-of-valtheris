// ─── SAVE / LOAD ──────────────────────────────────────────────────────────────
import type { Item } from './inventory';
import type { Equipment, EquipBonuses } from './equipment';
import type { LocationId, Enemy } from './combat';
import type { QuestProgress } from './quests/quests';
import type { SkillProgress } from './skills/skillTree';
import type { BossState } from './boss/boss';

/** v0.1.4: endurance renamed to vitality; intelligence added. */
interface Stats {
  strength:     number;
  agility:      number;
  vitality:     number;
  intelligence: number;
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
  /** Optional — missing in old saves; defaults to {} on load. */
  questProgress?:  QuestProgress;
  /** Optional — missing in old saves; defaults to {} on load. */
  skillProgress?:  SkillProgress;
  /** Optional — missing in old saves; defaults to 0 on load. */
  skillPoints?:    number;
  /** Optional — missing in old saves; defaults to INITIAL_BOSS_STATE on load. */
  bossState?:      BossState;
}

const SAVE_KEY     = 'dungeon_rpg_v1';
const SAVE_VERSION = 2;   // keep at 2; migrations handled inline

/** Zero-defaults for EquipBonuses — used during save migration. */
const ZERO_EB = {
  damage: 0, hp: 0, strength: 0, agility: 0, atkSpeedPenalty: 0,
  vitality: 0, intelligence: 0, defense: 0, critChance: 0, critDamage: 0, dodgeChance: 0,
};

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

    // ── Forward-compatible stat migration ─────────────────────────────────────
    const rawStats = data.stats as unknown as Record<string, number>;
    // endurance → vitality (pre-v0.1.4 saves)
    if ('endurance' in rawStats && !('vitality' in rawStats)) {
      rawStats['vitality'] = rawStats['endurance'];
      delete rawStats['endurance'];
    }
    if (!('intelligence' in rawStats)) rawStats['intelligence'] = 5;

    // ── EquipBonuses: fill any missing v0.1.4 fields ──────────────────────────
    data.equipBonuses = { ...ZERO_EB, ...(data.equipBonuses as unknown as Record<string, number>) } as EquipBonuses;

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
