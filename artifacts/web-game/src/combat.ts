// ─── COMBAT SYSTEM ────────────────────────────────────────────────────────────
import type { Item } from './inventory';
import { SKILL_POINTS_PER_LEVEL } from './skills/skills';
import {
  MONSTER_DEFS, SPEED_INTERVAL, buildRewardTable, buildEffectOnHit, buildResistances,
} from './monsters';

// ── Shared world type (also used by save.ts and world/locations.ts) ───────────
export type LocationId = 'village' | 'forest' | 'darkforest' | 'wolfcave' | 'mountains' | 'road' | 'ruins' | 'swamp' | 'mine' | 'pass' | 'icefort';

// ── Combat-specific types ─────────────────────────────────────────────────────
export type Phase = 'explore' | 'combat' | 'victory' | 'defeat';

export interface Enemy {
  id: number; name: string; emoji: string;
  x: number; y: number;
  hp: number; maxHp: number;
  baseMaxHp: number;         // unscaled HP from the enemy definition — rarity multiplies this, never itself
  attackInterval: number; dmgMin: number; dmgMax: number;
  dead: boolean;
  deadAt?: number;           // Date.now() timestamp when it died — drives respawn timing
  rarity: EnemyRarity;
  statusEffects?: StatusEffect[];
  /** % resist (positive) or weakness (negative) per damage type this enemy takes. */
  resistances?: Partial<Record<DamageType, number>>;
  /** Damage type this enemy deals to the player. Defaults to 'physical' if unset. */
  dealsDamageType?: DamageType;
}

/** How long (ms) a slain normal enemy stays dead before respawning at its spot. */
export const RESPAWN_MS = 90_000;  // 90 sec — enough time to clear a zone

// ── Enemy rarity (rolled fresh on every spawn/respawn) ────────────────────────
export type EnemyRarity = 'common' | 'uncommon' | 'rare' | 'elite' | 'legendary';

export interface EnemyRarityDef {
  label: string;
  emoji: string;
  color: string;            // hex, for name/border tinting
  chance: number;           // spawn probability — all five sum to 1.0
  hpMult: number;
  dmgMult: number;
  xpMult: number;
  goldMult: number;
  itemChanceBonus: number;  // percentage points added to the loot-table roll
  guaranteedDrop: boolean;
}

export const ENEMY_RARITY_DEFS: Record<EnemyRarity, EnemyRarityDef> = {
  common:    { label: 'Обычный',     emoji: '⚪', color: '#9ca3af', chance: 0.70, hpMult: 1,   dmgMult: 1.0, xpMult: 1,    goldMult: 1,    itemChanceBonus: 0,  guaranteedDrop: false },
  uncommon:  { label: 'Необычный',   emoji: '🟢', color: '#4ade80', chance: 0.18, hpMult: 1.2, dmgMult: 1.1, xpMult: 1.15, goldMult: 1.15, itemChanceBonus: 0,  guaranteedDrop: false },
  rare:      { label: 'Редкий',      emoji: '🔵', color: '#60a5fa', chance: 0.08, hpMult: 1.5, dmgMult: 1.2, xpMult: 1.35, goldMult: 1.35, itemChanceBonus: 10, guaranteedDrop: false },
  elite:     { label: 'Элитный',     emoji: '🟣', color: '#c084fc', chance: 0.03, hpMult: 2.0, dmgMult: 1.3, xpMult: 1.75, goldMult: 1.75, itemChanceBonus: 25, guaranteedDrop: false },
  legendary: { label: 'Легендарный', emoji: '🟠', color: '#fbbf24', chance: 0.01, hpMult: 3.0, dmgMult: 1.6, xpMult: 2.5,  goldMult: 2.5,  itemChanceBonus: 0,  guaranteedDrop: true  },
};

const RARITY_ORDER: EnemyRarity[] = ['common', 'uncommon', 'rare', 'elite', 'legendary'];

/** Weighted random rarity roll — used for every normal-enemy spawn and respawn. */
export function rollEnemyRarity(): EnemyRarity {
  const r = Math.random();
  let acc = 0;
  for (const key of RARITY_ORDER) {
    acc += ENEMY_RARITY_DEFS[key].chance;
    if (r < acc) return key;
  }
  return 'common';
}

