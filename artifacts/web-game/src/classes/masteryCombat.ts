/**
 * Combat helpers: Constellation + class-talent reward scaling / lifesteal.
 * Path: artifacts/web-game/src/classes/masteryCombat.ts
 */
import type { MasteryBonuses } from '../stats';
import { sumMasteryBonuses } from './masteryConstellation';
import type { PlayerMasteryState } from './playerClass';
import type { ClassTalentBonuses } from './talentBonuses';

export function masteryFromState(
  state: PlayerMasteryState | null | undefined,
): MasteryBonuses {
  if (!state) return {};
  return sumMasteryBonuses(state);
}

/**
 * XP after skill-tree, mastery exploration, and class talent xp%.
 */
export function scaleXp(
  baseXp: number,
  skillXpBonusPct: number,
  mastery: MasteryBonuses,
  talentXpPct = 0,
): number {
  return Math.floor(
    baseXp
      * (1 + skillXpBonusPct / 100)
      * (1 + (mastery.xp_pct ?? 0) / 100)
      * (1 + talentXpPct / 100),
  );
}

/**
 * Gold after rarity mult, mastery trade, and class talent gold%.
 */
export function scaleGold(
  baseGold: number,
  mastery: MasteryBonuses,
  talentGoldPct = 0,
): number {
  return Math.round(
    baseGold
      * (1 + (mastery.gold_pct ?? 0) / 100)
      * (1 + talentGoldPct / 100),
  );
}

/** Lifesteal heal from mastery only (talent lifesteal added by caller). */
export function lifestealHeal(dmg: number, mastery: MasteryBonuses): number {
  const pct = mastery.lifesteal_pct ?? 0;
  if (pct <= 0 || dmg <= 0) return 0;
  return Math.max(1, Math.floor((dmg * pct) / 100));
}

/** Combined lifesteal: mastery + class talents. */
export function totalLifestealHeal(
  dmg: number,
  mastery: MasteryBonuses,
  talent: Pick<ClassTalentBonuses, 'lifestealPct'> | null | undefined,
): number {
  if (dmg <= 0) return 0;
  const pct = (mastery.lifesteal_pct ?? 0) + (talent?.lifestealPct ?? 0);
  if (pct <= 0) return 0;
  return Math.max(1, Math.floor((dmg * pct) / 100));
}
