/**
 * Step 8 — Class combat resources (rage / focus / mana / faith / essence / stamina).
 * Path: artifacts/web-game/src/classes/classResource.ts
 */
import type { ArchetypeId, ProfessionId, ResourceType } from './classSystem';
import { ALL_PATHS } from './classSystem';
import type { PlayerClassState } from './playerClass';
import { currentPathId } from './playerClass';
import {
  RESOURCE_MAX_BASE, RESOURCE_MAX_PER_LEVEL,
  REGEN_COMBAT, RAGE_ON_HIT, RAGE_ON_DAMAGED, RAGE_DECAY_OOC,
} from './balance';

export interface ClassResourceState {
  type: ResourceType;
  name: string;
  current: number;
  max: number;
}

const MAX_DEFAULT = RESOURCE_MAX_BASE;

const RESOURCE_LABEL: Record<ResourceType, string> = {
  rage: 'Ярость',
  stamina: 'Выносливость',
  focus: 'Фокус',
  mana: 'Мана',
  faith: 'Вера',
  essence: 'Сущность',
};

/** Resource type for current class path. */
export function resourceTypeFor(classState: PlayerClassState | null): ResourceType {
  if (!classState) return 'mana';
  const path = ALL_PATHS[currentPathId(classState)];
  return path?.resource ?? 'mana';
}

export function resourceName(type: ResourceType): string {
  return RESOURCE_LABEL[type] ?? type;
}

export function createResourceState(
  classState: PlayerClassState | null,
  max = MAX_DEFAULT,
): ClassResourceState {
  const type = resourceTypeFor(classState);
  // Mana / faith / focus / essence start full; rage / stamina start empty.
  const startFull = type === 'mana' || type === 'faith' || type === 'focus' || type === 'essence';
  return {
    type,
    name: resourceName(type),
    current: startFull ? max : 0,
    max,
  };
}

/** When player changes archetype/profession — reset pool to new type. */
export function resetResourceForPath(
  classState: PlayerClassState,
  prev?: ClassResourceState,
): ClassResourceState {
  const next = createResourceState(classState, prev?.max ?? MAX_DEFAULT);
  return next;
}

export function clampResource(r: ClassResourceState): ClassResourceState {
  return {
    ...r,
    current: Math.max(0, Math.min(r.max, Math.floor(r.current))),
  };
}

export function canSpend(r: ClassResourceState, cost: number): boolean {
  if (cost <= 0) return true;
  return r.current >= cost;
}

export function spendResource(r: ClassResourceState, cost: number): ClassResourceState {
  if (cost <= 0) return r;
  return clampResource({ ...r, current: r.current - cost });
}

export function gainResource(r: ClassResourceState, amount: number): ClassResourceState {
  if (amount <= 0) return r;
  return clampResource({ ...r, current: r.current + amount });
}

/** Passive regen per second while in combat (and optionally out). */
export function regenPerSecond(type: ResourceType): number {
  return REGEN_COMBAT[type] ?? 0;
}

/** Rage gain on dealing a hit. */
export function rageOnHit(): number {
  return RAGE_ON_HIT;
}

/** Rage gain when taking damage. */
export function rageOnDamaged(): number {
  return RAGE_ON_DAMAGED;
}

/**
 * Tick resource once per second.
 * @param inCombat — rage only decays when NOT generating from hits that second;
 *   simple model: always apply regenPerSecond (rage negative = decay).
 */
export function tickResource(
  r: ClassResourceState,
  inCombat: boolean,
): ClassResourceState {
  const per = regenPerSecond(r.type);
  if (per === 0) return r;
  // Rage: only decay when in combat (out of combat snap toward 0 faster)
  if (r.type === 'rage') {
    if (!inCombat) {
      return clampResource({ ...r, current: Math.max(0, r.current - RAGE_DECAY_OOC) });
    }
    // mild decay each second even in combat if not hitting
    return clampResource({ ...r, current: r.current + per });
  }
  if (!inCombat && (r.type === 'mana' || r.type === 'focus' || r.type === 'faith')) {
    // faster OOC regen
    return gainResource(r, per * 2);
  }
  return gainResource(r, per);
}

/** UI bar color hint. */
export function resourceBarColor(type: ResourceType): string {
  switch (type) {
    case 'rage':
      return '#ef4444';
    case 'focus':
      return '#22c55e';
    case 'mana':
      return '#38bdf8';
    case 'faith':
      return '#fbbf24';
    case 'essence':
      return '#a78bfa';
    case 'stamina':
      return '#f59e0b';
    default:
      return '#94a3b8';
  }
}

export function defaultMaxForLevel(level: number): number {
  return MAX_DEFAULT + Math.floor(Math.max(0, level - 1) * RESOURCE_MAX_PER_LEVEL);
}
