import { describe, it, expect } from 'vitest';
import {
  BOSS_CONFIGS, ALL_BOSS_IDS, MINI_BOSS_IDS,
  isBossId, isMiniBossId, bossKindLabel, bossKeyForEnemyId, makeTrophyForBoss,
  normalizeBossState, INITIAL_BOSS_STATE,
  BOSS_ID, FIELD_BOSS_ID, RUINS_BOSS_ID, SWAMP_BOSS_ID, MINE_BOSS_ID, PASS_BOSS_ID, ICE_BOSS_ID,
} from './boss';

const BOSS_KEYS = Object.keys(BOSS_CONFIGS) as (keyof typeof BOSS_CONFIGS)[];

describe('BOSS_CONFIGS — data integrity (regression guard for the config-driven refactor)', () => {
  it('has exactly 7 bosses', () => {
    expect(BOSS_KEYS).toHaveLength(7);
  });

  it('every boss id is unique', () => {
    const ids = BOSS_KEYS.map(k => BOSS_CONFIGS[k].id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every boss has positive hp, reward and respawn timer', () => {
    for (const key of BOSS_KEYS) {
      const cfg = BOSS_CONFIGS[key];
      expect(cfg.def.hp, `${key}.def.hp`).toBeGreaterThan(0);
      expect(cfg.def.maxHp, `${key}.def.maxHp`).toBe(cfg.def.hp);
      expect(cfg.reward.xp, `${key}.reward.xp`).toBeGreaterThan(0);
      expect(cfg.reward.gold, `${key}.reward.gold`).toBeGreaterThan(0);
      expect(cfg.respawnMs, `${key}.respawnMs`).toBeGreaterThan(0);
    }
  });

  it('every boss has exactly 2 first-kill story lines', () => {
    for (const key of BOSS_KEYS) {
      expect(BOSS_CONFIGS[key].firstKillStoryLines, key).toHaveLength(2);
    }
  });

  it('only caveChief has an unlock message (the ruins-gate story beat)', () => {
    expect(BOSS_CONFIGS.caveChief.unlockMessage).toBeTruthy();
    for (const key of BOSS_KEYS) {
      if (key !== 'caveChief') expect(BOSS_CONFIGS[key].unlockMessage, key).toBeUndefined();
    }
  });

  it('only fieldBoar is a mini-boss', () => {
    expect(BOSS_CONFIGS.fieldBoar.isMiniBoss).toBe(true);
    for (const key of BOSS_KEYS) {
      if (key !== 'fieldBoar') expect(BOSS_CONFIGS[key].isMiniBoss, key).toBe(false);
    }
  });
});

describe('individual boss id exports (public API used by App.tsx UI checks)', () => {
  it('match BOSS_CONFIGS', () => {
    expect(BOSS_ID).toBe(BOSS_CONFIGS.caveChief.id);
    expect(FIELD_BOSS_ID).toBe(BOSS_CONFIGS.fieldBoar.id);
    expect(RUINS_BOSS_ID).toBe(BOSS_CONFIGS.ruinsKeeper.id);
    expect(SWAMP_BOSS_ID).toBe(BOSS_CONFIGS.swampHorror.id);
    expect(MINE_BOSS_ID).toBe(BOSS_CONFIGS.mineGuardian.id);
    expect(PASS_BOSS_ID).toBe(BOSS_CONFIGS.passLord.id);
    expect(ICE_BOSS_ID).toBe(BOSS_CONFIGS.iceKing.id);
  });
});

describe('ALL_BOSS_IDS / MINI_BOSS_IDS / isBossId / isMiniBossId / bossKindLabel', () => {
  it('ALL_BOSS_IDS contains every boss, MINI_BOSS_IDS only the mini-bosses', () => {
    expect(ALL_BOSS_IDS.size).toBe(7);
    expect(MINI_BOSS_IDS.size).toBe(1);
    expect(MINI_BOSS_IDS.has(FIELD_BOSS_ID)).toBe(true);
  });

  it('isBossId / isMiniBossId agree with the sets', () => {
    for (const id of ALL_BOSS_IDS) expect(isBossId(id)).toBe(true);
    expect(isBossId(1)).toBe(false); // a normal enemy id
    expect(isMiniBossId(FIELD_BOSS_ID)).toBe(true);
    expect(isMiniBossId(BOSS_ID)).toBe(false);
  });

  it('bossKindLabel: mini-boss > boss > empty, in that priority', () => {
    expect(bossKindLabel(FIELD_BOSS_ID)).toBe('Мини-босс');
    expect(bossKindLabel(BOSS_ID)).toBe('Босс');
    expect(bossKindLabel(1)).toBe('');
  });
});

describe('bossKeyForEnemyId — the O(1) dispatch used by useCombat.handleEnemyDeath', () => {
  it('resolves every boss id back to its own key', () => {
    for (const key of BOSS_KEYS) {
      expect(bossKeyForEnemyId(BOSS_CONFIGS[key].id)).toBe(key);
    }
  });

  it('returns undefined for a non-boss enemy id', () => {
    expect(bossKeyForEnemyId(1)).toBeUndefined();
  });
});

describe('makeTrophyForBoss', () => {
  it('produces a trophy matching the boss config, with a fresh unique id each time', () => {
    for (const key of BOSS_KEYS) {
      const t1 = makeTrophyForBoss(key);
      const t2 = makeTrophyForBoss(key);
      expect(t1.name).toBe(BOSS_CONFIGS[key].trophy.name);
      expect(t1.rarity).toBe(BOSS_CONFIGS[key].trophy.rarity);
      expect(t1.id).not.toBe(t2.id); // two rolls never collide
    }
  });
});

describe('BossState helpers', () => {
  it('INITIAL_BOSS_STATE has an entry for every boss, all unkilled', () => {
    for (const key of BOSS_KEYS) {
      expect(INITIAL_BOSS_STATE[key]).toEqual({ firstKillDone: false });
    }
  });

  it('normalizeBossState fills in missing bosses (e.g. an old save from before a new boss was added)', () => {
    const partialSave = { caveChief: { firstKillDone: true, deadAt: 12345 } };
    const normalized = normalizeBossState(partialSave);
    expect(normalized.caveChief).toEqual({ firstKillDone: true, deadAt: 12345 });
    expect(normalized.fieldBoar).toEqual({ firstKillDone: false });
    for (const key of BOSS_KEYS) expect(normalized[key]).toBeDefined();
  });

  it('normalizeBossState handles null/undefined saves (new game)', () => {
    const normalized = normalizeBossState(null);
    for (const key of BOSS_KEYS) expect(normalized[key]).toEqual({ firstKillDone: false });
  });
});
