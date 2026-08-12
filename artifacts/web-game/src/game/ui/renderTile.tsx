// ─── TILE RENDERING ───────────────────────────────────────────────────────────
// Extracted from App.tsx: a pure function that decides what a single map tile
// looks like (player / enemy / NPC / chest / themed exit / terrain), given the
// current game state. No refs, no state, no side effects.
import type { ReactNode } from 'react';
import type { Enemy, LocationId } from '../../combat';
import { ENEMY_RARITY_DEFS } from '../../combat';
import { BOSS_ID } from '../../boss/boss';
import { LOCATION_EXITS, type NpcDef } from '../../world/locations';
import { type OpenedChests, getLocationChests } from '../../world/chests';

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

export function renderTileContent({
  gx, gy, tileType, playerPos, livingEnemies, activeEnemyId, currentLocation, currentNpcs, openedChests,
}: RenderTileParams): ReactNode {
  if (gx === playerPos.x && gy === playerPos.y)
    return <div className="w-full h-full tile-player rounded flex items-center justify-center text-lg z-10 relative">🧝</div>;

  const enemy = livingEnemies.find(e => e.x === gx && e.y === gy);
  if (enemy) {
    const isBoss = enemy.id === BOSS_ID;
    const rarityDef = !isBoss && enemy.rarity !== 'common' ? ENEMY_RARITY_DEFS[enemy.rarity] : null;
    return (
      <div className={[
        'w-full h-full rounded flex items-center justify-center z-10 relative',
        isBoss ? 'text-2xl' : 'text-lg',
        enemy.id === activeEnemyId ? 'tile-enemy' : 'tile-enemy-idle',
        isBoss ? 'ring-2 ring-red-600/60 ring-inset' : '',
      ].join(' ')}
        style={rarityDef ? { boxShadow: `inset 0 0 0 2px ${rarityDef.color}` } : undefined}>
        {enemy.emoji}
        {isBoss && (
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

  const npc = currentNpcs.find(n => n.x === gx && n.y === gy);
  if (npc) return <div className="w-full h-full tile-npc flex items-center justify-center text-sm">{npc.emoji}</div>;

  const chestHere = getLocationChests(currentLocation, openedChests).find(c => c.x === gx && c.y === gy);
  if (chestHere) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm" title={chestHere.opened ? 'Пустой сундук' : 'Сундук'}>
        {chestHere.opened ? '📭' : '📦'}
      </div>
    );
  }

  if (tileType === 4) {
    // Look up which destination this exit leads to, then render themed tile.
    const exitDef = LOCATION_EXITS[currentLocation]?.get(`${gx},${gy}`);
    const dest    = exitDef?.to;
    const src     = currentLocation;
    // Dirt road: Village ↔ Forest
    if ((src === 'village' && dest === 'forest') || (src === 'forest' && dest === 'village'))
      return <div className="w-full h-full tile-exit-road  flex items-center justify-center text-sm" title="Дорога в лес">🛤️</div>;
    // Cave entrance / exit: Forest ↔ Wolfcave
    if (src === 'forest' && dest === 'wolfcave')
      return <div className="w-full h-full tile-exit-cave  flex items-center justify-center text-sm" title="Вход в пещеру">🕳️</div>;
    if (src === 'wolfcave' && dest === 'forest')
      return <div className="w-full h-full tile-exit-cave  flex items-center justify-center text-sm" title="Выход из пещеры">⛰️</div>;
    // Stone stairs / ruined gate: Wolfcave ↔ Ruins
    if (src === 'wolfcave' && dest === 'ruins')
      return <div className="w-full h-full tile-exit-ruins flex items-center justify-center text-sm" title="Врата руин">🏛️</div>;
    if (src === 'ruins' && dest === 'wolfcave')
      return <div className="w-full h-full tile-exit-ruins flex items-center justify-center text-sm" title="Разрушенная лестница">🪜</div>;
    // Wooden bridge / muddy path: Forest ↔ Swamp
    if ((src === 'forest' && dest === 'swamp') || (src === 'swamp' && dest === 'forest'))
      return <div className="w-full h-full tile-exit-bridge flex items-center justify-center text-sm" title="Мост в болото">🌉</div>;
    // Fallback — should never be reached with current map data
    return <div className="w-full h-full tile-exit flex items-center justify-center text-sm">🚪</div>;
  }
  if (tileType === 1) return <div className="w-full h-full tile-tree  flex items-center justify-center text-sm">🌲</div>;
  if (tileType === 2) return <div className="w-full h-full tile-rock  flex items-center justify-center text-sm">🪨</div>;
  if (tileType === 3) return <div className="w-full h-full tile-water flex items-center justify-center text-blue-400 text-xs font-bold tracking-tighter opacity-80">〰</div>;
  return <div className="w-full h-full tile-grass" />;
}
