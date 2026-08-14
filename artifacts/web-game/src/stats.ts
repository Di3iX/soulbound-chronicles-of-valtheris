// ─── STATS MODULE ─────────────────────────────────────────────────────────────
// Single source of truth for character stat calculations.
// Includes optional Mastery Constellation bonuses.

import type { EquipBonuses } from './equipment';
import type { SkillBonuses } from './skills/skillTree';

export const INITIAL_HP = 100;
export const INITIAL_MP = 50;
const BASE_DMG_MIN = 8;
const BASE_DMG_MAX = 16;
const BASE_ATTACK_INTERVAL_MS = 1500;
const MIN_ATTACK_INTERVAL_MS = 500;

/** Stats the player distributes points into. */
export interface BaseStats {
  strength: number;
  agility: number;
  vitality: number;
  intelligence: number;
}

export const INITIAL_BASE_STATS: BaseStats = {
  strength: 5,
  agility: 5,
  vitality: 5,
  intelligence: 5,
};

/**
 * Flat bag from sumMasteryBonuses() (masteryConstellation.ts).
 * Keys: str, agi, int, vit, spi, lck, armor_pct, haste_pct, lifesteal_pct,
 * regen_pct, craft_success_pct, gold_pct, xp_pct, pet_pct, element_pct
 */
export type MasteryBonuses = Record<string, number>;

export interface ComputedStats {
  totalStrength: number;
  totalAgility: number;
  totalVitality: number;
  totalIntelligence: number;

  maxHp: number;
  maxMp: number;

  dmgMin: number;
  dmgMax: number;
  critChance: number;
  critDamagePct: number;
  critDamageMult: number;

  defense: number;
  dodgeChance: number;
  blockChance: number;
  fireResist: number;
  electricResist: number;
  iceResist: number;

  attackInterval: number;
  attackIntervalSec: string;

  /** From mastery — for combat / economy readers */
  lifestealPct: number;
  xpBonusPct: number;
  goldBonusPct: number;
  craftSuccessPct: number;
  elementBonusPct: number;
  hastePct: number;
}

export interface ClassTalentStatBonuses {
  damagePct?: number;
  armorPct?: number;
  maxHpPct?: number;
  critChancePct?: number;
  critDamagePct?: number;
  attackSpeedPct?: number;
  allStatsPct?: number;
}

