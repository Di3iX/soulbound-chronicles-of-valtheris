/**
 * Step 11 — Convert spent class talents into numeric combat bonuses.
 * Path: artifacts/web-game/src/classes/talentBonuses.ts
 *
 * Talent `effect` strings in classSystem are free-form; we parse common patterns
 * and also match by talent id prefixes for reliable bonuses.
 */
import type { PlayerClassState } from './playerClass';
import { currentTalentTree } from './playerClass';

/** Bonuses merged into computeStats / combat. */
export interface ClassTalentBonuses {
  /** Flat primary-ish */
  damagePct: number;
  armorPct: number;
  maxHpPct: number;
  critChancePct: number;
  critDamagePct: number;
  attackSpeedPct: number;
  lifestealPct: number;
  threatPct: number;
  executePct: number; // bonus dmg vs targets under 30% HP
  allStatsPct: number;
  cooldownPct: number; // negative = faster CDs
  xpPct: number;
  goldPct: number;
  /** Free-form leftovers for UI/debug */
  notes: string[];
}

export function emptyTalentBonuses(): ClassTalentBonuses {
  return {
    damagePct: 0,
    armorPct: 0,
    maxHpPct: 0,
    critChancePct: 0,
    critDamagePct: 0,
    attackSpeedPct: 0,
    lifestealPct: 0,
    threatPct: 0,
    executePct: 0,
    allStatsPct: 0,
    cooldownPct: 0,
    xpPct: 0,
    goldPct: 0,
    notes: [],
  };
}

/** Parse "+N%" or "+N" from effect strings. */
function parseLeadingBonus(effect: string): number | null {
  const m = effect.match(/([+-]?\d+(?:\.\d+)?)\s*%?/);
  if (!m) return null;
  return Number(m[1]);
}

/**
 * Map a single talent rank into bonus buckets.
 * Uses effect text keywords (Russian + English from classSystem).
 */
function applyEffectText(
  effect: string,
  rank: number,
  out: ClassTalentBonuses,
): void {
  const e = effect.toLowerCase();
  const raw = parseLeadingBonus(effect);
  const v = (raw ?? 1) * rank;

  if (/weapon dmg|урона оруж|damage pct|\+.*dmg(?!.*crit)/i.test(effect) || /weapon dmg/i.test(e)) {
    out.damagePct += Math.abs(v);
    return;
  }
  if (/armor|брон/i.test(e)) {
    out.armorPct += Math.abs(v);
    return;
  }
  if (/lifesteal|вампир/i.test(e)) {
    out.lifestealPct += Math.abs(v);
    return;
  }
  if (/crit dmg|крит\.?\s*урон/i.test(e)) {
    out.critDamagePct += Math.abs(v);
    return;
  }
  if (/crit|крит/i.test(e)) {
    out.critChancePct += Math.abs(v);
    return;
  }
  if (/max hp|макс\.?\s*hp|hp\b/i.test(e) && !/on kill|зел/i.test(e)) {
    out.maxHpPct += Math.abs(v);
    return;
  }
  if (/attack speed|скорост.*атак|haste|as\b/i.test(e)) {
    out.attackSpeedPct += Math.abs(v);
    return;
  }
  if (/execute|добив|ниже 30|under 30/i.test(e)) {
    out.executePct += Math.abs(v);
    return;
  }
  if (/all stats|всем хар|ко всем/i.test(e)) {
    out.allStatsPct += Math.abs(v);
    return;
  }
  if (/cooldown|кд|cd\b/i.test(e)) {
    // negative in text means faster
    out.cooldownPct += raw !== null ? raw * rank : -v;
    return;
  }
  if (/threat|угроз/i.test(e)) {
    out.threatPct += Math.abs(v);
    return;
  }
  if (/xp|опыт/i.test(e)) {
    out.xpPct += Math.abs(v);
    return;
  }
  if (/gold|золот/i.test(e)) {
    out.goldPct += Math.abs(v);
    return;
  }

  out.notes.push(`${effect} ×${rank}`);
}

/**
 * Sum all spent ranks on the current path talent tree.
 */
export function sumClassTalentBonuses(classState: PlayerClassState | null): ClassTalentBonuses {
  const out = emptyTalentBonuses();
  if (!classState) return out;

  const tree = currentTalentTree(classState);
  for (const node of tree) {
    const rank = classState.spentClassTalents[node.id] ?? 0;
    if (rank <= 0) continue;
    applyEffectText(node.effect || node.description, rank, out);
  }

  // Soft clamp so talent tree alone cannot explode power
  out.damagePct = Math.min(out.damagePct, 40);
  out.armorPct = Math.min(out.armorPct, 35);
  out.maxHpPct = Math.min(out.maxHpPct, 30);
  out.critChancePct = Math.min(out.critChancePct, 20);
  out.critDamagePct = Math.min(out.critDamagePct, 40);
  out.attackSpeedPct = Math.min(out.attackSpeedPct, 25);
  out.lifestealPct = Math.min(out.lifestealPct, 15);
  out.executePct = Math.min(out.executePct, 40);
  out.allStatsPct = Math.min(out.allStatsPct, 15);

  return out;
}

/** Merge talent + mastery percentage bags for combat scaling. */
export function mergePctBonuses(
  talent: ClassTalentBonuses,
  mastery: Record<string, number>,
): {
  damagePct: number;
  xpPct: number;
  goldPct: number;
  lifestealPct: number;
  hastePct: number;
  armorPct: number;
} {
  return {
    damagePct: talent.damagePct,
    xpPct: talent.xpPct + (mastery.xp_pct ?? 0),
    goldPct: talent.goldPct + (mastery.gold_pct ?? 0),
    lifestealPct: talent.lifestealPct + (mastery.lifesteal_pct ?? 0),
    hastePct: talent.attackSpeedPct + (mastery.haste_pct ?? 0),
    armorPct: talent.armorPct + (mastery.armor_pct ?? 0),
  };
}
