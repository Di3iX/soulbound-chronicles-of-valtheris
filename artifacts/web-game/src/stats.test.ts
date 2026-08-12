import { describe, it, expect } from 'vitest';
import { computeStats, INITIAL_BASE_STATS, INITIAL_HP, INITIAL_MP, type StatsInput } from './stats';
import { ZERO_EQUIP_BONUSES } from './equipment';
import { ZERO_SKILL_BONUSES } from './skills/skillTree';

function baseInput(overrides: Partial<StatsInput> = {}): StatsInput {
  return {
    base: INITIAL_BASE_STATS,
    levelHpBonus: 0,
    levelMpBonus: 0,
    bonusDmg: 0,
    equip: ZERO_EQUIP_BONUSES,
    skills: ZERO_SKILL_BONUSES,
    ...overrides,
  };
}

describe('computeStats — a fresh level-1 character (no gear, no skills, no level-ups)', () => {
  const s = computeStats(baseInput());

  it('starts at the documented base HP/MP', () => {
    // INITIAL_HP + 0 levelBonus + vitality(5)*10 + 0 equip + 0 skills
    expect(s.maxHp).toBe(INITIAL_HP + INITIAL_BASE_STATS.vitality * 10);
    expect(s.maxMp).toBe(INITIAL_MP);
  });

  it('totals equal base stats with zero gear', () => {
    expect(s.totalStrength).toBe(INITIAL_BASE_STATS.strength);
    expect(s.totalAgility).toBe(INITIAL_BASE_STATS.agility);
    expect(s.totalVitality).toBe(INITIAL_BASE_STATS.vitality);
    expect(s.totalIntelligence).toBe(INITIAL_BASE_STATS.intelligence);
  });

  it('crit/dodge/block sit within their documented 0–max clamps', () => {
    expect(s.critChance).toBeGreaterThanOrEqual(0);
    expect(s.critChance).toBeLessThanOrEqual(75);
    expect(s.dodgeChance).toBeGreaterThanOrEqual(0);
    expect(s.dodgeChance).toBeLessThanOrEqual(60);
    expect(s.blockChance).toBeGreaterThanOrEqual(0);
    expect(s.blockChance).toBeLessThanOrEqual(50);
  });

  it('attack interval never drops below the 500ms floor', () => {
    expect(s.attackInterval).toBeGreaterThanOrEqual(500);
  });
});

describe('computeStats — stat scaling (regression guard for the balance formulas)', () => {
  it('vitality adds exactly +10 max HP per point', () => {
    const s1 = computeStats(baseInput({ base: { ...INITIAL_BASE_STATS, vitality: 5 } }));
    const s2 = computeStats(baseInput({ base: { ...INITIAL_BASE_STATS, vitality: 15 } }));
    expect(s2.maxHp - s1.maxHp).toBe((15 - 5) * 10);
  });

  it('agility clamps attack interval at the 500ms floor once high enough', () => {
    const s = computeStats(baseInput({ base: { ...INITIAL_BASE_STATS, agility: 100 } }));
    expect(s.attackInterval).toBe(500);
  });

  it('more strength never decreases min/max damage', () => {
    const low  = computeStats(baseInput({ base: { ...INITIAL_BASE_STATS, strength: 5 } }));
    const high = computeStats(baseInput({ base: { ...INITIAL_BASE_STATS, strength: 50 } }));
    expect(high.dmgMin).toBeGreaterThanOrEqual(low.dmgMin);
    expect(high.dmgMax).toBeGreaterThanOrEqual(low.dmgMax);
  });

  it('dmgMax is never below dmgMin', () => {
    for (const strength of [0, 5, 20, 100]) {
      const s = computeStats(baseInput({ base: { ...INITIAL_BASE_STATS, strength } }));
      expect(s.dmgMax).toBeGreaterThanOrEqual(s.dmgMin);
    }
  });
});

describe('computeStats — equipment and skill bonuses feed through', () => {
  it('equip.hp and skills.bonusHp add directly to maxHp', () => {
    const s = computeStats(baseInput({
      equip: { ...ZERO_EQUIP_BONUSES, hp: 40 },
      skills: { ...ZERO_SKILL_BONUSES, bonusHp: 25 },
    }));
    const baseline = computeStats(baseInput()).maxHp;
    expect(s.maxHp).toBe(baseline + 40 + 25);
  });

  it('cursed gear (negative resistances) is not clamped — can go negative', () => {
    const s = computeStats(baseInput({ equip: { ...ZERO_EQUIP_BONUSES, fireResist: -20 } }));
    expect(s.fireResist).toBe(-20);
  });

  it('level-up flat damage bonus increases both dmgMin and dmgMax', () => {
    const s0 = computeStats(baseInput({ bonusDmg: 0 }));
    const s1 = computeStats(baseInput({ bonusDmg: 20 }));
    expect(s1.dmgMin).toBeGreaterThan(s0.dmgMin);
    expect(s1.dmgMax).toBeGreaterThan(s0.dmgMax);
  });
});
