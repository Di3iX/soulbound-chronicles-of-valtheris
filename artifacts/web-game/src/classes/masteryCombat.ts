/**
 * Step 7 helpers — apply Constellation bonuses in combat.
 * Path: artifacts/web-game/src/classes/masteryCombat.ts  (or next to combat)
 */
import type { MasteryBonuses } from '../stats';
import { sumMasteryBonuses } from './masteryConstellation';
import type { PlayerMasteryState } from './playerClass';

export function masteryFromState(
  state: PlayerMasteryState | null | undefined,
): MasteryBonuses {
  if (!state) return {};
  return sumMasteryBonuses(state);
}

/** XP after skill-tree and mastery exploration. */
export function scaleXp(
  baseXp: number,
  skillXpBonusPct: number,
  mastery: MasteryBonuses,
): number {
  return Math.floor(
    baseXp
      * (1 + skillXpBonusPct / 100)
      * (1 + (mastery.xp_pct ?? 0) / 100),
  );
}

/** Gold after rarity mult and mastery trade. */
export function scaleGold(
  baseGold: number,
  mastery: MasteryBonuses,
): number {
  return Math.round(baseGold * (1 + (mastery.gold_pct ?? 0) / 100));
}

/** Lifesteal heal amount from damage dealt. */
export function lifestealHeal(dmg: number, mastery: MasteryBonuses): number {
  const pct = mastery.lifesteal_pct ?? 0;
  if (pct <= 0 || dmg <= 0) return 0;
  return Math.max(1, Math.floor((dmg * pct) / 100));
}
