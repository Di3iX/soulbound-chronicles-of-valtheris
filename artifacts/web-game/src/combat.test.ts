import { describe, it, expect } from 'vitest';
import {
  ENEMY_RARITY_DEFS, rollEnemyRarity, reviveEnemy, canRespawnEnemy, tickEnemyRespawns, RESPAWN_MS,
  addStatusEffect, tickStatusEffects, hasStatusEffect, slowMultiplier, STATUS_EFFECT_DEFS,
  applyResistance, effectChanceMultiplier,
  xpRequired, calcAttackInterval, applyXpGain,
  BASE_ATTACK_INTERVAL, MIN_ATTACK_INTERVAL,
  type Enemy, type StatusEffect,
} from './combat';

// ── rollEnemyRarity ────────────────────────────────────────────────────────
describe('ENEMY_RARITY_DEFS / rollEnemyRarity', () => {
  it('rarity chances sum to 1 (otherwise rolls silently favor "common" as fallback)', () => {
    const total = Object.values(ENEMY_RARITY_DEFS).reduce((s, d) => s + d.chance, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it('always returns a valid rarity key', () => {
    const valid = new Set(Object.keys(ENEMY_RARITY_DEFS));
    for (let i = 0; i < 200; i++) expect(valid.has(rollEnemyRarity())).toBe(true);
  });
});

// ── reviveEnemy / canRespawnEnemy / tickEnemyRespawns ───────────────────────
function makeDeadEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 1, name: 'Волк', emoji: '🐺', x: 5, y: 5, homeX: 5, homeY: 5,
    hp: 0, maxHp: 50, baseMaxHp: 50, rarity: 'common',
    attackInterval: 1500, dmgMin: 1, dmgMax: 2, dead: true, deadAt: Date.now() - 61_000,
    ...overrides,
  };
}

describe('reviveEnemy', () => {
  it('returns the enemy alive, at full health, at its home position', () => {
    const e = makeDeadEnemy({ x: 9, y: 9 });
    const r = reviveEnemy(e);
    expect(r.dead).toBe(false);
    expect(r.hp).toBe(r.maxHp);
    expect(r.x).toBe(e.homeX);
    expect(r.y).toBe(e.homeY);
    expect(r.statusEffects).toEqual([]);
    expect(r.deadAt).toBeUndefined();
  });

  it('scales maxHp from baseMaxHp by the rolled rarity multiplier', () => {
    const e = makeDeadEnemy({ baseMaxHp: 100 });
    const r = reviveEnemy(e);
    const mult = ENEMY_RARITY_DEFS[r.rarity].hpMult;
    expect(r.maxHp).toBe(Math.round(100 * mult));
  });

  it('falls back to its own x/y if no home position was recorded', () => {
    const e = makeDeadEnemy({ x: 3, y: 4, homeX: undefined, homeY: undefined });
    const r = reviveEnemy(e);
    expect(r.x).toBe(3);
    expect(r.y).toBe(4);
  });
});

describe('canRespawnEnemy', () => {
  it('false for a living enemy', () => {
    expect(canRespawnEnemy(makeDeadEnemy({ dead: false, deadAt: undefined }))).toBe(false);
  });

  it('false before its respawn timer elapses, true after', () => {
    const now = 1_000_000;
    const e = makeDeadEnemy({ deadAt: now - 100, respawnMs: 5000 });
    expect(canRespawnEnemy(e, now)).toBe(false);
    expect(canRespawnEnemy(e, now + 5000)).toBe(true);
  });

  it('uses the default RESPAWN_MS when the enemy has no custom timer', () => {
    const now = 1_000_000;
    const e = makeDeadEnemy({ deadAt: now - RESPAWN_MS + 1 });
    expect(canRespawnEnemy(e, now)).toBe(false);
    expect(canRespawnEnemy(e, now + 2)).toBe(true);
  });
});

describe('tickEnemyRespawns', () => {
  it('revives only the enemies whose timer elapsed, leaves the rest untouched', () => {
    const now = 1_000_000;
    const ready   = makeDeadEnemy({ id: 1, deadAt: now - RESPAWN_MS - 1 });
    const notYet  = makeDeadEnemy({ id: 2, deadAt: now - 100 });
    const alive   = makeDeadEnemy({ id: 3, dead: false, deadAt: undefined });
    const result = tickEnemyRespawns([ready, notYet, alive], now);
    expect(result.find(e => e.id === 1)!.dead).toBe(false);
    expect(result.find(e => e.id === 2)!.dead).toBe(true);
    expect(result.find(e => e.id === 3)!.dead).toBe(false);
  });

  it('returns the same array reference when nothing changed (cheap no-op for React state)', () => {
    const now = 1_000_000;
    const notYet = makeDeadEnemy({ deadAt: now - 100 });
    const input = [notYet];
    expect(tickEnemyRespawns(input, now)).toBe(input);
  });
});

// ── Status effects ───────────────────────────────────────────────────────
describe('addStatusEffect', () => {
  it('adds a new effect with its documented duration/damage from STATUS_EFFECT_DEFS', () => {
    const next = addStatusEffect([], 'poison');
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ type: 'poison', remainingMs: STATUS_EFFECT_DEFS.poison.durationMs, tickDamage: 6 });
  });

  it('refreshes (does not stack) an existing effect of the same type', () => {
    const first  = addStatusEffect([], 'poison');
    const second = addStatusEffect(first, 'poison');
    expect(second).toHaveLength(1);
  });

  it('different effect types coexist', () => {
    const both = addStatusEffect(addStatusEffect([], 'poison'), 'burn');
    expect(both).toHaveLength(2);
  });
});

