import React from 'react';
import { MAP_COLS, MAP_ROWS, VP_COLS, VP_ROWS } from '../world/locations';
import { isBossId, isMiniBossId } from '../boss/boss';

interface MinimapEnemy {
  id: number;
  x: number;
  y: number;
  dead?: boolean;
}

interface MinimapProps {
  currentMap: number[][];
  exploredTiles: boolean[][] | undefined;
  playerPos: { x: number; y: number };
  camCol: number;
  camRow: number;
  visible: boolean;
  onToggle: () => void;
  /** Living enemies for markers (bosses always, trash optional on explored). */
  enemies?: MinimapEnemy[];
}

const TILE_COLOR: Record<number, string> = {
  0: '#2a3a2a',
  1: '#1a4d2e',
  2: '#4a4a4a',
  3: '#1e5a7a',
  4: '#8a6a1a',
};

/**
 * Corner minimap with fog of war.
 * Bosses / mini-bosses: bright markers (always visible while alive).
 * Ordinary enemies: small dots on explored tiles only.
 */
export default function Minimap({
  currentMap, exploredTiles, playerPos, camCol, camRow, visible, onToggle, enemies = [],
}: MinimapProps) {
  const CELL = 2;
  const SIZE = MAP_COLS * CELL;

  const map = currentMap ?? [];
  const explored = exploredTiles ?? [];

  const living = enemies.filter(e => !e.dead);

  return (
    <div className="absolute top-2 right-2 z-40">
      <button
        type="button"
        onClick={onToggle}
        className="absolute -top-1 -right-1 z-10 w-4 h-4 rounded-full bg-black/70 border border-tile-border text-[8px] text-[#888] flex items-center justify-center leading-none"
        title={visible ? 'Свернуть карту' : 'Развернуть карту'}>
        {visible ? '−' : '□'}
      </button>

      {visible && (
        <div
          className="relative bg-black/80 border border-tile-border rounded shadow-lg overflow-hidden"
          style={{ width: SIZE, height: SIZE }}
        >
          {map.map((row, gy) =>
            (row ?? []).map((tileType, gx) => {
              const isExplored = explored[gy]?.[gx] === true;
              return (
                <div
                  key={`${gx}-${gy}`}
                  className="absolute"
                  style={{
                    left: gx * CELL,
                    top: gy * CELL,
                    width: CELL,
                    height: CELL,
                    background: isExplored ? (TILE_COLOR[tileType] ?? '#2a3a2a') : '#000',
                  }}
                />
              );
            })
          )}

          {/* Ordinary enemies — explored only */}
          {living.filter(e => !isBossId(e.id)).map(e => {
            if (explored[e.y]?.[e.x] !== true) return null;
            return (
              <div
                key={`e-${e.id}`}
                className="absolute rounded-sm bg-red-800/90 pointer-events-none"
                style={{
                  left: e.x * CELL + 1,
                  top: e.y * CELL + 1,
                  width: CELL - 2,
                  height: CELL - 2,
                }}
                title="Враг"
              />
            );
          })}

          {/* Bosses — always on, larger pulse marker */}
          {living.filter(e => isBossId(e.id)).map(e => {
            const mini = isMiniBossId(e.id);
            return (
              <div
                key={`b-${e.id}`}
                className="absolute pointer-events-none z-[2]"
                style={{
                  left: e.x * CELL - 1,
                  top: e.y * CELL - 1,
                  width: CELL + 2,
                  height: CELL + 2,
                }}
                title={mini ? 'Мини-босс' : 'Босс'}
              >
                <div
                  className={`w-full h-full rounded-sm border ${
                    mini
                      ? 'bg-orange-500 border-yellow-300 shadow-[0_0_6px_rgba(249,115,22,0.95)]'
                      : 'bg-red-600 border-red-200 shadow-[0_0_8px_rgba(220,38,38,1)]'
                  }`}
                  style={{ animation: 'bossPulse 1.4s ease-in-out infinite' }}
                />
              </div>
            );
          })}

          {/* Camera viewport */}
          <div
            className="absolute border border-primary/70 pointer-events-none z-[1]"
            style={{
              left: camCol * CELL,
              top: camRow * CELL,
              width: VP_COLS * CELL,
              height: VP_ROWS * CELL,
            }}
          />

          {/* Player */}
          <div
            className="absolute rounded-full bg-primary shadow-[0_0_3px_rgba(200,150,42,0.9)] z-[3]"
            style={{
              left: playerPos.x * CELL - 1,
              top: playerPos.y * CELL - 1,
              width: CELL + 2,
              height: CELL + 2,
            }}
          />

          <style>{`
            @keyframes bossPulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.65; transform: scale(1.15); }
            }
          `}</style>
        </div>
      )}

      {/* Legend when bosses alive */}
      {visible && living.some(e => isBossId(e.id)) && (
        <div className="mt-1 text-[8px] text-[#aaa] font-mono bg-black/70 border border-tile-border rounded px-1.5 py-0.5">
          <span className="text-orange-400">■</span> мини-босс{' '}
          <span className="text-red-500">■</span> босс
        </div>
      )}
    </div>
  );
}
