// ─── COMBAT SYSTEM ────────────────────────────────────────────────────────────
import type { Item } from './inventory';
import { SKILL_POINTS_PER_LEVEL } from './skills/skills';

// ── Shared world type (also used by save.ts and world/locations.ts) ───────────
export type LocationId = 'village' | 'forest' | 'cave' | 'ruins' | 'swamp';

// ── Combat-specific types ─────────────────────────────────────────────────────
export type Phase = 'explore' | 'combat' | 'victory' | 'final-victory' | 'defeat';

export interface Enemy {
  id: number; name: string; emoji: string;
  x: number; y: number;
  hp: number; maxHp: number;
  attackInterval: number; dmgMin: number; dmgMax: number;
  dead: boolean;
  statusEffects?: StatusEffect[];
}

export interface KillReward {
  xp: number; gold: number; leveledUp: boolean;
  newLevel: number; statPtsGained: number; droppedItem?: Item;
}

// ── Status effects ───────────────────────────────────────────────────────────
export type StatusEffectType = 'poison' | 'burn' | 'slow' | 'stun';

export interface StatusEffect {
  type: StatusEffectType;
  remainingMs: number;
  tickDamage?: number;   // poison / burn — damage dealt every 1000ms
  slowPct?: number;      // slow — % increase to attack interval
}

interface StatusEffectDef {
  durationMs: number;
  tickDamage?: number;
  slowPct?: number;
  icon: string;
  label: string;
}

export const STATUS_EFFECT_DEFS: Record<StatusEffectType, StatusEffectDef> = {
  poison: { durationMs: 3000, tickDamage: 5,  icon: '🐍', label: 'Яд' },
  burn:   { durationMs: 3000, tickDamage: 10, icon: '🔥', label: 'Поджог' },
  slow:   { durationMs: 4000, slowPct: 30,    icon: '🐌', label: 'Замедление' },
  stun:   { durationMs: 1500,                 icon: '💫', label: 'Оглушение' },
};

/** Which enemies inflict which effect on a successful hit, and how often. */
export const ENEMY_EFFECT_ON_HIT: Record<string, { effect: StatusEffectType; chance: number }> = {
  'Гигантский паук': { effect: 'poison', chance: 0.35 },
  'Орк':             { effect: 'stun',   chance: 0.20 },
  'Тролль':          { effect: 'slow',   chance: 0.35 },
};

/** Which player skills inflict which effect on a successful hit (id → effect). */
export const SKILL_EFFECT_ON_HIT: Partial<Record<number, StatusEffectType>> = {
  2: 'burn', // Огонь
  4: 'stun', // Молния
};

/** Add (or refresh — no stacking) a status effect on the given effect list. */
export function addStatusEffect(effects: StatusEffect[], type: StatusEffectType): StatusEffect[] {
  const def = STATUS_EFFECT_DEFS[type];
  const fresh: StatusEffect = { type, remainingMs: def.durationMs, tickDamage: def.tickDamage, slowPct: def.slowPct };
  return [...effects.filter(e => e.type !== type), fresh];
}

/** Advance all effects by one 1000ms tick. Returns the surviving effects and total tick damage dealt. */
export function tickStatusEffects(effects: StatusEffect[]): { next: StatusEffect[]; damage: number } {
  let damage = 0;
  const next: StatusEffect[] = [];
  for (const e of effects) {
    if (e.type === 'poison' || e.type === 'burn') damage += e.tickDamage ?? 0;
    const remaining = e.remainingMs - 1000;
    if (remaining > 0) next.push({ ...e, remainingMs: remaining });
  }
  return { next, damage };
}

export const hasStatusEffect = (effects: StatusEffect[] | undefined, type: StatusEffectType): boolean =>
  (effects ?? []).some(e => e.type === type);

/** Attack-interval multiplier from an active Slow effect (1 = unaffected). */
export const slowMultiplier = (effects: StatusEffect[] | undefined): number => {
  const slow = (effects ?? []).find(e => e.type === 'slow');
  return slow ? 1 + (slow.slowPct ?? 0) / 100 : 1;
};