describe('tickStatusEffects', () => {
  it('sums tick damage from poison/burn but not slow/stun', () => {
    const effects: StatusEffect[] = [
      { type: 'poison', remainingMs: 4000, tickDamage: 6 },
      { type: 'burn',   remainingMs: 3000, tickDamage: 10 },
      { type: 'slow',   remainingMs: 4000, slowPct: 30 },
    ];
    const { damage } = tickStatusEffects(effects);
    expect(damage).toBe(16);
  });

  it('drops an effect once its remaining time reaches zero', () => {
    const { next } = tickStatusEffects([{ type: 'stun', remainingMs: 1000 }]);
    expect(next).toHaveLength(0);
  });

  it('keeps an effect with time left, decremented by exactly 1000ms', () => {
    const { next } = tickStatusEffects([{ type: 'stun', remainingMs: 1500 }]);
    expect(next).toEqual([{ type: 'stun', remainingMs: 500 }]);
  });
});

describe('hasStatusEffect / slowMultiplier', () => {
  it('hasStatusEffect finds a present type and treats undefined as empty', () => {
    expect(hasStatusEffect(undefined, 'stun')).toBe(false);
    expect(hasStatusEffect([{ type: 'stun', remainingMs: 500 }], 'stun')).toBe(true);
    expect(hasStatusEffect([{ type: 'stun', remainingMs: 500 }], 'poison')).toBe(false);
  });

  it('slowMultiplier is 1 with no slow effect, and 1 + slowPct/100 with one', () => {
    expect(slowMultiplier(undefined)).toBe(1);
    expect(slowMultiplier([{ type: 'slow', remainingMs: 1000, slowPct: 30 }])).toBeCloseTo(1.3);
  });
});

// ── Resistance / effect-chance math ─────────────────────────────────────────
describe('applyResistance', () => {
  it('0% resistance leaves damage unchanged', () => {
    expect(applyResistance(100, 'fire')).toBe(100);
  });

  it('positive resistance reduces damage, negative amplifies it', () => {
    expect(applyResistance(100, 'fire', { fire: 50 })).toBe(50);
    expect(applyResistance(100, 'fire', { fire: -50 })).toBe(150);
  });

  it('never rounds damage down to 0 even at very high resistance', () => {
    expect(applyResistance(10, 'fire', { fire: 99 })).toBeGreaterThanOrEqual(1);
    expect(applyResistance(10, 'fire', { fire: 1000 })).toBeGreaterThanOrEqual(1);
  });
});