/** Reset a dead enemy back to full health at its original spot, rolling a fresh rarity. */
export function reviveEnemy(enemy: Enemy): Enemy {
  const rarity = rollEnemyRarity();
  const maxHp  = Math.round(enemy.baseMaxHp * ENEMY_RARITY_DEFS[rarity].hpMult);
  return { ...enemy, dead: false, hp: maxHp, maxHp, rarity, statusEffects: [], deadAt: undefined };
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
  poison: { durationMs: 4000, tickDamage: 6,  icon: '🐍', label: 'Яд' },
  burn:   { durationMs: 3000, tickDamage: 10, icon: '🔥', label: 'Горение' },
  slow:   { durationMs: 4000, slowPct: 30,    icon: '🐌', label: 'Замедление' },
  stun:   { durationMs: 1500,                 icon: '💫', label: 'Оглушение' },
};

/** Which enemies inflict which effect on a successful hit, and how often. */
export const ENEMY_EFFECT_ON_HIT: Record<string, { effect: StatusEffectType; chance: number }> = buildEffectOnHit();

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
export type DamageType = 'physical' | 'fire' | 'electric' | 'ice';

export const SKILLS = [
  { id: 1, name: 'Удар',    emoji: '⚔️', damage: 28, healSelf: 0,  maxCd: 25, manaCost: 0,  damageType: 'physical' as DamageType },
  { id: 2, name: 'Огонь',   emoji: '🔥', damage: 42, healSelf: 0,  maxCd: 45, manaCost: 25, damageType: 'fire'     as DamageType },
  { id: 3, name: 'Лечение', emoji: '💚', damage: 0,  healSelf: 30, maxCd: 55, manaCost: 20, damageType: 'physical' as DamageType },
  { id: 4, name: 'Молния',  emoji: '⚡', damage: 38, healSelf: 0,  maxCd: 40, manaCost: 20, damageType: 'electric' as DamageType },
  { id: 5, name: 'Щит',     emoji: '🛡️', damage: 0,  healSelf: 0,  maxCd: 35, manaCost: 15, damageType: 'physical' as DamageType },
];

/** Reduces (or, for a negative value, amplifies) damage of a given type. `pct`: positive = resistance, negative = weakness. */
export function applyResistance(dmg: number, type: DamageType, resistances?: Partial<Record<DamageType, number>>): number {
  const pct = resistances?.[type] ?? 0;
  if (pct === 0) return dmg;
  return Math.max(1, Math.round(dmg * (1 - pct / 100)));
}

/** Effect chance multiplier from player resists (0.1–1). */
export function effectChanceMultiplier(
  effect: StatusEffectType,
  resists: { fire?: number; electric?: number; ice?: number },
): number {
  const pct =
    effect === 'burn' ? (resists.fire ?? 0) :
    effect === 'slow' ? (resists.ice ?? 0) :
    0;
  if (pct <= 0) return 1;
  return Math.max(0.1, 1 - pct / 100);
}

export const DAMAGE_TYPE_LABEL: Record<DamageType, string> = {
  physical: 'физ.',
  fire: 'огонь',
  electric: 'молния',
  ice: 'лёд',
}

// ── Progression constants ─────────────────────────────────────────────────────
export const BASE_XP_PER_LEVEL     = 100;
export const STAT_POINTS_PER_LEVEL = 3;

// ── Attack timing constants ───────────────────────────────────────────────────
export const BASE_ATTACK_INTERVAL = 1500;
export const MIN_ATTACK_INTERVAL  = 500;

// ── Enemy kill reward table ───────────────────────────────────────────────────
export const REWARD_TABLE: Record<string, { xp: number; goldMin: number; goldMax: number }> = buildRewardTable();

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

