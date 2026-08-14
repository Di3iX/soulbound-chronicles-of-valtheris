/**
 * Step 9 — Legendary talents: unlock + activate with long cooldown.
 * Path: artifacts/web-game/src/classes/legendaryTalents.ts
 */
import { ALL_PATHS } from './classSystem';
import type { PlayerClassState } from './playerClass';
import { currentPathId } from './playerClass';

export interface LegendaryDef {
  id: string;
  name: string;
  description: string;
  /** Cooldown in seconds after activation. */
  cooldownSec: number;
  /** Min level to unlock (default 20 for profession path, 1 for archetype). */
  minLevel: number;
  /**
   * Combat effect tags interpreted by useCombat / App.
   * Keep data-driven; handlers switch on `effect`.
   */
  effect:
    | { kind: 'cc_immunity_and_damage'; durationSec: number; damagePct: number }
    | { kind: 'free_skills'; durationSec: number }
    | { kind: 'absolute_block'; durationSec: number }
    | { kind: 'reflect_on_parry'; reflectPct: number }
    | { kind: 'guaranteed_crits'; count: number }
    | { kind: 'ambush_crit_silence'; silenceSec: number }
    | { kind: 'pet_rebirth'; hpPct: number }
    | { kind: 'next_cast_free_instant' }
    | { kind: 'meteor_ground'; durationSec: number }
    | { kind: 'aoe_freeze'; durationSec: number; radiusHint: string }
    | { kind: 'bubble_on_ally' }
    | { kind: 'full_heal_immune'; durationSec: number }
    | { kind: 'raid_heal_pct'; hpPct: number }
    | { kind: 'bubble_clear_cc' }
    | { kind: 'extra_totems'; count: number }
    | { kind: 'generic_buff'; durationSec: number; label: string };
}

export interface LegendaryState {
  /** legendary id → unix ms when cooldown ends */
  cooldownUntil: Record<string, number>;
  /** Currently active buff (one at a time for simplicity). */
  active?: {
    id: string;
    endsAt: number;
    effect: LegendaryDef['effect'];
  };
}

export function createLegendaryState(): LegendaryState {
  return { cooldownUntil: {} };
}

/** Resolve def for current path (profession > archetype). */
export function legendaryForPath(classState: PlayerClassState | null): LegendaryDef | null {
  if (!classState) return null;
  const path = ALL_PATHS[currentPathId(classState)];
  if (!path?.legendaryTalent) return null;
  const raw = path.legendaryTalent;
  return enrichLegendary(raw.id, raw.name, raw.description, classState);
}

/** Map known ids to structured effects; fallback generic buff. */
function enrichLegendary(
  id: string,
  name: string,
  description: string,
  classState: PlayerClassState,
): LegendaryDef {
  const minLevel = classState.profession ? 20 : 15;
  const table: Record<string, Partial<LegendaryDef>> = {
    war_legend: {
      cooldownSec: 180,
      effect: { kind: 'cc_immunity_and_damage', durationSec: 8, damagePct: 20 },
    },
    ber_legend: {
      cooldownSec: 0, // once per fight — handled as long CD
      effect: { kind: 'free_skills', durationSec: 5 },
    },
    gua_legend: {
      cooldownSec: 120,
      effect: { kind: 'absolute_block', durationSec: 3 },
    },
    due_legend: {
      cooldownSec: 60,
      effect: { kind: 'reflect_on_parry', reflectPct: 50 },
    },
    rng_legend: {
      cooldownSec: 120,
      effect: { kind: 'guaranteed_crits', count: 3 },
    },
    arc_legend: {
      cooldownSec: 180,
      effect: { kind: 'guaranteed_crits', count: 1 },
    },
    asn_legend: {
      cooldownSec: 90,
      effect: { kind: 'ambush_crit_silence', silenceSec: 1 },
    },
    hun_legend: {
      cooldownSec: 180,
      effect: { kind: 'pet_rebirth', hpPct: 50 },
    },
    mag_legend: {
      cooldownSec: 180,
      effect: { kind: 'next_cast_free_instant' },
    },
    pyr_legend: {
      cooldownSec: 180,
      effect: { kind: 'meteor_ground', durationSec: 6 },
    },
    cry_legend: {
      cooldownSec: 120,
      effect: { kind: 'aoe_freeze', durationSec: 2, radiusHint: 'near player' },
    },
    spb_legend: {
      cooldownSec: 90,
      effect: { kind: 'bubble_on_ally' },
    },
    aco_legend: {
      cooldownSec: 180,
      effect: { kind: 'full_heal_immune', durationSec: 1.5 },
    },
    pri_legend: {
      cooldownSec: 300,
      effect: { kind: 'raid_heal_pct', hpPct: 40 },
    },
    pal_legend: {
      cooldownSec: 120,
      effect: { kind: 'bubble_clear_cc' },
    },
    sha_legend: {
      cooldownSec: 60,
      effect: { kind: 'extra_totems', count: 3 },
    },
  };

  const extra = table[id] ?? {};
  return {
    id,
    name,
    description,
    minLevel: extra.minLevel ?? minLevel,
    cooldownSec: extra.cooldownSec ?? 180,
    effect: extra.effect ?? {
      kind: 'generic_buff',
      durationSec: 8,
      label: name,
    },
  };
}

