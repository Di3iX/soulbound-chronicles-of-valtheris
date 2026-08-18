/**
 * Sprite registry — PNG when present, emoji fallback otherwise.
 * Path: src/game/ui/sprites.ts
 *
 * Drop files into: public/assets/sprites/
 * See ASSETS_README.md for the full name list.
 */

export const SPRITE_BASE = '/assets/sprites';

/** Terrain by tile type (0–4). Optional biome suffix later. */
export const TILE_SPRITES: Record<number, { file: string; emoji: string; label: string }> = {
  0: { file: 'tiles/grass.png', emoji: '', label: 'Трава' },
  1: { file: 'tiles/tree.png', emoji: '🌲', label: 'Дерево' },
  2: { file: 'tiles/rock.png', emoji: '🪨', label: 'Камень' },
  3: { file: 'tiles/water.png', emoji: '🌊', label: 'Вода' },
  4: { file: 'tiles/path.png', emoji: '🚪', label: 'Переход' },
};

/** Cave walls use rock tile visually */
export const TILE_SPRITES_CAVE: Record<number, { file: string; emoji: string; label: string }> = {
  0: { file: 'tiles/cave_floor.png', emoji: '', label: 'Пол' },
  1: { file: 'tiles/cave_wall.png', emoji: '⬛', label: 'Стена' },
  2: { file: 'tiles/rock.png', emoji: '🪨', label: 'Камень' },
  3: { file: 'tiles/water.png', emoji: '🌊', label: 'Вода' },
  4: { file: 'tiles/path.png', emoji: '🚪', label: 'Выход' },
};

export const UNIT_SPRITES: Record<string, { file: string; emoji: string }> = {
  player_warrior: { file: 'units/player_warrior.png', emoji: '⚔️' },
  player_ranger:  { file: 'units/player_ranger.png', emoji: '🏹' },
  player_mage:    { file: 'units/player_mage.png', emoji: '🔮' },
  player_acolyte: { file: 'units/player_acolyte.png', emoji: '✨' },

  'Крыса':          { file: 'units/rat.png', emoji: '🐀' },
  'Кролик':         { file: 'units/rabbit.png', emoji: '🐇' },
  'Ворон':          { file: 'units/raven.png', emoji: '🐦' },
  'Молодой кабан':  { file: 'units/boar.png', emoji: '🐗' },
  'Полевая змея':   { file: 'units/snake.png', emoji: '🐍' },
  'Огромный Кабан': { file: 'units/boar_boss.png', emoji: '🐗' },
  'Волк':           { file: 'units/wolf.png', emoji: '🐺' },
  'Гоблин':         { file: 'units/goblin.png', emoji: '👺' },
  'Бандит':         { file: 'units/bandit.png', emoji: '🥷' },
  'Летучая мышь':  { file: 'units/bat.png', emoji: '🦇' },
  'Альфа-волк':     { file: 'units/wolf_alpha.png', emoji: '🐺' },
  'Главарь гоблинов': { file: 'units/goblin_chief.png', emoji: '👺' },
  'Скелет':         { file: 'units/skeleton.png', emoji: '💀' },
  'Зомби':          { file: 'units/zombie.png', emoji: '🧟' },
  'Призрак':        { file: 'units/ghost.png', emoji: '👻' },
  'Паук':           { file: 'units/spider.png', emoji: '🕷️' },
  'Йети':           { file: 'units/yeti.png', emoji: '👹' },
};

export const OBJECT_SPRITES: Record<string, { file: string; emoji: string }> = {
  chest:        { file: 'objects/chest.png', emoji: '📦' },
  chest_open:   { file: 'objects/chest_open.png', emoji: '📭' },
  npc_elder:    { file: 'units/npc_elder.png', emoji: '👴' },
  npc_farmer:   { file: 'units/npc_farmer.png', emoji: '👨' },
  npc_hunter:   { file: 'units/npc_hunter.png', emoji: '🏹' },
  portal:       { file: 'objects/portal.png', emoji: '🌀' },
};

/** Resolved URL for a relative sprite path under public/ */
export function spriteUrl(relative: string): string {
  return `${SPRITE_BASE}/${relative.replace(/^\//, '')}`;
}
