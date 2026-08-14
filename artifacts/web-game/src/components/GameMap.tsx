import React from 'react';
import { VP_COLS, VP_ROWS, ExploredTiles } from '../world/locations';
import { Enemy, LocationId } from '../combat';
import { FloatingNum } from '../types/ui';
import Minimap from './Minimap';

interface GameMapProps {
  camCol: number;
  camRow: number;
  currentMap: number[][];
  renderTileContent: (gx: number, gy: number, tileType: number) => React.ReactNode;

  phase: string;
  playerHp: number;
  playerMaxHp: number;
  playerPos: { x: number; y: number };
  activeEnemy: Enemy | null;
  enemies: Enemy[];
  bossId: number;

  floatingNums: FloatingNum[];
  bossAppearNotif: boolean;

  transitioning: boolean;
  currentLocation: LocationId;
  locationEmoji: string;

  exploredTiles: ExploredTiles;
  minimapVisible: boolean;
  onToggleMinimap: () => void;
}

export default function GameMap({
  camCol, camRow, currentMap, renderTileContent,
  phase, playerHp, playerMaxHp, playerPos, activeEnemy, enemies, bossId,
  floatingNums, bossAppearNotif,
  transitioning, currentLocation, locationEmoji,
  exploredTiles, minimapVisible, onToggleMinimap,
}: GameMapProps) {
  const locClass = `loc-${String(currentLocation)}`;

  return (
    <>
      <div
        className={`absolute inset-0 grid grid-cols-10 grid-rows-10 gap-px bg-[#0a0a0e] p-px border border-white/5 rounded-lg map-viewport overflow-hidden ${locClass}`}
      >
        {Array.from({ length: VP_ROWS }, (_, vr) =>
          Array.from({ length: VP_COLS }, (_, vc) => {
            const gx = camCol + vc;
            const gy = camRow + vr;
            const tileType = currentMap[gy]?.[gx] ?? 1;
            return (
              <div key={`${gx}-${gy}`} className="tile-cell relative bg-map-bg">
                {renderTileContent(gx, gy, tileType)}
              </div>
            );
          })
        )}
      </div>

      {phase !== 'combat' && (
        <Minimap
          currentMap={currentMap}
          exploredTiles={exploredTiles[currentLocation]}
          playerPos={playerPos}
          camCol={camCol}
          camRow={camRow}
          visible={minimapVisible}
          onToggle={onToggleMinimap}
        />
      )}

      {phase === 'combat' && playerHp > 0 && (
        <div
          className="absolute pointer-events-none z-20 flex justify-center"
          style={{
            top: `${((playerPos.y - camRow) / VP_ROWS) * 100}%`,
            left: `${((playerPos.x - camCol) / VP_COLS) * 100}%`,
            width: `${(1 / VP_COLS) * 100}%`,
            height: `${(1 / VP_ROWS) * 100}%`,
            marginTop: '-7px',
          }}
        >
          <div className="w-[82%] h-[5px] bg-black/80 border border-black/80 rounded-full overflow-hidden shadow-sm">
            <div
              className="h-full hp-bar-fill transition-all duration-200"
              style={{ width: `${Math.round((playerHp / playerMaxHp) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {phase === 'combat' && activeEnemy && activeEnemy.hp > 0
        && activeEnemy.x >= camCol && activeEnemy.x < camCol + VP_COLS
        && activeEnemy.y >= camRow && activeEnemy.y < camRow + VP_ROWS && (
        activeEnemy.id === bossId || activeEnemy.maxHp >= 300 ? (
          <div
            className="absolute pointer-events-none z-20 flex flex-col items-center"
            style={{
              top: `${((activeEnemy.y - camRow) / VP_ROWS) * 100}%`,
              left: `${Math.max(0, (activeEnemy.x - camCol - 1) / VP_COLS) * 100}%`,
              width: `${(3 / VP_COLS) * 100}%`,
              marginTop: '-22px',
            }}
          >
            <span className="text-[8px] font-black text-red-400 uppercase tracking-wide mb-[2px] leading-none drop-shadow-md">
              {activeEnemy.emoji} {activeEnemy.name}
            </span>
            <div className="w-full h-[6px] bg-black/85 border border-red-900/70 rounded-full overflow-hidden shadow-[0_0_6px_rgba(220,38,38,0.45)]">
              <div
                className="h-full hp-bar-boss transition-all duration-300"
                style={{ width: `${Math.round((activeEnemy.hp / activeEnemy.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div
            className="absolute pointer-events-none z-20 flex justify-center"
            style={{
              top: `${((activeEnemy.y - camRow) / VP_ROWS) * 100}%`,
              left: `${((activeEnemy.x - camCol) / VP_COLS) * 100}%`,
              width: `${(1 / VP_COLS) * 100}%`,
              height: `${(1 / VP_ROWS) * 100}%`,
              marginTop: '-7px',
            }}
          >
            <div className="w-[82%] h-[5px] bg-black/80 border border-black/80 rounded-full overflow-hidden">
              <div
                className="h-full hp-bar-enemy transition-all duration-200"
                style={{ width: `${Math.round((activeEnemy.hp / activeEnemy.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        )
      )}

      {floatingNums
        .filter(n => n.col >= camCol && n.col < camCol + VP_COLS && n.row >= camRow && n.row < camRow + VP_ROWS)
        .map(num => (
          <div
            key={num.id}
            className="absolute pointer-events-none z-30 text-center animate-float w-[10%] h-[10%] flex items-center justify-center text-sm sm:text-base"
            style={{
              top: `${((num.row - camRow) / VP_ROWS) * 100}%`,
              left: `${((num.col - camCol) / VP_COLS) * 100}%`,
              color:
                num.type === 'player-dmg' ? '#f87171'
                : num.type === 'heal' ? '#4ade80'
                : num.type === 'gold' ? '#facc15'
                : num.type === 'loot' ? '#c084fc'
                : num.type === 'xp' ? '#60a5fa'
                : num.type === 'level' ? '#f472b6'
                : '#fbbf24',
            }}
          >
            {num.value}
          </div>
        ))}

      {bossAppearNotif && (
        <div className="absolute inset-x-0 z-[55] flex justify-center pointer-events-none" style={{ top: '26%' }}>
          <div className="panel-glass border-2 border-red-600/80 rounded-xl px-6 py-4 mx-4 text-center shadow-[0_0_30px_rgba(220,38,38,0.4)] animate-in fade-in duration-300">
            <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mb-1">⚔️ Появился босс</p>
            <p className="text-white text-lg font-black tracking-wide">Опасный противник</p>
            <p className="text-red-300/70 text-[10px] mt-1">Нажми на него, чтобы атаковать</p>
          </div>
        </div>
      )}

      {transitioning && (
        <div className="absolute inset-0 z-[70] bg-black/92 flex flex-col items-center justify-center gap-3 rounded-lg">
          <span className="text-4xl animate-pulse drop-shadow-lg">{locationEmoji}</span>
          <p className="text-xs font-bold text-white/50 tracking-[0.25em] uppercase">Переход</p>
        </div>
      )}
    </>
  );
}