export function isLegendaryUnlocked(
  def: LegendaryDef,
  level: number,
  classState: PlayerClassState,
): boolean {
  if (level < def.minLevel) return false;
  // Profession legendaries require profession chosen
  if (def.minLevel >= 20 && !classState.profession) return false;
  return true;
}

export function legendaryCooldownLeft(
  state: LegendaryState,
  id: string,
  now = Date.now(),
): number {
  const until = state.cooldownUntil[id] ?? 0;
  return Math.max(0, Math.ceil((until - now) / 1000));
}

export function canActivateLegendary(
  state: LegendaryState,
  def: LegendaryDef,
  level: number,
  classState: PlayerClassState,
  now = Date.now(),
): { ok: boolean; reason?: string } {
  if (!isLegendaryUnlocked(def, level, classState)) {
    return { ok: false, reason: `С ${def.minLevel} ур.` };
  }
  const left = legendaryCooldownLeft(state, def.id, now);
  if (left > 0) return { ok: false, reason: `КД ${left}с` };
  if (state.active && state.active.endsAt > now) {
    return { ok: false, reason: 'Уже активен' };
  }
  return { ok: true };
}

export function activateLegendary(
  state: LegendaryState,
  def: LegendaryDef,
  now = Date.now(),
): LegendaryState {
  const durationMs =
    'durationSec' in def.effect
      ? def.effect.durationSec * 1000
      : def.effect.kind === 'guaranteed_crits'
        ? 30_000
        : def.effect.kind === 'next_cast_free_instant'
          ? 15_000
          : 8_000;

  const cd = Math.max(def.cooldownSec, 30) * 1000;

  return {
    cooldownUntil: {
      ...state.cooldownUntil,
      [def.id]: now + cd,
    },
    active: {
      id: def.id,
      endsAt: now + durationMs,
      effect: def.effect,
    },
  };
}

/** Clear expired active buff. */
export function tickLegendary(state: LegendaryState, now = Date.now()): LegendaryState {
  if (state.active && state.active.endsAt <= now) {
    return { ...state, active: undefined };
  }
  return state;
}

/** Combat queries */
export function hasCcImmunity(state: LegendaryState, now = Date.now()): boolean {
  const a = state.active;
  if (!a || a.endsAt <= now) return false;
  return a.effect.kind === 'cc_immunity_and_damage';
}

export function legendaryDamageBonusPct(state: LegendaryState, now = Date.now()): number {
  const a = state.active;
  if (!a || a.endsAt <= now) return 0;
  if (a.effect.kind === 'cc_immunity_and_damage') return a.effect.damagePct;
  return 0;
}

export function hasAbsoluteBlock(state: LegendaryState, now = Date.now()): boolean {
  const a = state.active;
  if (!a || a.endsAt <= now) return false;
  return a.effect.kind === 'absolute_block';
}

export function hasFreeSkills(state: LegendaryState, now = Date.now()): boolean {
  const a = state.active;
  if (!a || a.endsAt <= now) return false;
  return a.effect.kind === 'free_skills' || a.effect.kind === 'next_cast_free_instant';
}

export function consumeGuaranteedCrit(state: LegendaryState, now = Date.now()): {
  state: LegendaryState;
  crit: boolean;
} {
  const a = state.active;
  if (!a || a.endsAt <= now || a.effect.kind !== 'guaranteed_crits') {
    return { state, crit: false };
  }
  const left = a.effect.count - 1;
  if (left <= 0) {
    return { state: { ...state, active: undefined }, crit: true };
  }
  return {
    state: {
      ...state,
      active: {
        ...a,
        effect: { kind: 'guaranteed_crits', count: left },
      },
    },
    crit: true,
  };
}

/** Instant effects when player presses ★ (heal / clear CC). Combat ticks still handle timed buffs. */
export interface LegendaryInstantResult {
  healToFull?: boolean;
  healPct?: number;
  clearCc?: boolean;
  log: string[];
}

export function applyLegendaryInstantEffects(def: LegendaryDef): LegendaryInstantResult {
  const log: string[] = [];
  const r: LegendaryInstantResult = { log };
  switch (def.effect.kind) {
    case 'full_heal_immune':
      r.healToFull = true;
      log.push(`★ ${def.name}: полное исцеление!`);
      break;
    case 'raid_heal_pct':
      r.healPct = def.effect.hpPct;
      log.push(`★ ${def.name}: исцеление на ${def.effect.hpPct}%!`);
      break;
    case 'bubble_clear_cc':
      r.clearCc = true;
      log.push(`★ ${def.name}: щит и сброс контроля!`);
      break;
    case 'bubble_on_ally':
      r.clearCc = true;
      r.healPct = 15;
      log.push(`★ ${def.name}: защита!`);
      break;
    default:
      log.push(`★ ${def.name}!`);
  }
  return r;
}

export function hasFullHealImmune(state: LegendaryState, now = Date.now()): boolean {
  const a = state.active;
  if (!a || a.endsAt <= now) return false;
  return a.effect.kind === 'full_heal_immune';
}
