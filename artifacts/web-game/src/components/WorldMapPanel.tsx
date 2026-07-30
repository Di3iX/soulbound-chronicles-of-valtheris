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

/**
 * World graph layout (viewBox 400×320)
 *
 *          icefort
 *             |
 *         mountains —— wolfcave
 *             |            /
 *  swamp — darkforest —— forest —— village
 *             |            |
 *                      road —— ruins —— mine —— pass
 */
const NODES: { id: LocationId; cx: number; cy: number }[] = [
  { id: 'village',    cx: 50,  cy: 160 },
  { id: 'forest',     cx: 130, cy: 160 },
  { id: 'darkforest', cx: 210, cy: 120 },
  { id: 'wolfcave',   cx: 290, cy: 80  },
  { id: 'mountains',  cx: 210, cy: 50  },
  { id: 'icefort',    cx: 210, cy: 15  },
  { id: 'swamp',      cx: 130, cy: 80  },
  { id: 'road',       cx: 210, cy: 210 },
  { id: 'ruins',      cx: 290, cy: 210 },
  { id: 'mine',       cx: 350, cy: 250 },
  { id: 'pass',       cx: 350, cy: 300 },
];

const EDGES: [number, number, number, number][] = [
  [50, 160, 130, 160],   // village–forest
  [130, 160, 210, 120],  // forest–darkforest
  [130, 160, 210, 210],  // forest–road
  [130, 160, 130, 80],   // forest–swamp (via visual; actual swamp connects darkforest)
  [210, 120, 130, 80],   // darkforest–swamp
  [210, 120, 290, 80],   // darkforest–wolfcave
  [210, 120, 210, 50],   // darkforest–mountains
  [210, 50, 210, 15],    // mountains–icefort
  [210, 210, 290, 210],  // road–ruins
  [290, 210, 350, 250],  // ruins–mine
  [350, 250, 350, 300],  // mine–pass
];

export default function WorldMapPanel({
  currentLocation, phase, transitioning, onTravel, onClose,
}: WorldMapPanelProps) {
  return (
    <div className="absolute inset-0 z-[60] bg-[#08080d]/97 flex flex-col rounded backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3 border-b border-tile-border shrink-0">
        <h2 className="text-base font-bold text-primary tracking-wide">🗺 Карта мира</h2>
        {phase !== 'explore' && (
          <span className="text-[10px] text-destructive font-bold">⚔️ недоступно в бою</span>
        )}
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded border border-tile-border text-[#888] hover:text-white hover:border-primary transition-colors text-sm font-bold">✕</button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">
          {EDGES.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#1e1e2e" strokeWidth="2.5" />
          ))}
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
                left: `${(cx / 400) * 100}%`,
                top:  `${(cy / 320) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={[
                'flex flex-col items-center gap-[1px] px-1.5 py-[4px] rounded-lg border text-center w-[62px] transition-all',
                isCurrent
                  ? 'border-primary bg-primary/20 shadow-[0_0_12px_rgba(200,150,42,0.25)] cursor-default'
                  : canTravel
                    ? 'border-[#3a3a50] bg-[#131320] hover:border-primary hover:bg-primary/10 cursor-pointer active:scale-95'
                    : reachable
                      ? 'border-[#222] bg-[#0d0d14] opacity-50 cursor-not-allowed'
                      : 'border-[#181818] bg-[#0a0a0f] opacity-25 cursor-not-allowed',
              ].join(' ')}>
              <span className="text-base leading-none">{loc.emoji}</span>
              <span className={`text-[9px] font-bold leading-tight ${isCurrent ? 'text-primary' : 'text-[#bbb]'}`}>
                {loc.name}
              </span>
              <span className="text-[8px] text-[#555] leading-none font-mono">Ур.{loc.recommendedLevel}</span>
            </button>
          );
        })}
      </div>

      <div className="shrink-0 px-4 py-2 border-t border-tile-border/30 flex items-center justify-center">
        <span className="text-[10px] text-[#444] font-mono">
          {`★ ${getLocation(currentLocation).name} · Ур.${getLocation(currentLocation).recommendedLevel}${getLocation(currentLocation).isSafeZone ? ' · Безопасная зона' : ''}`}
        </span>
      </div>
    </div>
  );
}
