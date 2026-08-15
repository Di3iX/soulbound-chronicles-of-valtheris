// ─── TILE RENDERING (visual polish pass) ─────────────────────────────────────
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

function emoji(cls: string, symbol: string, title?: string) {
  return (
    <div
      className={`w-full h-full flex items-center justify-center tile-emoji ${cls}`}
      title={title}
    >
      <span className="text-[clamp(14px,3.2vw,22px)] leading-none">{symbol}</span>
    </div>
  );
}

export function renderTileContent({
  gx, gy, tileType, playerPos, livingEnemies, activeEnemyId,
  currentLocation, currentNpcs, openedChests,
}: RenderTileParams): ReactNode {
  if (gx === playerPos.x && gy === playerPos.y) {
    return (
      <div className="w-full h-full tile-player rounded-sm flex items-center justify-center z-10 relative">
        <span className="tile-emoji text-[clamp(16px,3.5vw,24px)] drop-shadow-md">🧝</span>
      </div>
    );
  }

  const enemy = livingEnemies.find(e => e.x === gx && e.y === gy);
  if (enemy) {
    const isBoss = enemy.id === BOSS_ID || (enemy as { isBoss?: boolean }).isBoss === true
      || (enemy.maxHp >= 200 && enemy.name.toLowerCase().includes('босс'))
      || enemy.id >= 9000;
    // Prefer config id when available — BOSS_ID alone may not cover all bosses
    const bossLike = isBoss || enemy.name.includes('Огромный') || enemy.name.includes('Главарь')
      || enemy.name.includes('Альфа') || (enemy as { isMiniBoss?: boolean }).isMiniBoss;

    const rarityDef = !bossLike && enemy.rarity !== 'common' ? ENEMY_RARITY_DEFS[enemy.rarity] : null;
    const active = enemy.id === activeEnemyId;

    return (
      <div
        className={[
          'w-full h-full rounded-sm flex items-center justify-center z-10 relative',
          active ? 'tile-enemy' : 'tile-enemy-idle',
          bossLike ? 'ring-2 ring-red-500/70 ring-inset' : '',
        ].join(' ')}
        style={rarityDef ? { boxShadow: `inset 0 0 0 2px ${rarityDef.color}` } : undefined}
      >
        <span className={`tile-emoji leading-none ${bossLike ? 'text-[clamp(18px,4vw,28px)]' : 'text-[clamp(15px,3.2vw,22px)]'}`}>
          {enemy.emoji}
        </span>
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

  const npc = currentNpcs.find(n => n.x === gx && n.y === gy);
  if (npc) {
    return (
      <div className="w-full h-full tile-npc rounded-sm flex items-center justify-center" title={npc.name}>
        <span className="tile-emoji text-[clamp(14px,3vw,20px)]">{npc.emoji}</span>
      </div>
    );
  }

  const chestHere = getLocationChests(currentLocation, openedChests).find(c => c.x === gx && c.y === gy);
  if (chestHere) {
    return (
      <div
        className="w-full h-full tile-chest flex items-center justify-center"
        title={chestHere.opened ? 'Пустой сундук' : 'Сундук'}
      >
        <span className={`tile-emoji text-[clamp(14px,3vw,20px)] ${chestHere.opened ? 'opacity-50' : 'animate-pulse'}`}>
          {chestHere.opened ? '📭' : '📦'}
        </span>
      </div>
    );
  }

  if (tileType === 4) {
    const exitDef = LOCATION_EXITS[currentLocation]?.get(`${gx},${gy}`);
    const dest = exitDef?.to;
    const src = currentLocation;
    if ((src === 'village' && dest === 'forest') || (src === 'forest' && dest === 'village'))
      return emoji('tile-exit-road rounded-sm', '🛤️', 'Дорога');
    if ((src === 'forest' || src === 'darkforest') && dest === 'wolfcave')
      return emoji('tile-exit-cave rounded-sm', '🕳️', 'Вход в пещеру');
    if (src === 'wolfcave' && (dest === 'forest' || dest === 'darkforest'))
      return emoji('tile-exit-cave rounded-sm', '🚪', 'Выход из пещеры');
    if (src === 'wolfcave' && dest === 'ruins')
      return emoji('tile-exit-ruins rounded-sm', '🏛️', 'Врата руин');
    if (src === 'ruins' && dest === 'wolfcave')
      return emoji('tile-exit-ruins rounded-sm', '🪜', 'Лестница');
    if ((src === 'forest' && dest === 'swamp') || (src === 'swamp' && dest === 'forest'))
      return emoji('tile-exit-bridge rounded-sm', '🌉', 'Мост');
    return emoji('tile-exit rounded-sm', '🚪', 'Переход');
  }

  // Type 1 = solid: trees outdoors, cave walls underground
  const isCave = currentLocation === 'wolfcave' || currentLocation === 'mine' || currentLocation === 'icefort';
  if (tileType === 1) {
    if (isCave) {
      return (
        <div className="w-full h-full tile-rock flex items-center justify-center">
          <span className="tile-emoji text-[clamp(12px,2.8vw,18px)] opacity-70">⬛</span>
        </div>
      );
    }
    return emoji('tile-tree', '🌲');
  }
  if (tileType === 2) return emoji('tile-rock', '🪨');
  if (tileType === 3) {
    return (
      <div className="w-full h-full tile-water flex items-center justify-center">
        <span className="tile-emoji text-blue-300/80 text-[clamp(10px,2.5vw,16px)] opacity-90">〰</span>
      </div>
    );
  }

  // Checker-ish grass for depth without noise images
  const alt = (gx + gy) % 2 === 0;
  return <div className={`w-full h-full ${alt ? 'tile-grass' : 'tile-grass-alt'}`} />;
}
