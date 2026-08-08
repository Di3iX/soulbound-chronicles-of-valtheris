/**
 * Player class progression state — save-friendly.
 * Step 1: pick archetype → base stats + starting skills.
 */
import {
  type ArchetypeId,
  type ProfessionId,
  type SpecializationId,
  type PlayerClassState,
  type StatBlock,
  type TalentNode,
  ALL_PATHS,
  ARCHETYPE_PROFESSIONS,
  PROFESSION_SPECS,
} from './classSystem';
import {
  type PlayerMasteryState,
  createEmptyMastery,
  pointsPerLevel,
} from './masteryConstellation';

export type { PlayerClassState, PlayerMasteryState };

export const ARCHETYPE_LIST: ArchetypeId[] = ['warrior', 'ranger', 'mage', 'acolyte'];

export function createClassState(archetype: ArchetypeId): PlayerClassState {
  return {
    archetype,
    profession: undefined,
    specialization: undefined,
    classPoints: 1, // level 1 grant
    spentClassTalents: {},
  };
}

export function createMasteryState(): PlayerMasteryState {
  const m = createEmptyMastery();
  m.points = 1; // level 1 grant
  return m;
}

/** Base stats for archetype at level 1 (before growth). */
export function archetypeBaseStats(archetype: ArchetypeId): StatBlock {
  return { ...ALL_PATHS[archetype].baseStats };
}

/**
 * Stats at a given level on current path.
 * growth applied for (level - 1) times from archetype growth
 * (profession growth can be blended later).
 */
export function statsAtLevel(
  state: PlayerClassState,
  level: number,
): StatBlock {
  const arch = ALL_PATHS[state.archetype];
  const path = state.specialization
    ? ALL_PATHS[state.specialization]
    : state.profession
      ? ALL_PATHS[state.profession]
      : arch;
  const base = { ...arch.baseStats };
  const growth = path.growth;
  const n = Math.max(0, level - 1);
  return {
    str: base.str + growth.str * n,
    agi: base.agi + growth.agi * n,
    int: base.int + growth.int * n,
    spi: base.spi + growth.spi * n,
    vit: base.vit + growth.vit * n,
    lck: base.lck + growth.lck * n,
  };
}

/** Call on every level-up (may gain multiple levels). */
export function grantClassAndMasteryPoints(
  classState: PlayerClassState,
  masteryState: PlayerMasteryState,
  levelsGained: number,
): { classState: PlayerClassState; masteryState: PlayerMasteryState; logs: string[] } {
  if (levelsGained <= 0) {
    return { classState, masteryState, logs: [] };
  }
  const { classPoints, masteryPoints } = pointsPerLevel();
  const logs: string[] = [];
  const cp = classPoints * levelsGained;
  const mp = masteryPoints * levelsGained;
  logs.push(`⭐ +${cp} очко класса`);
  logs.push(`🌌 +${mp} очко мастерства`);
  return {
    classState: {
      ...classState,
      classPoints: classState.classPoints + cp,
    },
    masteryState: {
      ...masteryState,
      points: masteryState.points + mp,
    },
    logs,
  };
}

export function currentPathId(state: PlayerClassState): string {
  return state.specialization ?? state.profession ?? state.archetype;
}

export function currentPathName(state: PlayerClassState): string {
  return ALL_PATHS[currentPathId(state)]?.name ?? '—';
}

export function availableProfessions(state: PlayerClassState): ProfessionId[] {
  return ARCHETYPE_PROFESSIONS[state.archetype] ?? [];
}

export function availableSpecializations(state: PlayerClassState): SpecializationId[] {
  if (!state.profession) return [];
  return PROFESSION_SPECS[state.profession] ?? [];
}

/** Unlock profession after trial (level >= 20). */
export function chooseProfession(
  state: PlayerClassState,
  profession: ProfessionId,
  level: number,
): { state: PlayerClassState; error?: string } {
  if (level < 20) return { state, error: 'Нужен 20 уровень' };
  if (state.profession) return { state, error: 'Профессия уже выбрана' };
  const allowed = ARCHETYPE_PROFESSIONS[state.archetype];
  if (!allowed.includes(profession)) return { state, error: 'Недоступная профессия' };
  return {
    state: { ...state, profession, classPoints: state.classPoints + 2 }, // bonus for trial
  };
}

/** Unlock specialization after trial (level >= 40). */
export function chooseSpecialization(
  state: PlayerClassState,
  spec: SpecializationId,
  level: number,
): { state: PlayerClassState; error?: string } {
  if (level < 40) return { state, error: 'Нужен 40 уровень' };
  if (!state.profession) return { state, error: 'Сначала профессия' };
  if (state.specialization) return { state, error: 'Специализация уже выбрана' };
  const allowed = PROFESSION_SPECS[state.profession];
  if (!allowed.includes(spec)) return { state, error: 'Недоступная специализация' };
  return {
    state: { ...state, specialization: spec, classPoints: state.classPoints + 3 },
  };
}

/** Skills unlocked for current path at level. */
export function unlockedSkills(state: PlayerClassState, level: number) {
  const path = ALL_PATHS[currentPathId(state)];
  if (!path) return [];
  // Also include archetype skills if on profession
  const skills = [...path.skills];
  if (state.profession && path.id !== state.archetype) {
    const arch = ALL_PATHS[state.archetype];
    for (const s of arch.skills) {
      if (!skills.some(x => x.id === s.id)) skills.push(s);
    }
  }
  return skills.filter(s => s.unlockLevel <= level);
}

export function displayNameForArchetype(id: ArchetypeId): string {
  return ALL_PATHS[id]?.name ?? id;
}


// ── Class talent spending ────────────────────────────────────────────────────


export function currentTalentTree(state: PlayerClassState): TalentNode[] {
  return ALL_PATHS[currentPathId(state)]?.talents ?? [];
}

export function canSpendClassTalent(
  state: PlayerClassState,
  talentId: string,
): { ok: boolean; reason?: string; node?: TalentNode } {
  const tree = currentTalentTree(state);
  const node = tree.find(n => n.id === talentId);
  if (!node) return { ok: false, reason: 'Нет такого таланта' };
  const rank = state.spentClassTalents[talentId] ?? 0;
  if (rank >= node.maxRank) return { ok: false, reason: 'Макс. ранг', node };
  if (state.classPoints < node.costPerRank) {
    return { ok: false, reason: 'Нет очков класса', node };
  }
  if (node.requires?.length) {
    for (const req of node.requires) {
      if ((state.spentClassTalents[req] ?? 0) < 1) {
        return { ok: false, reason: 'Нужен предыдущий талант', node };
      }
    }
  }
  return { ok: true, node };
}

export function spendClassTalent(
  state: PlayerClassState,
  talentId: string,
): PlayerClassState {
  const check = canSpendClassTalent(state, talentId);
  if (!check.ok || !check.node) return state;
  const cost = check.node.costPerRank;
  return {
    ...state,
    classPoints: state.classPoints - cost,
    spentClassTalents: {
      ...state.spentClassTalents,
      [talentId]: (state.spentClassTalents[talentId] ?? 0) + 1,
    },
  };
}

/** Simple aggregate labels for UI (effects are descriptive strings). */
export function spentTalentSummary(state: PlayerClassState): string[] {
  const tree = currentTalentTree(state);
  const lines: string[] = [];
  for (const n of tree) {
    const r = state.spentClassTalents[n.id] ?? 0;
    if (r > 0) lines.push(`${n.name} ${r}/${n.maxRank}`);
  }
  return lines;
}