// ── Skills ────────────────────────────────────────────────────────────────────
export const SKILLS = [
  { id: 1, name: 'Удар',    emoji: '⚔️', damage: 28, healSelf: 0,  maxCd: 25, manaCost: 0  },
  { id: 2, name: 'Огонь',   emoji: '🔥', damage: 42, healSelf: 0,  maxCd: 45, manaCost: 25 },
  { id: 3, name: 'Лечение', emoji: '💚', damage: 0,  healSelf: 30, maxCd: 55, manaCost: 20 },
  { id: 4, name: 'Молния',  emoji: '⚡', damage: 38, healSelf: 0,  maxCd: 40, manaCost: 20 },
  { id: 5, name: 'Щит',     emoji: '🛡️', damage: 0,  healSelf: 0,  maxCd: 35, manaCost: 15 },
];

// ── Progression constants ─────────────────────────────────────────────────────
export const BASE_XP_PER_LEVEL     = 100;
export const STAT_POINTS_PER_LEVEL = 3;

// ── Attack timing constants ───────────────────────────────────────────────────
export const BASE_ATTACK_INTERVAL = 1500;
export const MIN_ATTACK_INTERVAL  = 500;

// ── Enemy kill reward table ───────────────────────────────────────────────────
export const REWARD_TABLE: Record<string, { xp: number; goldMin: number; goldMax: number }> = {
  'Гоблин':          { xp: 25,  goldMin: 5,  goldMax: 10 },
  'Волк':            { xp: 20,  goldMin: 3,  goldMax: 7  },
  'Орк':             { xp: 60,  goldMin: 15, goldMax: 25 },
  'Кабан':           { xp: 35,  goldMin: 6,  goldMax: 12 },
  'Гигантский паук': { xp: 45,  goldMin: 8,  goldMax: 15 },
  'Скелет':          { xp: 50,  goldMin: 10, goldMax: 18 },
  'Зомби':           { xp: 80,  goldMin: 20, goldMax: 35 },
  'Тролль':          { xp: 90,  goldMin: 22, goldMax: 38 },
};

// ── Pure helpers ──────────────────────────────────────────────────────────────

/** XP needed to reach the next level from `level`. */
export function xpRequired(level: number): number {
  return Math.floor(BASE_XP_PER_LEVEL * Math.pow(1.25, level - 1));
}

/** Agility reduces interval by 3%/pt; atkSpeedPenalty increases it by N%. */
export function calcAttackInterval(agility: number, atkSpeedPenalty = 0): number {
  const base = Math.max(MIN_ATTACK_INTERVAL, Math.floor(BASE_ATTACK_INTERVAL * (1 - 0.03 * agility)));
  return Math.floor(base * (1 + atkSpeedPenalty / 100));
}

export interface LevelUpResult {
  xp:                number;  // leftover XP after any level-ups
  level:              number;
  bonusDmg:           number;  // cumulative +2/level flat damage bonus
  levelHpBonus:       number;  // cumulative +20/level max-HP bonus
  levelMpBonus:       number;  // cumulative +5/level max-MP bonus
  xpToNext:           number;  // XP required at `level` to reach `level + 1`
  statPointsGained:   number;  // stat points earned THIS call (0 if no level-up)
  skillPointsGained:  number;  // skill points earned THIS call (0 if no level-up)
  leveledUp:          boolean;
}

/**
 * Pure XP/level-up calculation — no refs, no state, no side effects.
 * Single source of truth: previously this exact loop was duplicated in
 * `applyRewards`, `handleBossDeath`, and the quest-completion handler.
 * Handles multi-level-ups in one call (loops `while`, not `if`).
 */
export function applyXpGain(
  currentXp: number,
  currentLevel: number,
  currentBonusDmg: number,
  currentLevelHpBonus: number,
  currentLevelMpBonus: number,
  xpGained: number,
): LevelUpResult {
  let xp           = currentXp + xpGained;
  let level        = currentLevel;
  let bonusDmg     = currentBonusDmg;
  let levelHpBonus = currentLevelHpBonus;
  let levelMpBonus = currentLevelMpBonus;
  let statPointsGained  = 0;
  let skillPointsGained = 0;
  let leveledUp = false;
  let needed = xpRequired(level);

  while (xp >= needed) {
    xp -= needed;
    level++;
    bonusDmg          += 2;
    levelHpBonus      += 20;
    levelMpBonus      += 5;
    statPointsGained  += STAT_POINTS_PER_LEVEL;
    skillPointsGained += SKILL_POINTS_PER_LEVEL;
    needed = xpRequired(level);
    leveledUp = true;
  }

  return { xp, level, bonusDmg, levelHpBonus, levelMpBonus, xpToNext: needed, statPointsGained, skillPointsGained, leveledUp };
}

