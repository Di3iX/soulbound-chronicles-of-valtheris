// ─── COMBAT SYSTEM ────────────────────────────────────────────────────────────
import type { Item } from './inventory';
import { SKILL_POINTS_PER_LEVEL } from './skills/skills';

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
  poison: { durationMs: 3000, tickDamage: 5,  icon: '🐍', label: 'Яд' },
  burn:   { durationMs: 3000, tickDamage: 10, icon: '🔥', label: 'Поджог' },
  slow:   { durationMs: 4000, slowPct: 30,    icon: '🐌', label: 'Замедление' },
  stun:   { durationMs: 1500,                 icon: '💫', label: 'Оглушение' },
};

/** Which enemies inflict which effect on a successful hit, and how often. */
export const ENEMY_EFFECT_ON_HIT: Record<string, { effect: StatusEffectType; chance: number }> = {
  'Гигантский паук': { effect: 'poison', chance: 0.35 },
  'Полевая змея':    { effect: 'poison', chance: 0.40 },
  'Ядовитый паук':   { effect: 'poison', chance: 0.45 },
  'Снежный паук':    { effect: 'slow',   chance: 0.30 },
  'Слизень':         { effect: 'slow',   chance: 0.35 },
  'Орк':             { effect: 'stun',   chance: 0.20 },
  'Тролль':          { effect: 'slow',   chance: 0.35 },
  'Горный тролль':   { effect: 'stun',   chance: 0.25 },
  'Бандит':          { effect: 'stun',   chance: 0.15 },
  'Разбойник':       { effect: 'stun',   chance: 0.15 },
  'Наёмник':         { effect: 'stun',   chance: 0.20 },
  'Йети':            { effect: 'slow',   chance: 0.30 },
  'Рыцарь льда':     { effect: 'slow',   chance: 0.25 },
  'Маг льда':        { effect: 'slow',   chance: 0.40 },
  'Призрак':         { effect: 'slow',   chance: 0.30 },
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

// ── Progression constants ─────────────────────────────────────────────────────
export const BASE_XP_PER_LEVEL     = 100;
export const STAT_POINTS_PER_LEVEL = 3;

// ── Attack timing constants ───────────────────────────────────────────────────
export const BASE_ATTACK_INTERVAL = 1500;
export const MIN_ATTACK_INTERVAL  = 500;

// ── Enemy kill reward table ───────────────────────────────────────────────────
export const REWARD_TABLE: Record<string, { xp: number; goldMin: number; goldMax: number }> = {
  'Крыса':           { xp: 12,  goldMin: 2,  goldMax: 5  },
  'Кролик':          { xp: 8,   goldMin: 1,  goldMax: 3  },
  'Молодой кабан':   { xp: 28,  goldMin: 5,  goldMax: 10 },
  'Полевая змея':    { xp: 35,  goldMin: 6,  goldMax: 12 },
  'Ворон':           { xp: 18,  goldMin: 3,  goldMax: 7  },
  'Огромный Кабан':  { xp: 120, goldMin: 30, goldMax: 50 },
  'Гоблин':          { xp: 25,  goldMin: 5,  goldMax: 10 },
  'Волк':            { xp: 20,  goldMin: 3,  goldMax: 7  },
  'Бандит':          { xp: 55,  goldMin: 12, goldMax: 22 },
  'Альфа-волк':      { xp: 85,  goldMin: 18, goldMax: 30 },
  'Летучая мышь':    { xp: 40,  goldMin: 8,  goldMax: 15 },
  'Ледяной волк':    { xp: 70,  goldMin: 15, goldMax: 28 },
  'Снежный паук':    { xp: 75,  goldMin: 16, goldMax: 28 },
  'Йети':            { xp: 110, goldMin: 25, goldMax: 40 },
  'Разбойник':       { xp: 65,  goldMin: 14, goldMax: 25 },
  'Лучник':          { xp: 70,  goldMin: 15, goldMax: 26 },
  'Наёмник':         { xp: 90,  goldMin: 20, goldMax: 35 },
  'Скелет':          { xp: 50,  goldMin: 10, goldMax: 18 },
  'Зомби':           { xp: 80,  goldMin: 20, goldMax: 35 },
  'Призрак':         { xp: 100, goldMin: 22, goldMax: 38 },
  'Слизень':         { xp: 95,  goldMin: 18, goldMax: 32 },
  'Болотник':        { xp: 120, goldMin: 25, goldMax: 42 },
  'Ядовитый паук':   { xp: 110, goldMin: 22, goldMax: 38 },
  'Голем':           { xp: 150, goldMin: 30, goldMax: 50 },
  'Шахтёр-зомби':    { xp: 130, goldMin: 28, goldMax: 45 },
  'Горный тролль':   { xp: 180, goldMin: 35, goldMax: 55 },
  'Гарпия':          { xp: 160, goldMin: 32, goldMax: 50 },
  'Рыцарь льда':     { xp: 220, goldMin: 45, goldMax: 70 },
  'Маг льда':        { xp: 200, goldMin: 40, goldMax: 65 },
  // legacy
  'Орк':             { xp: 60,  goldMin: 15, goldMax: 25 },
  'Кабан':           { xp: 35,  goldMin: 6,  goldMax: 12 },
  'Гигантский паук': { xp: 45,  goldMin: 8,  goldMax: 15 },
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
  const defs: Record<LocationId, Array<Omit<Enemy, 'id' | 'baseMaxHp' | 'rarity'>>> = {
    village: [],
    forest: [
      { name: 'Крыса',         emoji: '🐀', x: 5,  y: 2,  hp: 60,  maxHp: 60,  attackInterval: 1600, dmgMin: 2,  dmgMax: 6,  dead: false },
      { name: 'Крыса',         emoji: '🐀', x: 14, y: 5,  hp: 60,  maxHp: 60,  attackInterval: 1600, dmgMin: 2,  dmgMax: 6,  dead: false },
      { name: 'Кролик',        emoji: '🐇', x: 8,  y: 8,  hp: 40,  maxHp: 40,  attackInterval: 2000, dmgMin: 1,  dmgMax: 3,  dead: false },
      { name: 'Ворон',         emoji: '🐦', x: 16, y: 4,  hp: 80,  maxHp: 80,  attackInterval: 1200, dmgMin: 3,  dmgMax: 7,  dead: false },
      { name: 'Молодой кабан', emoji: '🐗', x: 8,  y: 13, hp: 140, maxHp: 140, attackInterval: 2400, dmgMin: 6,  dmgMax: 12, dead: false },
      { name: 'Полевая змея',  emoji: '🐍', x: 16, y: 14, hp: 110, maxHp: 110, attackInterval: 1800, dmgMin: 5,  dmgMax: 11, dead: false },
      { name: 'Молодой кабан', emoji: '🐗', x: 4,  y: 17, hp: 140, maxHp: 140, attackInterval: 2400, dmgMin: 6,  dmgMax: 12, dead: false },
    ],
    darkforest: [
      { name: 'Гоблин', emoji: '👺', x: 5,  y: 3,  hp: 160, maxHp: 160, attackInterval: 2100, dmgMin: 6,  dmgMax: 13, dead: false },
      { name: 'Гоблин', emoji: '👺', x: 14, y: 4,  hp: 160, maxHp: 160, attackInterval: 2100, dmgMin: 6,  dmgMax: 13, dead: false },
      { name: 'Волк',   emoji: '🐺', x: 8,  y: 10, hp: 120, maxHp: 120, attackInterval: 900,  dmgMin: 4,  dmgMax: 10, dead: false },
      { name: 'Волк',   emoji: '🐺', x: 15, y: 12, hp: 120, maxHp: 120, attackInterval: 900,  dmgMin: 4,  dmgMax: 10, dead: false },
      { name: 'Бандит', emoji: '🥷', x: 6,  y: 15, hp: 200, maxHp: 200, attackInterval: 1700, dmgMin: 10, dmgMax: 18, dead: false },
      { name: 'Бандит', emoji: '🥷', x: 12, y: 16, hp: 200, maxHp: 200, attackInterval: 1700, dmgMin: 10, dmgMax: 18, dead: false },
    ],
    wolfcave: [
      { name: 'Волк',         emoji: '🐺', x: 5,  y: 4,  hp: 150, maxHp: 150, attackInterval: 950,  dmgMin: 6,  dmgMax: 12, dead: false },
      { name: 'Волк',         emoji: '🐺', x: 14, y: 5,  hp: 150, maxHp: 150, attackInterval: 950,  dmgMin: 6,  dmgMax: 12, dead: false },
      { name: 'Летучая мышь', emoji: '🦇', x: 8,  y: 8,  hp: 100, maxHp: 100, attackInterval: 800,  dmgMin: 5,  dmgMax: 11, dead: false },
      { name: 'Летучая мышь', emoji: '🦇', x: 15, y: 12, hp: 100, maxHp: 100, attackInterval: 800,  dmgMin: 5,  dmgMax: 11, dead: false },
      { name: 'Альфа-волк',   emoji: '🐺', x: 10, y: 15, hp: 320, maxHp: 320, attackInterval: 1400, dmgMin: 14, dmgMax: 24, dead: false },
    ],
    mountains: [
      { name: 'Ледяной волк', emoji: '🐺', x: 5,  y: 4,  hp: 250, maxHp: 250, attackInterval: 1100, dmgMin: 12, dmgMax: 20, dead: false },
      { name: 'Ледяной волк', emoji: '🐺', x: 14, y: 5,  hp: 250, maxHp: 250, attackInterval: 1100, dmgMin: 12, dmgMax: 20, dead: false },
      { name: 'Снежный паук', emoji: '🕷️', x: 8,  y: 9,  hp: 220, maxHp: 220, attackInterval: 1300, dmgMin: 10, dmgMax: 18, dead: false },
      { name: 'Йети',         emoji: '👹', x: 10, y: 14, hp: 450, maxHp: 450, attackInterval: 3200, dmgMin: 20, dmgMax: 32, dead: false },
      { name: 'Ледяной волк', emoji: '🐺', x: 4,  y: 16, hp: 250, maxHp: 250, attackInterval: 1100, dmgMin: 12, dmgMax: 20, dead: false },
    ],
    road: [
      { name: 'Разбойник', emoji: '🗡️', x: 5,  y: 5,  hp: 220, maxHp: 220, attackInterval: 1800, dmgMin: 12, dmgMax: 20, dead: false },
      { name: 'Лучник',    emoji: '🏹', x: 14, y: 4,  hp: 180, maxHp: 180, attackInterval: 1500, dmgMin: 14, dmgMax: 22, dead: false },
      { name: 'Разбойник', emoji: '🗡️', x: 8,  y: 12, hp: 220, maxHp: 220, attackInterval: 1800, dmgMin: 12, dmgMax: 20, dead: false },
      { name: 'Наёмник',   emoji: '⚔️', x: 15, y: 14, hp: 300, maxHp: 300, attackInterval: 2000, dmgMin: 16, dmgMax: 28, dead: false },
      { name: 'Лучник',    emoji: '🏹', x: 4,  y: 16, hp: 180, maxHp: 180, attackInterval: 1500, dmgMin: 14, dmgMax: 22, dead: false },
    ],
    ruins: [
      { name: 'Скелет',  emoji: '💀', x: 4,  y: 6,  hp: 200, maxHp: 200, attackInterval: 1800, dmgMin: 12, dmgMax: 20, dead: false },
      { name: 'Зомби',   emoji: '🧟', x: 14, y: 5,  hp: 350, maxHp: 350, attackInterval: 4000, dmgMin: 18, dmgMax: 28, dead: false },
      { name: 'Призрак', emoji: '👻', x: 10, y: 10, hp: 280, maxHp: 280, attackInterval: 1600, dmgMin: 15, dmgMax: 25, dead: false },
      { name: 'Скелет',  emoji: '💀', x: 7,  y: 14, hp: 200, maxHp: 200, attackInterval: 1800, dmgMin: 12, dmgMax: 20, dead: false },
      { name: 'Зомби',   emoji: '🧟', x: 16, y: 16, hp: 350, maxHp: 350, attackInterval: 4000, dmgMin: 18, dmgMax: 28, dead: false },
    ],
    swamp: [
      { name: 'Слизень',       emoji: '🟢', x: 4,  y: 5,  hp: 280, maxHp: 280, attackInterval: 2500, dmgMin: 12, dmgMax: 20, dead: false },
      { name: 'Ядовитый паук', emoji: '🕷️', x: 14, y: 6,  hp: 240, maxHp: 240, attackInterval: 1400, dmgMin: 14, dmgMax: 22, dead: false },
      { name: 'Болотник',      emoji: '🐸', x: 8,  y: 12, hp: 380, maxHp: 380, attackInterval: 2800, dmgMin: 18, dmgMax: 28, dead: false },
      { name: 'Слизень',       emoji: '🟢', x: 15, y: 15, hp: 280, maxHp: 280, attackInterval: 2500, dmgMin: 12, dmgMax: 20, dead: false },
    ],
    mine: [
      { name: 'Летучая мышь', emoji: '🦇', x: 5,  y: 3,  hp: 180, maxHp: 180, attackInterval: 900,  dmgMin: 10, dmgMax: 18, dead: false },
      { name: 'Шахтёр-зомби', emoji: '🧟', x: 12, y: 5,  hp: 400, maxHp: 400, attackInterval: 3000, dmgMin: 20, dmgMax: 30, dead: false },
      { name: 'Голем',        emoji: '🗿', x: 8,  y: 11, hp: 550, maxHp: 550, attackInterval: 4000, dmgMin: 25, dmgMax: 38, dead: false },
      { name: 'Летучая мышь', emoji: '🦇', x: 15, y: 14, hp: 180, maxHp: 180, attackInterval: 900,  dmgMin: 10, dmgMax: 18, dead: false },
      { name: 'Шахтёр-зомби', emoji: '🧟', x: 4,  y: 16, hp: 400, maxHp: 400, attackInterval: 3000, dmgMin: 20, dmgMax: 30, dead: false },
    ],
    pass: [
      { name: 'Горный тролль', emoji: '👾', x: 6,  y: 5,  hp: 600, maxHp: 600, attackInterval: 3800, dmgMin: 28, dmgMax: 42, dead: false },
      { name: 'Гарпия',        emoji: '🦅', x: 14, y: 4,  hp: 320, maxHp: 320, attackInterval: 1200, dmgMin: 18, dmgMax: 28, dead: false },
      { name: 'Голем',         emoji: '🗿', x: 10, y: 11, hp: 550, maxHp: 550, attackInterval: 4000, dmgMin: 25, dmgMax: 38, dead: false },
      { name: 'Гарпия',        emoji: '🦅', x: 5,  y: 15, hp: 320, maxHp: 320, attackInterval: 1200, dmgMin: 18, dmgMax: 28, dead: false },
      { name: 'Горный тролль', emoji: '👾', x: 15, y: 16, hp: 600, maxHp: 600, attackInterval: 3800, dmgMin: 28, dmgMax: 42, dead: false },
    ],
    icefort: [
      { name: 'Рыцарь льда', emoji: '🛡️', x: 6,  y: 6,  hp: 700, maxHp: 700, attackInterval: 2500, dmgMin: 30, dmgMax: 45, dead: false },
      { name: 'Маг льда',    emoji: '❄️', x: 14, y: 5,  hp: 450, maxHp: 450, attackInterval: 1800, dmgMin: 28, dmgMax: 42, dead: false },
      { name: 'Рыцарь льда', emoji: '🛡️', x: 10, y: 12, hp: 700, maxHp: 700, attackInterval: 2500, dmgMin: 30, dmgMax: 45, dead: false },
      { name: 'Маг льда',    emoji: '❄️', x: 5,  y: 15, hp: 450, maxHp: 450, attackInterval: 1800, dmgMin: 28, dmgMax: 42, dead: false },
    ],
  };
  return defs[loc].map((d, i) => {
    const rarity = rollEnemyRarity();
    const maxHp  = Math.round(d.maxHp * ENEMY_RARITY_DEFS[rarity].hpMult);
    return { ...d, id: i + 1, baseMaxHp: d.maxHp, maxHp, hp: maxHp, rarity, resistances: ENEMY_RESISTANCES[d.name] };
  });
};

/** Elemental resist/weakness examples — % positive = resist, negative = weakness (extra damage taken). */
const ENEMY_RESISTANCES: Record<string, Partial<Record<DamageType, number>>> = {
  'Тролль':        { fire: -50 },
  'Горный тролль': { fire: -40 },
  'Зомби':         { electric: -30 },
  'Шахтёр-зомби':  { electric: -25 },
  'Ледяной волк':  { fire: -25, ice: 40 },
  'Снежный паук':  { fire: -20, ice: 30 },
  'Йети':          { fire: -40, ice: 50 },
  'Рыцарь льда':   { fire: -30, ice: 60 },
  'Маг льда':      { fire: -35, ice: 50 },
  'Голем':         { physical: 20, fire: -15 },
  'Призрак':       { physical: 30, electric: -20 },
};
