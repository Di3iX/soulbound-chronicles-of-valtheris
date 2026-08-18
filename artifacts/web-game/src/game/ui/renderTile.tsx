// ─── TILE RENDERING (sprites + emoji fallback) ───────────────────────────────
import type { ReactNode } from 'react';
import type { Enemy, LocationId } from '../../combat';
import { ENEMY_RARITY_DEFS } from '../../combat';
import { BOSS_ID } from '../../boss/boss';
import { LOCATION_EXITS, type NpcDef } from '../../world/locations';
import { type OpenedChests, getLocationChests } from '../../world/chests';
import Sprite from './Sprite';
import {
  TILE_SPRITES, TILE_SPRITES_CAVE, UNIT_SPRITES, OBJECT_SPRITES,
} from './sprites';

export interface RenderTileParams {
  gx: number;
  gy: number;
  tileType: number;
  playerPos: { x: number; y: number };
  livingEnemies: Enemy[];
  activeEnemyId: number | null;
  currentLocation: LocationId;
  currentNpcs: NpcDef[];
  openedChests: OpenedChests;
}

const CAVE_LOCS = new Set<LocationId>(['wolfcave', 'mine', 'icefort']);

function tileSet(loc: LocationId) {
  return CAVE_LOCS.has(loc) ? TILE_SPRITES_CAVE : TILE_SPRITES;
}

export function renderTileContent({
  gx, gy, tileType, playerPos, livingEnemies, activeEnemyId,
  currentLocation, currentNpcs, openedChests,
}: RenderTileParams): ReactNode {
  // ── Player ──
  if (gx === playerPos.x && gy === playerPos.y) {
    const spr = UNIT_SPRITES.player_warrior;
    return (
      <div className="w-full h-full tile-player rounded-sm flex items-center justify-center z-10 relative">
        <Sprite
          file={spr.file}
          emoji={spr.emoji}
          imgClassName="w-[85%] h-[85%]"
          className="text-[clamp(16px,3.5vw,24px)] drop-shadow-md"
        />
      </div>
    );
  }

  // ── Enemy ──
  const enemy = livingEnemies.find(e => e.x === gx && e.y === gy);
  if (enemy) {
    const bossLike =
      enemy.id === BOSS_ID ||
      (enemy as { isBoss?: boolean }).isBoss === true ||
      enemy.id >= 9000 ||
      enemy.name.includes('Огромный') ||
      enemy.name.includes('Главарь') ||
      enemy.name.includes('Альфа') ||
      (enemy as { isMiniBoss?: boolean }).isMiniBoss;

    const rarityDef = !bossLike && enemy.rarity !== 'common' ? ENEMY_RARITY_DEFS[enemy.rarity] : null;
    const active = enemy.id === activeEnemyId;
    const spr = UNIT_SPRITES[enemy.name] ?? { file: '', emoji: enemy.emoji };

    return (
      <div
        className={[
          'w-full h-full rounded-sm flex items-center justify-center z-10 relative',
          active ? 'tile-enemy' : 'tile-enemy-idle',
          bossLike ? 'ring-2 ring-red-500/70 ring-inset' : '',
        ].join(' ')}
        style={rarityDef ? { boxShadow: `inset 0 0 0 2px ${rarityDef.color}` } : undefined}
      >
        <Sprite
          file={spr.file}
          emoji={spr.emoji}
          imgClassName={bossLike ? 'w-[92%] h-[92%]' : 'w-[80%] h-[80%]'}
          className={bossLike ? 'text-[clamp(18px,4vw,28px)]' : 'text-[clamp(15px,3.2vw,22px)]'}
        />
        {bossLike && (
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] font-black text-red-400 whitespace-nowrap uppercase tracking-wider leading-none pointer-events-none drop-shadow">
            БОСС
          </span>
        )}
        {rarityDef && (enemy.rarity === 'elite' || enemy.rarity === 'legendary') && (
          <span className="absolute -top-1 -right-1 text-[10px] leading-none drop-shadow pointer-events-none">
            {rarityDef.emoji}
          </span>
        )}
      </div>
    );
  }

  // ── NPC ──
  const npc = currentNpcs.find(n => n.x === gx && n.y === gy);
  if (npc) {
    const key = `npc_${npc.id}` as keyof typeof OBJECT_SPRITES;
    const spr = OBJECT_SPRITES[key] ?? { file: '', emoji: npc.emoji };
    return (
      <div className="w-full h-full flex items-center justify-center z-10 relative">
        <Sprite file={spr.file} emoji={spr.emoji} imgClassName="w-[80%] h-[80%]" className="text-[clamp(14px,3vw,22px)]" />
      </div>
    );
  }

  // ── Chest ──
  const chestHere = getLocationChests(currentLocation, openedChests).find(c => c.x === gx && c.y === gy);
  if (chestHere) {
    const opened = openedChests[chestHere.id];
    const spr = opened ? OBJECT_SPRITES.chest_open : OBJECT_SPRITES.chest;
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <Sprite file={spr.file} emoji={spr.emoji} imgClassName="w-[70%] h-[70%]" className="text-[clamp(14px,3vw,20px)]" />
      </div>
    );
  }

  // ── Exit ──
  if (tileType === 4) {
    const exitDef = LOCATION_EXITS[currentLocation]?.get(`${gx},${gy}`);
    const dest = exitDef?.to;
    const spr = OBJECT_SPRITES.portal;
    return (
      <div className="w-full h-full tile-exit-cave rounded-sm flex items-center justify-center" title={dest ? `→ ${dest}` : 'Выход'}>
        <Sprite file={spr.file} emoji={dest === 'wolfcave' ? '🕳️' : '🚪'} imgClassName="w-[75%] h-[75%]" className="text-[clamp(14px,3vw,20px)]" />
      </div>
    );
  }

  // ── Solid / terrain decorations ──
  const set = tileSet(currentLocation);
  const t = set[tileType] ?? set[0];

  if (tileType === 1) {
    return (
      <div className="w-full h-full tile-tree flex items-center justify-center overflow-visible">
        <Sprite
          file={t.file}
          emoji={t.emoji}
          imgClassName="w-[110%] h-[110%] -mt-[10%] max-w-none"
          className="text-[clamp(14px,3vw,22px)]"
        />
      </div>
    );
  }
  if (tileType === 2) {
    return (
      <div className="w-full h-full tile-rock flex items-center justify-center">
        <Sprite file={t.file} emoji={t.emoji} imgClassName="w-[70%] h-[70%]" className="text-[clamp(12px,2.8vw,18px)]" />
      </div>
    );
  }
  if (tileType === 3) {
    return (
      <div className="w-full h-full tile-water flex items-center justify-center">
        <Sprite file={t.file} emoji={t.emoji || '🌊'} imgClassName="w-full h-full object-cover" className="text-[clamp(12px,2.8vw,18px)] opacity-80" />
      </div>
    );
  }

  // Grass / floor — optional sprite, usually CSS background is enough
  if (t.file && tileType === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center opacity-90">
        <Sprite file={t.file} emoji="" imgClassName="w-full h-full object-cover" />
      </div>
    );
  }

  return null;
}
