/**
 * Sprite registry — matches sprites_64x64_v2 pack + emoji fallback.
 * Path: src/game/ui/sprites.ts
 *
 * Files live in: public/assets/sprites/units/
 * Pack has: hero_* and goblin_* (IDLE/WALK/ATTACK/HIT/DEATH × DOWN/LEFT/RIGHT/UP)
 */

export const SPRITE_BASE = '/assets/sprites';

export type Dir = 'DOWN' | 'LEFT' | 'RIGHT' | 'UP';
export type Anim = 'IDLE' | 'WALK' | 'ATTACK' | 'HIT' | 'DEATH';

/** Terrain — pack has no tiles yet → emoji / CSS only */
export const TILE_SPRITES: Record<number, { file: string; emoji: string; label: string }> = {
  0: { file: '', emoji: '', label: 'Трава' },
  1: { file: '', emoji: '🌲', label: 'Дерево' },
  2: { file: '', emoji: '🪨', label: 'Камень' },
  3: { file: '', emoji: '🌊', label: 'Вода' },
  4: { file: '', emoji: '🚪', label: 'Переход' },
};

export const TILE_SPRITES_CAVE: Record<number, { file: string; emoji: string; label: string }> = {
  0: { file: '', emoji: '', label: 'Пол' },
  1: { file: '', emoji: '⬛', label: 'Стена' },
  2: { file: '', emoji: '🪨', label: 'Камень' },
  3: { file: '', emoji: '🌊', label: 'Вода' },
  4: { file: '', emoji: '🚪', label: 'Выход' },
};

function unitFrame(prefix: string, anim: Anim = 'IDLE', dir: Dir = 'DOWN'): string {
  return `units/${prefix}_${anim}_${dir}.png`;
}

/** Player by class id → hero frames (one sheet for now) */
export const PLAYER_PREFIX = 'hero';

export function playerSpriteFile(
  _classId?: string | null,
  anim: Anim = 'IDLE',
  dir: Dir = 'DOWN',
): string {
  return unitFrame(PLAYER_PREFIX, anim, dir);
}

/**
 * Enemy name → sprite prefix in pack.
 * Only goblin is in v2; others fall back to emoji via empty file.
 */
export const ENEMY_PREFIX: Record<string, string> = {
  'Гоблин': 'goblin',
  'Главарь гоблинов': 'goblin',
};

export function enemySpriteFile(
  enemyName: string,
  anim: Anim = 'IDLE',
  dir: Dir = 'DOWN',
): string {
  const prefix = ENEMY_PREFIX[enemyName];
  if (!prefix) return '';
  return unitFrame(prefix, anim, dir);
}

/** Legacy flat map used by simple render (idle down) */
export const UNIT_SPRITES: Record<string, { file: string; emoji: string }> = {
  player_warrior: { file: unitFrame('hero'), emoji: '⚔️' },
  player_ranger:  { file: unitFrame('hero'), emoji: '🏹' },
  player_mage:    { file: unitFrame('hero'), emoji: '🔮' },
  player_acolyte: { file: unitFrame('hero'), emoji: '✨' },

  'Гоблин':           { file: unitFrame('goblin'), emoji: '👺' },
  'Главарь гоблинов': { file: unitFrame('goblin'), emoji: '👺' },

  // Not in pack v2 — emoji until next assets
  'Крыса':          { file: '', emoji: '🐀' },
  'Кролик':         { file: '', emoji: '🐇' },
  'Ворон':          { file: '', emoji: '🐦' },
  'Молодой кабан':  { file: '', emoji: '🐗' },
  'Полевая змея':   { file: '', emoji: '🐍' },
  'Огромный Кабан': { file: '', emoji: '🐗' },
  'Волк':           { file: '', emoji: '🐺' },
  'Бандит':         { file: '', emoji: '🥷' },
  'Летучая мышь':  { file: '', emoji: '🦇' },
  'Альфа-волк':     { file: '', emoji: '🐺' },
  'Скелет':         { file: '', emoji: '💀' },
  'Зомби':          { file: '', emoji: '🧟' },
  'Призрак':        { file: '', emoji: '👻' },
  'Паук':           { file: '', emoji: '🕷️' },
  'Йети':           { file: '', emoji: '👹' },
};

export const OBJECT_SPRITES: Record<string, { file: string; emoji: string }> = {
  chest:      { file: '', emoji: '📦' },
  chest_open: { file: '', emoji: '📭' },
  npc_elder:  { file: '', emoji: '👴' },
  npc_farmer: { file: '', emoji: '👨' },
  npc_hunter: { file: '', emoji: '🏹' },
  portal:     { file: '', emoji: '🌀' },
};

export function spriteUrl(relative: string): string {
  if (!relative) return '';
  return `${SPRITE_BASE}/${relative.replace(/^\//, '')}`;
}
