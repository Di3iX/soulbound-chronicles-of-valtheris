import { describe, it, expect } from 'vitest';
import { affixCountForRarity, rollAffixes, mergeBonuses, makeItem, ITEM_CATALOG, type Rarity } from './inventory';

// Regression test for a real bug found during refactoring: affixCountForRarity
// and rollAffixes were typed with a nonexistent `ItemRarity` type (should have
// been `Rarity`), which broke `tsc --noEmit` for the whole project.
describe('affixCountForRarity — signature regression guard', () => {
  it('accepts every member of the real Rarity union without a type error', () => {
    const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    for (const r of rarities) expect(() => affixCountForRarity(r)).not.toThrow();
  });

  it('higher rarities never roll fewer affixes on average than lower ones', () => {
    const sample = (r: Rarity) => {
      let total = 0;
      for (let i = 0; i < 500; i++) total += affixCountForRarity(r);
      return total / 500;
    };
    const commonAvg    = sample('common');
    const legendaryAvg = sample('legendary');
    expect(legendaryAvg).toBeGreaterThan(commonAvg);
  });
});

describe('rollAffixes', () => {
  it('consumables never get affixes regardless of rarity', () => {
    expect(rollAffixes('consumable', 'legendary')).toEqual([]);
  });

  it('rolled affix count never exceeds affixCountForRarity\'s theoretical max for that rarity', () => {
    // legendary can roll up to 3 (see affixCountForRarity) — never more.
    for (let i = 0; i < 50; i++) {
      const affixes = rollAffixes('weapon', 'legendary');
      expect(affixes.length).toBeLessThanOrEqual(3);
    }
  });

  it('never rolls the same affix id twice on one item', () => {
    for (let i = 0; i < 50; i++) {
      const affixes = rollAffixes('weapon', 'epic');
      const ids = affixes.map(a => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('mergeBonuses', () => {
  it('with no affixes, returns a copy of the base bonuses', () => {
    const base = { damage: 5 };
    const merged = mergeBonuses(base);
    expect(merged).toEqual(base);
    expect(merged).not.toBe(base); // copy, not same reference
  });

  it('sums affix bonuses on top of base bonuses for the same stat', () => {
    const merged = mergeBonuses(
      { damage: 5, strength: 2 },
      [{ id: 'a1', label: '', bonuses: { damage: 3 } }, { id: 'a2', label: '', bonuses: { damage: 1, strength: 1 } }],
    );
    expect(merged.damage).toBe(9);
    expect(merged.strength).toBe(3);
  });
});

describe('makeItem', () => {
  it('throws a clear error for an unknown item key rather than returning garbage', () => {
    expect(() => makeItem('this_key_does_not_exist')).toThrow(/unknown item key/i);
  });

  it('every ITEM_CATALOG entry can be instantiated without throwing', () => {
    for (const key of Object.keys(ITEM_CATALOG)) {
      expect(() => makeItem(key), key).not.toThrow();
    }
  });

  it('gives every item a unique id, even for the same key rolled twice', () => {
    const [a, b] = Object.keys(ITEM_CATALOG).length > 0
      ? [makeItem(Object.keys(ITEM_CATALOG)[0]), makeItem(Object.keys(ITEM_CATALOG)[0])]
      : [];
    expect(a?.id).toBeDefined();
    expect(a?.id).not.toBe(b?.id);
  });
});
