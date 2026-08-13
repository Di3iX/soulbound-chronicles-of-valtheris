/**
 * Step 10 — Tunable balance numbers for class resources & skills.
 * Path: artifacts/web-game/src/classes/balance.ts
 *
 * Change values here instead of hunting magic numbers in combat.
 */

/** Max resource at level 1; +RESOURCE_MAX_PER_LEVEL each level. */
export const RESOURCE_MAX_BASE = 100;
export const RESOURCE_MAX_PER_LEVEL = 2;

/** Regen per second in combat (see classResource.tickResource for OOC mult). */
export const REGEN_COMBAT: Record<string, number> = {
  mana: 5,
  focus: 6,
  faith: 4,
  essence: 4,
  stamina: 8,
  rage: -4, // decay per second if not generating
};

/** Rage generation */
export const RAGE_ON_HIT = 12;
export const RAGE_ON_DAMAGED = 15;
export const RAGE_DECAY_OOC = 12; // per second out of combat

/**
 * Suggested skill cost multipliers by resource (if you scale ClassSkillDef.cost).
 * cost_final = ceil(baseCost * mult)
 */
export const COST_MULT: Record<string, number> = {
  rage: 1.0,
  stamina: 1.0,
  focus: 1.0,
  mana: 1.0,
  faith: 1.0,
  essence: 1.0,
};

/** Legendary default floor cooldown (seconds). */
export const LEGENDARY_MIN_CD_SEC = 30;

/** Mastery power budget note: keep total mastery contribution ≤ ~25–30% at endgame. */
export const MASTERY_POWER_BUDGET_NOTE =
  'Constellation should not exceed ~25–30% of gear power at level cap.';

/** Soft caps for computed combat stats (mirrors stats.ts clamps). */
export const CAPS = {
  critChance: 75,
  dodgeChance: 60,
  blockChance: 50,
  minAttackIntervalMs: 500,
};
