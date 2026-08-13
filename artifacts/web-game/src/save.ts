// ─── SAVE / LOAD ──────────────────────────────────────────────────────────────
import type { Item } from './inventory';
import type { Equipment, EquipBonuses } from './equipment';
import { EMPTY_EQUIPMENT } from './equipment';
import type { LocationId, Enemy } from './combat';
import type { ExploredTiles } from './world/locations';
import type { QuestProgress } from './quests/quests';
import type { SkillProgress } from './skills/skillTree';
import type { BossState } from './boss/boss';
import type { OpenedChests } from './world/chests';
import type { PlayerClassState, PlayerMasteryState } from './classes/playerClass';
import type { ClassResourceState } from './classes/classResource';
import type { LegendaryState } from './classes/legendaryTalents';

/** v0.1.4: endurance renamed to vitality; intelligence added. */
interface Stats {
  strength: number;
  agility: number;
  vitality: number;
  intelligence: number;
}

export interface SaveData {
  version: number;
  playerLevel: number;
  playerXp: number;
  xpToNext: number;
  playerGold: number;
  playerBonusDmg: number;
  levelHpBonus: number;
  playerHp: number;
  playerMaxHp: number;
  playerMp?: number;
  playerMaxMp?: number;
  levelMpBonus?: number;
  stats: Stats;
  statPoints: number;
  inventory: Item[];
  equipment: Equipment;
  equipBonuses: EquipBonuses;
  playerPos: { x: number; y: number };
  currentLocation: LocationId;
  enemies: Enemy[];
  questProgress?: QuestProgress;
  skillProgress?: SkillProgress;
  skillPoints?: number;
  bossState?: BossState;
  exploredTiles?: ExploredTiles;
  openedChests?: OpenedChests;
  unlockedRecipes?: string[];
  classState?: PlayerClassState | null;
  masteryState?: PlayerMasteryState;
  /** Class combat resource (rage/focus/mana/faith…). */
  classResource?: ClassResourceState;
  /** Legendary talent cooldowns / active buff. */
  legendaryState?: LegendaryState;
}

const SAVE_KEY = 'dungeon_rpg_v1';
/** Bump when adding required fields; optional fields migrate in place. */
const SAVE_VERSION = 2;

const ZERO_EB = {
  damage: 0, hp: 0, strength: 0, agility: 0, atkSpeedPenalty: 0,
  vitality: 0, intelligence: 0, defense: 0, critChance: 0, critDamage: 0,
  dodgeChance: 0, blockChance: 0, mana: 0,
  fireResist: 0, electricResist: 0, iceResist: 0,
};

export function saveGame(data: Omit<SaveData, 'version'>): void {
  const payload: SaveData = { version: SAVE_VERSION, ...data };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    console.debug(
      '[Save] Written — Lv.%d  XP %d  Gold %d',
      data.playerLevel, data.playerXp, data.playerGold,
    );
  } catch (e) {
    console.warn('[Save] localStorage write failed:', e);
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      console.debug('[Save] No save found in localStorage');
      return null;
    }
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== SAVE_VERSION) {
      console.warn('[Save] Incompatible save version (%d), starting fresh', data.version);
      return null;
    }

    const rawStats = data.stats as unknown as Record<string, number>;
    if ('endurance' in rawStats && !('vitality' in rawStats)) {
      rawStats['vitality'] = rawStats['endurance'];
      delete rawStats['endurance'];
    }
    if (!('intelligence' in rawStats)) rawStats['intelligence'] = 5;

    data.equipBonuses = {
      ...ZERO_EB,
      ...(data.equipBonuses as unknown as Record<string, number>),
    } as EquipBonuses;

    data.equipment = {
      ...EMPTY_EQUIPMENT,
      ...(data.equipment as unknown as Record<string, Item | null>),
    } as Equipment;

    console.debug(
      '[Save] Loaded — Lv.%d  XP %d  Gold %d',
      data.playerLevel, data.playerXp, data.playerGold,
    );
    return data;
  } catch (e) {
    console.warn('[Save] Failed to parse save:', e);
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
