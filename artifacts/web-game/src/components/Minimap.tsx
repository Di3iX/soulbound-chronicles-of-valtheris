import React from 'react';
import { MAP_COLS, MAP_ROWS, VP_COLS, VP_ROWS } from '../world/locations';

interface MinimapProps {
  currentMap: number[][];
  exploredTiles: boolean[][];
  playerPos: { x: number; y: number };
  camCol: number;
  camRow: number;
  visible: boolean;
  onToggle: () => void;
}

/** Tile-type → minimap colour. Must stay in sync with the tile legend used in GameMap. */
const TILE_COLOR: Record<number, string> = {
  0: '#2a3a2a', // floor
  1: '#1a4d2e', // wall / tree
  2: '#4a4a4a', // rock
  3: '#1e5a7a', // water
  4: '#8a6a1a', // exit
};

/**
 * Small always-on corner minimap with fog of war: tiles the player hasn't
 * walked near yet render as solid black. Shows the player's position and the
 * current camera viewport as a highlighted rectangle.
 */
export default function Minimap({
  currentMap, exploredTiles, playerPos, camCol, camRow, visible, onToggle,
}: MinimapProps) {
  const CELL = 4; // px per tile
  const SIZE = MAP_COLS * CELL;

  return (
    <div className="absolute top-2 right-2 z-40">
      <button
        onClick={onToggle}
        className="absolute -top-1 -right-1 z-10 w-4 h-4 rounded-full bg-black/70 border border-tile-border text-[8px] text-[#888] flex items-center justify-center leading-none"
        title={visible ? 'Свернуть карту' : 'Развернуть карту'}>
        {visible ? '−' : '□'}
      </button>

      {visible && (
        <div
          className="relative bg-black/80 border border-tile-border rounded shadow-lg overflow-hidden"
          style={{ width: SIZE, height: SIZE }}>
          {currentMap.map((row, gy) =>
            row.map((tileType, gx) => {
              const explored = exploredTiles[gy]?.[gx];
              return (
                <div key={`${gx}-${gy}`}
                  className="absolute"
                  style={{
                    left: gx * CELL, top: gy * CELL, width: CELL, height: CELL,
                    background: explored ? (TILE_COLOR[tileType] ?? '#2a3a2a') : '#000',
                  }} />
              );
            })
          )}

          {/* Camera viewport outline */}
          <div className="absolute border border-primary/70 pointer-events-none"
            style={{
              left: camCol * CELL, top: camRow * CELL,
              width: VP_COLS * CELL, height: VP_ROWS * CELL,
            }} />

          {/* Player marker */}
          <div className="absolute rounded-full bg-primary shadow-[0_0_3px_rgba(200,150,42,0.9)]"
            style={{
              left: playerPos.x * CELL - 1, top: playerPos.y * CELL - 1,
              width: CELL + 2, height: CELL + 2,
            }} />
        </div>
      )}
    </div>
  );
}