/** Spawn enemies for a location; combat stats come from MONSTER_DEFS. */
export const makeLocationEnemies = (loc: LocationId): Enemy[] => {
  type Spawn = { name: string; x: number; y: number };
  const spawns: Record<LocationId, Spawn[]> = {
    village: [],
    forest: [
      { name: 'Крыса', x: 3, y: 5 }, { name: 'Крыса', x: 12, y: 6 },
      { name: 'Кролик', x: 7, y: 7 }, { name: 'Ворон', x: 11, y: 4 },
      { name: 'Молодой кабан', x: 5, y: 12 }, { name: 'Полевая змея', x: 13, y: 11 },
      { name: 'Молодой кабан', x: 8, y: 15 },
    ],
    darkforest: [
      { name: 'Гоблин', x: 5, y: 4 }, { name: 'Гоблин', x: 14, y: 5 },
      { name: 'Волк', x: 7, y: 11 }, { name: 'Волк', x: 12, y: 8 },
      { name: 'Бандит', x: 8, y: 14 }, { name: 'Бандит', x: 13, y: 15 },
    ],
    wolfcave: [
      { name: 'Волк', x: 5, y: 5 }, { name: 'Волк', x: 14, y: 6 },
      { name: 'Летучая мышь', x: 9, y: 8 }, { name: 'Летучая мышь', x: 13, y: 13 },
      { name: 'Альфа-волк', x: 10, y: 15 },
    ],
    mountains: [
      { name: 'Ледяной волк', x: 6, y: 5 }, { name: 'Ледяной волк', x: 12, y: 6 },
      { name: 'Снежный паук', x: 8, y: 11 }, { name: 'Йети', x: 11, y: 14 },
      { name: 'Ледяной волк', x: 7, y: 16 },
    ],
    road: [
      { name: 'Разбойник', x: 5, y: 7 }, { name: 'Лучник', x: 14, y: 8 },
      { name: 'Разбойник', x: 8, y: 11 }, { name: 'Наёмник', x: 15, y: 10 },
      { name: 'Лучник', x: 4, y: 12 },
    ],
    ruins: [
      { name: 'Скелет', x: 5, y: 6 }, { name: 'Зомби', x: 13, y: 5 },
      { name: 'Призрак', x: 10, y: 10 }, { name: 'Скелет', x: 7, y: 13 },
      { name: 'Зомби', x: 14, y: 14 },
    ],
    swamp: [
      { name: 'Слизень', x: 4, y: 5 }, { name: 'Ядовитый паук', x: 12, y: 6 },
      { name: 'Болотник', x: 8, y: 12 }, { name: 'Слизень', x: 14, y: 14 },
    ],
    mine: [
      { name: 'Летучая мышь', x: 4, y: 4 }, { name: 'Шахтёр-зомби', x: 11, y: 5 },
      { name: 'Голем', x: 8, y: 9 }, { name: 'Летучая мышь', x: 15, y: 14 },
      { name: 'Шахтёр-зомби', x: 5, y: 14 },
    ],
    pass: [
      { name: 'Горный тролль', x: 9, y: 5 }, { name: 'Гарпия', x: 10, y: 8 },
      { name: 'Голем', x: 8, y: 12 }, { name: 'Гарпия', x: 9, y: 15 },
      { name: 'Горный тролль', x: 10, y: 17 },
    ],
    icefort: [
      { name: 'Рыцарь льда', x: 6, y: 6 }, { name: 'Маг льда', x: 13, y: 7 },
      { name: 'Рыцарь льда', x: 10, y: 12 }, { name: 'Маг льда', x: 7, y: 14 },
    ],
  };

  return (spawns[loc] ?? []).map((s, i) => {
    const def = MONSTER_DEFS[s.name];
    const baseHp = def?.hp ?? 100;
    const rarity = rollEnemyRarity();
    const maxHp  = Math.round(baseHp * ENEMY_RARITY_DEFS[rarity].hpMult);
    return {
      id: i + 1,
      name: s.name,
      emoji: def?.emoji ?? '❓',
      x: s.x, y: s.y,
      hp: maxHp, maxHp, baseMaxHp: baseHp,
      attackInterval: def ? SPEED_INTERVAL[def.speed] : 2000,
      dmgMin: def?.dmgMin ?? 5,
      dmgMax: def?.dmgMax ?? 10,
      dead: false,
      rarity,
      resistances: ENEMY_RESISTANCES[s.name],
      dealsDamageType: def?.damageType ?? 'physical',
    };
  });
};

const ENEMY_RESISTANCES: Record<string, Partial<Record<DamageType, number>>> = buildResistances();
