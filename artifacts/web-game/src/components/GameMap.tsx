import React from 'react';
import { VP_COLS, VP_ROWS } from '../world/locations';
import { Enemy, LocationId } from '../combat';
import { FloatingNum } from '../types/ui';

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
  bossId: number;

  floatingNums: FloatingNum[];
  bossAppearNotif: boolean;

  transitioning: boolean;
  currentLocation: LocationId;
  locationEmoji: string;
}

/**
 * The 10×10 tile viewport: grid, camera-relative HP bars for player/enemy,
 * floating damage/heal numbers, boss-appear banner, and the travel transition
 * overlay. Everything else (NPC dialogs, panels, victory/defeat screens) stays
 * in App.tsx, layered on top of this via the same relative container.
 */
export default function GameMap({
  camCol, camRow, currentMap, renderTileContent,
  phase, playerHp, playerMaxHp, playerPos, activeEnemy, bossId,
  floatingNums, bossAppearNotif,
  transitioning, locationEmoji,
}: GameMapProps) {
  return (
    <>
      {/* Tile grid — 10×10 viewport into 20×20 map */}
      <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 gap-[1px] bg-tile-border p-[1px] border border-tile-border rounded shadow-lg shadow-black/50 overflow-hidden">
        {Array.from({ length: VP_ROWS }, (_, vr) =>
          Array.from({ length: VP_COLS }, (_, vc) => {
            const gx = camCol + vc;
            const gy = camRow + vr;
            const tileType = currentMap[gy]?.[gx] ?? 1;
            return (
              <div key={`${gx}-${gy}`} className="relative bg-map-bg">
                {renderTileContent(gx, gy, tileType)}
              </div>
            );
          })
        )}
      </div>

      {/* Map HP bars — camera-relative */}
      {phase === 'combat' && playerHp > 0 && (
        <div className="absolute pointer-events-none z-20 flex justify-center"
          style={{ top: `${((playerPos.y - camRow) / VP_ROWS) * 100}%`, left: `${((playerPos.x - camCol) / VP_COLS) * 100}%`, width: `${(1 / VP_COLS) * 100}%`, height: `${(1 / VP_ROWS) * 100}%`, marginTop: '-6px' }}>
          <div className="w-[80%] h-[4px] bg-[#1a1a1f] border border-black rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${Math.round((playerHp / playerMaxHp) * 100)}%` }} />
          </div>
        </div>
      )}
      {phase === 'combat' && activeEnemy && activeEnemy.hp > 0 &&
        activeEnemy.x >= camCol && activeEnemy.x < camCol + VP_COLS &&
        activeEnemy.y >= camRow && activeEnemy.y < camRow + VP_ROWS && (
        activeEnemy.id === bossId ? (
          // Boss HP bar — wider, red gradient, name above
          <div className="absolute pointer-events-none z-20 flex flex-col items-center"
            style={{
              top:        `${((activeEnemy.y - camRow) / VP_ROWS) * 100}%`,
              left:       `${Math.max(0, (activeEnemy.x - camCol - 1) / VP_COLS) * 100}%`,
              width:      `${(3 / VP_COLS) * 100}%`,
              marginTop:  '-20px',
            }}>
            <span className="text-[7px] font-black text-red-400 uppercase tracking-wide mb-[2px] leading-none drop-shadow-md">{activeEnemy.name}</span>
            <div className="w-full h-[5px] bg-[#1a1a1f] border border-red-900/60 rounded-full overflow-hidden shadow-[0_0_4px_rgba(220,38,38,0.5)]">
              <div className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${Math.round((activeEnemy.hp / activeEnemy.maxHp) * 100)}%` }} />
            </div>
          </div>
        ) : (
          // Normal enemy HP bar
          <div className="absolute pointer-events-none z-20 flex justify-center"
            style={{ top: `${((activeEnemy.y - camRow) / VP_ROWS) * 100}%`, left: `${((activeEnemy.x - camCol) / VP_COLS) * 100}%`, width: `${(1 / VP_COLS) * 100}%`, height: `${(1 / VP_ROWS) * 100}%`, marginTop: '-6px' }}>
            <div className="w-[80%] h-[4px] bg-[#1a1a1f] border border-black rounded-full overflow-hidden">
              <div className="h-full bg-destructive" style={{ width: `${Math.round((activeEnemy.hp / activeEnemy.maxHp) * 100)}%` }} />
            </div>
          </div>
        )
      )}

      {/* Floating numbers — camera-relative, only in viewport */}
      {floatingNums
        .filter(n => n.col >= camCol && n.col < camCol + VP_COLS && n.row >= camRow && n.row < camRow + VP_ROWS)
        .map(num => (
        <div key={num.id}
          className="absolute pointer-events-none z-30 font-bold text-base text-center animate-float w-[10%] h-[10%] flex items-center justify-center drop-shadow-md"
          style={{
            top: `${((num.row - camRow) / VP_ROWS) * 100}%`, left: `${((num.col - camCol) / VP_COLS) * 100}%`,
            color: num.type === 'player-dmg' ? 'hsl(var(--destructive))' : num.type === 'heal' ? 'hsl(var(--success))' : 'hsl(var(--primary))',
          }}>
          {num.value}
        </div>
      ))}

      {/* Boss appear notification */}
      {bossAppearNotif && (
        <div className="absolute inset-x-0 z-[55] flex justify-center pointer-events-none" style={{ top: '28%' }}>
          <div className="bg-black/90 border-2 border-red-600 rounded-xl px-6 py-4 mx-4 text-center shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-in fade-in duration-300">
            <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mb-1">⚔️ Появился Босс</p>
            <p className="text-white text-lg font-black tracking-wide">👑 Главарь гоблинов</p>
            <p className="text-red-400/70 text-[10px] mt-1 font-mono">750 HP · Урон ×2 · Скорость +20%</p>
          </div>
        </div>
      )}

      {/* Transition overlay */}
      {transitioning && (
        <div className="absolute inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center gap-2 rounded">
          <span className="text-3xl animate-pulse">{locationEmoji}</span>
          <p className="text-sm font-bold text-[#aaa] tracking-widest uppercase">Переход...</p>
        </div>
      )}
    </>
  );
}