describe('effectChanceMultiplier', () => {
  it('no relevant resist → multiplier 1', () => {
    expect(effectChanceMultiplier('burn', {})).toBe(1);
    expect(effectChanceMultiplier('stun', { fire: 50 })).toBe(1); // stun has no counter-resist
  });

  it('fire resist reduces burn chance, floored at 0.1', () => {
    expect(effectChanceMultiplier('burn', { fire: 50 })).toBeCloseTo(0.5);
    expect(effectChanceMultiplier('burn', { fire: 500 })).toBe(0.1);
  });

  it('ice resist reduces slow chance the same way', () => {
    expect(effectChanceMultiplier('slow', { ice: 40 })).toBeCloseTo(0.6);
  });
});

// ── Progression ───────────────────────────────────────────────────────────
describe('xpRequired', () => {
  it('level 1 costs exactly BASE_XP_PER_LEVEL', () => {
    expect(xpRequired(1)).toBe(100);
  });

  it('strictly increases with level (no plateaus/regressions in the curve)', () => {
    let prev = xpRequired(1);
    for (let lvl = 2; lvl <= 30; lvl++) {
      const next = xpRequired(lvl);
      expect(next).toBeGreaterThan(prev);
      prev = next;
    }
  });
});

describe('calcAttackInterval', () => {
  it('matches BASE_ATTACK_INTERVAL at 0 agility, 0 penalty', () => {
    expect(calcAttackInterval(0, 0)).toBe(BASE_ATTACK_INTERVAL);
  });

  it('never drops below MIN_ATTACK_INTERVAL from agility alone', () => {
    expect(calcAttackInterval(1000, 0)).toBe(MIN_ATTACK_INTERVAL);
  });

  it('atkSpeedPenalty slows down attacks even at the agility floor', () => {
    const floored = calcAttackInterval(1000, 0);
    const penalized = calcAttackInterval(1000, 50);
    expect(penalized).toBeGreaterThan(floored);
  });
});

describe('applyXpGain — single source of truth for the level-up loop (was triplicated before)', () => {
  it('no level-up: xp just accumulates', () => {
    const r = applyXpGain(0, 1, 0, 0, 0, 50);
    expect(r.leveledUp).toBe(false);
    expect(r.xp).toBe(50);
    expect(r.level).toBe(1);
  });

  it('exact level-up: leftover xp is 0, stat/skill points awarded once', () => {
    const need = xpRequired(1); // 100
    const r = applyXpGain(0, 1, 0, 0, 0, need);
    expect(r.leveledUp).toBe(true);
    expect(r.level).toBe(2);
    expect(r.xp).toBe(0);
    expect(r.statPointsGained).toBe(3);
    expect(r.bonusDmg).toBe(2);
    expect(r.levelHpBonus).toBe(20);
    expect(r.levelMpBonus).toBe(5);
  });

  it('overkill XP in one hit triggers multiple level-ups in a single call', () => {
    const need1 = xpRequired(1);
    const need2 = xpRequired(2);
    const massiveXp = need1 + need2 + 10;
    const r = applyXpGain(0, 1, 0, 0, 0, massiveXp);
    expect(r.level).toBe(3);
    expect(r.xp).toBe(10);
    expect(r.statPointsGained).toBe(6); // 2 level-ups × 3
    expect(r.bonusDmg).toBe(4);         // 2 level-ups × 2
  });

  it('carries forward existing bonuses rather than resetting them', () => {
    const r = applyXpGain(0, 5, 40, 400, 100, 0);
    expect(r.bonusDmg).toBe(40);
    expect(r.levelHpBonus).toBe(400);
    expect(r.levelMpBonus).toBe(100);
    expect(r.leveledUp).toBe(false);
  });
});
