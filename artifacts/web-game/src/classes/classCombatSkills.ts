/**
 * Step 4: Bridge class skills → combat bar (same shape as combat SKILLS).
 */
export type DamageType = 'physical' | 'fire' | 'electric' | 'ice' | 'frost' | 'arcane' | 'holy' | 'nature' | 'shadow';
import {
  type ClassSkillDef,
  type StatBlock,
  damageFromSkill,
  ALL_PATHS,
} from './classSystem';
import {
  type PlayerClassState,
  unlockedSkills,
  currentPathId,
} from './playerClass';

/** Compatible with existing useSkill / ControlsPanel skill buttons. */
export interface CombatReadySkill {
  /** String id (class skill) — use as key in skillsCdRecord. */
  id: string;
  name: string;
  emoji: string;
  damage: number;
  healSelf: number;
  maxCd: number;
  /** Spent as MP for now (faith/rage/focus mapped to same pool until separate resources). */
  manaCost: number;
  damageType: DamageType;
  kind: 'active' | 'passive';
  description: string;
}

const TYPE_MAP: Record<string, DamageType> = {
  physical: 'physical',
  fire: 'fire',
  frost: 'frost',
  arcane: 'arcane',
  holy: 'holy',
  nature: 'nature',
  shadow: 'shadow',
  electric: 'electric',
};

function toDamageType(t?: string): DamageType {
  if (!t) return 'physical';
  return TYPE_MAP[t] ?? 'physical';
}

/**
 * Active class skills unlocked at level, with damage computed from stats.
 * Pass weaponDmg from equip if available.
 */
export function getCombatClassSkills(
  classState: PlayerClassState,
  level: number,
  stats: StatBlock,
  weaponDmg = 0,
): CombatReadySkill[] {
  const list = unlockedSkills(classState, level).filter(s => s.kind === 'active');
  return list.map(s => classSkillToCombat(s, stats, weaponDmg));
}

export function classSkillToCombat(
  s: ClassSkillDef,
  stats: StatBlock,
  weaponDmg = 0,
): CombatReadySkill {
  const damage = s.damage ? damageFromSkill(s, stats, weaponDmg) : 0;
  const healSelf = s.heal ? Math.floor(s.heal.base + s.heal.coeff * stats[s.heal.stat]) : 0;
  return {
    id: s.id,
    name: s.name,
    emoji: s.emoji,
    damage,
    healSelf,
    maxCd: Math.max(1, s.cooldownSec), // combat ticks often in "turns"/seconds already
    manaCost: s.cost,
    damageType: toDamageType(s.damage?.damageType),
    kind: s.kind,
    description: s.description,
  };
}

/** Fallback: old global SKILLS if no class chosen. */
export function skillsForBar(
  classState: PlayerClassState | null,
  level: number,
  stats: StatBlock,
  legacySkills: CombatReadySkill[],
  weaponDmg = 0,
): CombatReadySkill[] {
  if (!classState) return legacySkills;
  const classOnes = getCombatClassSkills(classState, level, stats, weaponDmg);
  return classOnes.length > 0 ? classOnes : legacySkills;
}

export function pathResourceLabel(classState: PlayerClassState): string {
  return ALL_PATHS[currentPathId(classState)]?.resourceName ?? 'Мана';
}
