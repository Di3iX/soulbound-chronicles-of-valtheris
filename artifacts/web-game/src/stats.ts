// ─── STATS MODULE (v0.1.4) ────────────────────────────────────────────────────
// Single source of truth for all character stat calculations.
// Combat, equipment, inventory, and all future systems must read from
// computeStats() — never compute derived stats inline.

import type { EquipBonuses } from './equipment';
import type { SkillBonuses }  from './skills/skillTree';

// ── Constants ────────────────────────────────────────────────────────────────
export const INITIAL_HP              = 100;
const        BASE_DMG_MIN            = 8;
const        BASE_DMG_MAX            = 16;
const        BASE_ATTACK_INTERVAL_MS = 1500;
const        MIN_ATTACK_INTERVAL_MS  = 500;

// ── Base (player-allocatable) stats ──────────────────────────────────────────
/** Stats the player distributes points into. */
export interface BaseStats {
  strength:     number;  // +2 dmg/pt · +0.5 defense/pt · +0.2% crit/pt
  agility:      number;  // −3% attack interval/pt · +0.5% dodge/pt
  vitality:     number;  // +10 max HP/pt
  intelligence: number;  // +0.5% total damage/pt
}

export const INITIAL_BASE_STATS: BaseStats = {
  strength:     5,
  agility:      5,
  vitality:     5,
  intelligence: 5,
};

// ── Fully-computed final stat values ─────────────────────────────────────────
export interface ComputedStats {
  // Effective totals (base + equipment)
  totalStrength:     number;
  totalAgility:      number;
  totalVitality:     number;
  totalIntelligence: number;

  // HP
  maxHp:         number;

  // Offense
  dmgMin:        number;
  dmgMax:        number;
  critChance:    number;    // 0–75 %
  critDamagePct: number;    // e.g. 175 → shown as "175%"
  critDamageMult: number;   // e.g. 1.75 — multiply hit damage by this on crit

  // Defense
  defense:       number;    // flat; applied as dmg × 100/(100+defense)
  dodgeChance:   number;    // 0–60 %

  // Speed
  attackInterval:    number; // ms
  attackIntervalSec: string; // formatted for display, e.g. "1.5"
}

// ── Input bundle passed to computeStats ──────────────────────────────────────
export interface StatsInput {
  base:         BaseStats;
  levelHpBonus: number;   // HP gained from level-ups
  bonusDmg:     number;   // flat damage gained from level-ups
  equip:        EquipBonuses;
  skills:       SkillBonuses;
}

// ── Internal helpers ─────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

// ── Core computation ─────────────────────────────────────────────────────────
/**
 * Derive all final character stats from base allocation + gear + skill tree.
 * Pure function — no side-effects, safe to call every render.
 */
export function computeStats(input: StatsInput): ComputedStats {
  const { base, levelHpBonus, bonusDmg, equip, skills } = input;

  // ── Effective totals ───────────────────────────────────────────────────────
  const totalStrength     = base.strength     + (equip.strength     ?? 0);
  const totalAgility      = base.agility      + (equip.agility      ?? 0);
  const totalVitality     = base.vitality     + (equip.vitality     ?? 0);
  const totalIntelligence = base.intelligence + (equip.intelligence ?? 0);

  // ── HP ────────────────────────────────────────────────────────────────────
  const maxHp = INITIAL_HP
    + levelHpBonus
    + totalVitality * 10
    + (equip.hp ?? 0)
    + skills.bonusHp;

  // ── Damage ────────────────────────────────────────────────────────────────
  const intBonus  = 1 + totalIntelligence * 0.005;  // +0.5% per INT
  const skillMult = 1 + skills.damagePct  / 100;
  const totalMult = intBonus * skillMult;
  const flatDmg   = bonusDmg + totalStrength * 2 + (equip.damage ?? 0);
  const dmgMin    = Math.floor((BASE_DMG_MIN + flatDmg) * totalMult);
  const dmgMax    = Math.floor((BASE_DMG_MAX + flatDmg) * totalMult);

  // ── Critical hit ──────────────────────────────────────────────────────────
  const critChance = clamp(
    5 + totalStrength * 0.2 + (equip.critChance ?? 0) + skills.critChancePct,
    0, 75,
  );
  const critDamagePct  = 150 + (equip.critDamage ?? 0);
  const critDamageMult = critDamagePct / 100;

  // ── Defense ───────────────────────────────────────────────────────────────
  const defense = Math.floor(totalStrength * 0.5 + (equip.defense ?? 0));

  // ── Dodge ─────────────────────────────────────────────────────────────────
  const dodgeChance = clamp(
    totalAgility * 0.5 + (equip.dodgeChance ?? 0),
    0, 60,
  );

  // ── Attack speed ──────────────────────────────────────────────────────────
  const baseInt    = Math.max(MIN_ATTACK_INTERVAL_MS, Math.floor(BASE_ATTACK_INTERVAL_MS * (1 - 0.03 * totalAgility)));
  const penalized  = Math.floor(baseInt * (1 + (equip.atkSpeedPenalty ?? 0) / 100));
  const attackInterval = Math.max(MIN_ATTACK_INTERVAL_MS, Math.floor(penalized * (1 - skills.attackSpeedPct / 100)));

  return {
    totalStrength, totalAgility, totalVitality, totalIntelligence,
    maxHp,
    dmgMin, dmgMax,
    critChance:    Math.round(critChance    * 10) / 10,
    critDamagePct,
    critDamageMult,
    defense,
    dodgeChance:   Math.round(dodgeChance  * 10) / 10,
    attackInterval,
    attackIntervalSec: (attackInterval / 1000).toFixed(1),
  };
}