// ── Enemy factory ─────────────────────────────────────────────────────────────

/** Instantiate fresh enemy instances for a given location. */
export const makeLocationEnemies = (loc: LocationId): Enemy[] => {
  const defs: Record<LocationId, Array<Omit<Enemy, 'id'>>> = {
    village: [],
    forest: [
      { name: 'Гоблин', emoji: '👺', x: 5,  y: 2,  hp: 150, maxHp: 150, attackInterval: 2200, dmgMin: 5,  dmgMax: 12, dead: false },
      { name: 'Гоблин', emoji: '👺', x: 14, y: 5,  hp: 150, maxHp: 150, attackInterval: 2200, dmgMin: 5,  dmgMax: 12, dead: false },
      { name: 'Волк',   emoji: '🐺', x: 8,  y: 13, hp: 100, maxHp: 100, attackInterval: 900,  dmgMin: 3,  dmgMax: 8,  dead: false },
      { name: 'Волк',   emoji: '🐺', x: 16, y: 14, hp: 100, maxHp: 100, attackInterval: 900,  dmgMin: 3,  dmgMax: 8,  dead: false },
      { name: 'Гоблин', emoji: '👺', x: 4,  y: 17, hp: 150, maxHp: 150, attackInterval: 2200, dmgMin: 5,  dmgMax: 12, dead: false },
    ],
    cave: [
      { name: 'Орк',             emoji: '👹', x: 8,  y: 4,  hp: 300, maxHp: 300, attackInterval: 3500, dmgMin: 15, dmgMax: 25, dead: false },
      { name: 'Орк',             emoji: '👹', x: 5,  y: 13, hp: 300, maxHp: 300, attackInterval: 3500, dmgMin: 15, dmgMax: 25, dead: false },
      { name: 'Гигантский паук', emoji: '🕷️', x: 15, y: 7,  hp: 180, maxHp: 180, attackInterval: 1400, dmgMin: 8,  dmgMax: 16, dead: false },
      { name: 'Гигантский паук', emoji: '🕷️', x: 12, y: 16, hp: 180, maxHp: 180, attackInterval: 1400, dmgMin: 8,  dmgMax: 16, dead: false },
    ],
    ruins: [
      { name: 'Скелет', emoji: '💀', x: 4,  y: 6,  hp: 200, maxHp: 200, attackInterval: 1800, dmgMin: 12, dmgMax: 20, dead: false },
      { name: 'Зомби',  emoji: '🧟', x: 14, y: 5,  hp: 350, maxHp: 350, attackInterval: 4000, dmgMin: 18, dmgMax: 28, dead: false },
      { name: 'Скелет', emoji: '💀', x: 7,  y: 12, hp: 200, maxHp: 200, attackInterval: 1800, dmgMin: 12, dmgMax: 20, dead: false },
      { name: 'Зомби',  emoji: '🧟', x: 16, y: 14, hp: 350, maxHp: 350, attackInterval: 4000, dmgMin: 18, dmgMax: 28, dead: false },
      { name: 'Скелет', emoji: '💀', x: 4,  y: 17, hp: 200, maxHp: 200, attackInterval: 1800, dmgMin: 12, dmgMax: 20, dead: false },
    ],
    swamp: [
      { name: 'Кабан',  emoji: '🐗', x: 4,  y: 5,  hp: 220, maxHp: 220, attackInterval: 2800, dmgMin: 10, dmgMax: 18, dead: false },
      { name: 'Тролль', emoji: '👾', x: 14, y: 6,  hp: 400, maxHp: 400, attackInterval: 4500, dmgMin: 18, dmgMax: 30, dead: false },
      { name: 'Кабан',  emoji: '🐗', x: 7,  y: 14, hp: 220, maxHp: 220, attackInterval: 2800, dmgMin: 10, dmgMax: 18, dead: false },
      { name: 'Тролль', emoji: '👾', x: 15, y: 15, hp: 400, maxHp: 400, attackInterval: 4500, dmgMin: 18, dmgMax: 30, dead: false },
    ],
  };
  return defs[loc].map((d, i) => ({ ...d, id: i + 1 }));
};