export interface StatsInput {
  base: BaseStats;
  levelHpBonus: number;
  levelMpBonus: number;
  bonusDmg: number;
  equip: EquipBonuses;
  skills: SkillBonuses;
  /** Optional — if omitted, treated as {}. */
  mastery?: MasteryBonuses;
  /** Optional — from sumClassTalentBonuses(). */
  classTalent?: ClassTalentStatBonuses;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function m(bonuses: MasteryBonuses | undefined, key: string): number {
  return bonuses?.[key] ?? 0;
}

/**
 * Derive all final character stats from base + gear + skill tree + mastery.
 * Pure function — safe to call every render.
 */
export function computeStats(input: StatsInput): ComputedStats {
  const { base, levelHpBonus, levelMpBonus, bonusDmg, equip, skills } = input;
  const mastery = input.mastery ?? {};
  const ct = input.classTalent ?? {};
  const allPct = 1 + (ct.allStatsPct ?? 0) / 100;

  // Mastery primary stats (constellation nodes)
  const mStr = m(mastery, 'str');
  const mAgi = m(mastery, 'agi');
  const mInt = m(mastery, 'int');
  const mVit = m(mastery, 'vit');
  // spi / lck reserved for future BaseStats expansion
  const mArmorPct = m(mastery, 'armor_pct');
  const mHastePct = m(mastery, 'haste_pct');
  const mLifesteal = m(mastery, 'lifesteal_pct');
  const mXp = m(mastery, 'xp_pct');
  const mGold = m(mastery, 'gold_pct');
  const mCraft = m(mastery, 'craft_success_pct');
  const mElement = m(mastery, 'element_pct');

  const totalStrength = Math.floor((base.strength + (equip.strength ?? 0) + mStr) * allPct);
  const totalAgility = Math.floor((base.agility + (equip.agility ?? 0) + mAgi) * allPct);
  const totalVitality = Math.floor((base.vitality + (equip.vitality ?? 0) + mVit) * allPct);
  const totalIntelligence = Math.floor((base.intelligence + (equip.intelligence ?? 0) + mInt) * allPct);

  const maxHpBase =
    INITIAL_HP +
    levelHpBonus +
    totalVitality * 10 +
    (equip.hp ?? 0) +
    skills.bonusHp;
  const maxHp = Math.floor(maxHpBase * (1 + (ct.maxHpPct ?? 0) / 100));

  const maxMp =
    INITIAL_MP + levelMpBonus + (equip.mana ?? 0) + skills.bonusMana;

  const intBonus = 1 + totalIntelligence * 0.005;
  const skillMult = 1 + skills.damagePct / 100 + (ct.damagePct ?? 0) / 100;
  const totalMult = intBonus * skillMult;
  const flatDmg = bonusDmg + totalStrength * 2 + (equip.damage ?? 0);
  const dmgMin = Math.floor((BASE_DMG_MIN + flatDmg) * totalMult);
  const dmgMax = Math.floor((BASE_DMG_MAX + flatDmg) * totalMult);

  // Luck mastery lightly feeds crit
  const mLck = m(mastery, 'lck');
  const critChance = clamp(
    5 + totalStrength * 0.2 + mLck * 0.3 + (equip.critChance ?? 0) + skills.critChancePct + (ct.critChancePct ?? 0),
    0,
    75,
  );
  const critDamagePct = 150 + (equip.critDamage ?? 0) + (ct.critDamagePct ?? 0);
  const critDamageMult = critDamagePct / 100;

  const defenseBase = totalStrength * 0.5 + (equip.defense ?? 0);
  const defense = Math.floor(defenseBase * (1 + mArmorPct / 100) * (1 + (ct.armorPct ?? 0) / 100));

  const dodgeChance = clamp(totalAgility * 0.5 + (equip.dodgeChance ?? 0), 0, 60);

  const blockChance = clamp(5 + totalVitality * 0.3 + (equip.blockChance ?? 0), 0, 50);

  const fireResist = (equip.fireResist ?? 0) + mElement * 0.5;
  const electricResist = (equip.electricResist ?? 0) + mElement * 0.5;
  const iceResist = (equip.iceResist ?? 0) + mElement * 0.5;

  const baseInt = Math.max(
    MIN_ATTACK_INTERVAL_MS,
    Math.floor(BASE_ATTACK_INTERVAL_MS * (1 - 0.03 * totalAgility)),
  );
  const penalized = Math.floor(baseInt * (1 + (equip.atkSpeedPenalty ?? 0) / 100));
  const afterSkills = Math.floor(penalized * (1 - skills.attackSpeedPct / 100));
  const attackInterval = Math.max(
    MIN_ATTACK_INTERVAL_MS,
    Math.floor(afterSkills * (1 - mHastePct / 100) * (1 - (ct.attackSpeedPct ?? 0) / 100)),
  );

  return {
    totalStrength,
    totalAgility,
    totalVitality,
    totalIntelligence,
    maxHp,
    maxMp,
    dmgMin,
    dmgMax,
    critChance: Math.round(critChance * 10) / 10,
    critDamagePct,
    critDamageMult,
    defense,
    dodgeChance: Math.round(dodgeChance * 10) / 10,
    blockChance: Math.round(blockChance * 10) / 10,
    fireResist,
    electricResist,
    iceResist,
    attackInterval,
    attackIntervalSec: (attackInterval / 1000).toFixed(1),
    lifestealPct: mLifesteal,
    xpBonusPct: mXp,
    goldBonusPct: mGold,
    craftSuccessPct: mCraft,
    elementBonusPct: mElement,
    hastePct: mHastePct,
  };
}
