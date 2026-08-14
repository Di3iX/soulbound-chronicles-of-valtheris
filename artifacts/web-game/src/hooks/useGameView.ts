// ─── GAME VIEW (derived, per-render values) ────────────────────────────────────
// Extracted from App.tsx: plain derivations with no side effects — computed
// fresh every render from state already owned by App.tsx. Not memoized here
// either, matching the original inline behavior exactly.
import type { Enemy, Phase, LocationId } from '../combat';
import { computeStats, type BaseStats, type ComputedStats } from '../stats';
import type { EquipBonuses } from '../equipment';
import type { Item } from '../inventory';
import { calcSkillBonuses, type SkillProgress } from '../skills/skillTree';
import { MAP_COLS, MAP_ROWS, VP_COLS, VP_ROWS, LOCATION_MAPS, LOCATION_NPCS, type NpcDef } from '../world/locations';
import type { PlayerMasteryState, PlayerClassState } from '../classes/playerClass';
import { sumMasteryBonuses } from '../classes/masteryConstellation';
import { sumClassTalentBonuses } from '../classes/talentBonuses';

const POTION_KEYS = ['healing_potion', 'greater_healing_potion', 'raw_meat'] as const;

export interface GameViewInput {
  activeEnemyId: number | null;
  enemies:       Enemy[];
  playerXp:      number;
  xpToNext:      number;
  inventory:     Item[];
  phase:         Phase;
  playerHp:      number;
  playerMaxHp:   number;
  stats:         BaseStats;
  levelHpBonus:  number;
  levelMpBonus:  number;
  playerBonusDmg: number;
  equipBonuses:  EquipBonuses;
  skillProgress: SkillProgress;
  masteryState:  PlayerMasteryState;
  classState:    PlayerClassState | null;
  playerPos:     { x: number; y: number };
  currentLocation: LocationId;
  transitioning: boolean;
}

export function useGameView(input: GameViewInput) {
  const {
    activeEnemyId, enemies, playerXp, xpToNext, inventory, phase, playerHp, playerMaxHp,
    stats, levelHpBonus, levelMpBonus, playerBonusDmg, equipBonuses, skillProgress, masteryState, classState,
    playerPos, currentLocation, transitioning,
  } = input;

  const activeEnemy   = activeEnemyId !== null ? enemies.find(e => e.id === activeEnemyId) ?? null : null;
  const livingEnemies = enemies.filter(e => !e.dead);
  const xpPct         = Math.min(100, Math.round((playerXp / xpToNext) * 100));

  const potionCount  = inventory.filter(i => (POTION_KEYS as readonly string[]).includes(i.key)).length;
  const canUsePotion = phase === 'combat' && potionCount > 0 && playerHp < playerMaxHp;

  // All derived character stats — single source of truth from stats.ts
  const skillBonuses = calcSkillBonuses(skillProgress);
  const cs: ComputedStats = computeStats({
    base: stats, levelHpBonus, levelMpBonus, bonusDmg: playerBonusDmg,
    equip: equipBonuses, skills: skillBonuses, mastery: sumMasteryBonuses(masteryState),
    classTalent: sumClassTalentBonuses(classState),
  });

  const camCol     = Math.max(0, Math.min(MAP_COLS - VP_COLS, playerPos.x - Math.floor(VP_COLS / 2)));
  const camRow     = Math.max(0, Math.min(MAP_ROWS - VP_ROWS, playerPos.y - Math.floor(VP_ROWS / 2)));
  const currentMap  = LOCATION_MAPS[currentLocation];
  const currentNpcs = LOCATION_NPCS[currentLocation] ?? [];

  // Adjacent NPC — shows the Interact button when the player is 1 tile away
  const nearbyNpc: NpcDef | null = (phase === 'explore' && !transitioning)
    ? currentNpcs.find(n =>
        Math.abs(n.x - playerPos.x) <= 1 &&
        Math.abs(n.y - playerPos.y) <= 1 &&
        !(n.x === playerPos.x && n.y === playerPos.y),
      ) ?? null
    : null;

  return {
    activeEnemy, livingEnemies, xpPct, potionCount, canUsePotion, cs,
    camCol, camRow, currentMap, currentNpcs, nearbyNpc,
  };
}
