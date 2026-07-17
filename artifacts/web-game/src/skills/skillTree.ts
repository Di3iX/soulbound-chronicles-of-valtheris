// ─── SKILL TREE STATE & BONUSES ───────────────────────────────────────────────

/** Levels invested per skill. Key = skill id, value = current level (0 = not learned). */
export type SkillProgress = Record<string, number>;

/** Live combat/stat bonuses derived from SkillProgress. */
export interface SkillBonuses {
  damagePct:      number;   // % bonus damage       — Power Strike (+5%/lv)
  bonusHp:        number;   // flat max-HP bonus     — Iron Skin   (+10/lv)
  attackSpeedPct: number;   // % speed-up            — Quick Hands (+3%/lv)
  critChancePct:  number;   // % crit chance         — Precision   (+2%/lv) ← reserved
  bonusMana:      number;   // flat mana             — Arcane Know (+5/lv)  ← reserved
  xpBonusPct:     number;   // % XP bonus            — Wisdom      (+2%/lv)
}

export const ZERO_SKILL_BONUSES: SkillBonuses = {
  damagePct: 0, bonusHp: 0, attackSpeedPct: 0,
  critChancePct: 0, bonusMana: 0, xpBonusPct: 0,
};

/** Compute live bonuses from the player's current skill investment. */
export function calcSkillBonuses(progress: SkillProgress): SkillBonuses {
  const lv = (id: string) => progress[id] ?? 0;
  return {
    damagePct:      lv('power_strike')      * 5,
    bonusHp:        lv('iron_skin')         * 10,
    attackSpeedPct: lv('quick_hands')       * 3,
    critChancePct:  lv('precision')         * 2,
    bonusMana:      lv('arcane_knowledge')  * 5,
    xpBonusPct:     lv('wisdom')            * 2,
  };
}
