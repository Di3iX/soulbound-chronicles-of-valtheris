import React from 'react';
import { LocationId, Phase } from '../combat';
import { getLocation, isConnected } from '../world/locations';

interface WorldMapPanelProps {
  currentLocation: LocationId;
  phase: Phase;
  transitioning: boolean;
  onTravel: (to: LocationId) => void;
  onClose: () => void;
}

// Node layout in SVG coordinate space (viewBox 340×220)
const NODES: { id: LocationId; cx: number; cy: number }[] = [
  { id: 'village', cx: 45,  cy: 110 },
  { id: 'forest',  cx: 160, cy: 55  },
  { id: 'cave',    cx: 285, cy: 55  },
  { id: 'swamp',   cx: 160, cy: 175 },
  { id: 'ruins',   cx: 285, cy: 175 },
];
// Static edge list (undirected)
const EDGES: [number, number, number, number][] = [
  [45, 110, 160, 55],   // village–forest
  [160, 55, 285, 55],   // forest–cave
  [160, 55, 160, 175],  // forest–swamp
  [285, 55, 285, 175],  // cave–ruins
];

/** Full-screen world map overlay: visual graph of the 5 locations, travel on tap. */
export default function WorldMapPanel({
  currentLocation, phase, transitioning, onTravel, onClose,
}: WorldMapPanelProps) {
  return (
    <div className="absolute inset-0 z-[60] bg-[#08080d]/97 flex flex-col rounded backdrop-blur-md">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-tile-border shrink-0">
        <h2 className="text-base font-bold text-primary tracking-wide">🗺 Карта мира</h2>
        {phase !== 'explore' && (
          <span className="text-[10px] text-destructive font-bold">⚔️ недоступно в бою</span>
        )}
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded border border-tile-border text-[#888] hover:text-white hover:border-primary transition-colors text-sm font-bold">✕</button>
      </div>

      {/* Graph area */}
      <div className="flex-1 relative">

        {/* SVG edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 340 220" preserveAspectRatio="xMidYMid meet">
          {/* Dim base lines */}
          {EDGES.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#1e1e2e" strokeWidth="2.5" />
          ))}
          {/* Highlight active connections from current location */}
          {EDGES.map(([x1, y1, x2, y2], i) => {
            const a = NODES.find(n => n.cx === x1 && n.cy === y1)?.id;
            const b = NODES.find(n => n.cx === x2 && n.cy === y2)?.id;
            const active = (a === currentLocation || b === currentLocation) &&
                           a !== undefined && b !== undefined &&
                           isConnected(a, b);
            return active ? (
              <line key={`h${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#c89628" strokeWidth="1.5" opacity="0.45" />
            ) : null;
          })}
        </svg>

        {/* Location nodes */}
        {NODES.map(({ id, cx, cy }) => {
          const loc       = getLocation(id);
          const isCurrent = id === currentLocation;
          const canTravel = !isCurrent && isConnected(currentLocation, id) && phase === 'explore' && !transitioning;
          const reachable = isCurrent || isConnected(currentLocation, id);
          return (
            <button key={id}
              onClick={() => canTravel && onTravel(id)}
              disabled={!canTravel && !isCurrent}
              style={{
                position: 'absolute',
                left: `${(cx / 340) * 100}%`,
                top:  `${(cy / 220) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={[
                'flex flex-col items-center gap-[2px] px-2 py-[6px] rounded-lg border text-center w-[68px] transition-all',
                isCurrent
                  ? 'border-primary bg-primary/20 shadow-[0_0_12px_rgba(200,150,42,0.25)] cursor-default'
                  : canTravel
                    ? 'border-[#3a3a50] bg-[#131320] hover:border-primary hover:bg-primary/10 cursor-pointer active:scale-95'
                    : reachable
                      ? 'border-[#222] bg-[#0d0d14] opacity-50 cursor-not-allowed'
                      : 'border-[#181818] bg-[#0a0a0f] opacity-25 cursor-not-allowed',
              ].join(' ')}>
              <span className="text-lg leading-none">{loc.emoji}</span>
              <span className={`text-[10px] font-bold leading-tight ${isCurrent ? 'text-primary' : 'text-[#bbb]'}`}>
                {loc.name}
              </span>
              <span className="text-[9px] text-[#555] leading-none font-mono">Ур.{loc.recommendedLevel}</span>
              {loc.isSafeZone && (
                <span className="text-[8px] text-green-700 font-bold leading-none">★ СЕЙФ</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-2 border-t border-tile-border/30 flex items-center justify-center">
        <span className="text-[10px] text-[#444] font-mono">
          {`★ ${getLocation(currentLocation).name} · Ур.${getLocation(currentLocation).recommendedLevel}${getLocation(currentLocation).isSafeZone ? ' · Безопасная зона' : ''}`}
        </span>
      </div>

    </div>
  );
}
