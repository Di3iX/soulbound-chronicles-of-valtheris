import React from 'react';
import { Phase } from '../combat';

interface ControlsPanelProps {
  phase: Phase;
  movePlayer: (dx: number, dy: number) => void;
  onUsePotion: () => void;
  potionCount: number;
  canUsePotion: boolean;
}

/** Bottom action controls: 4-way D-pad (explore only) OR potion button (combat only; skills live in ClassSkillBar). */
export default function ControlsPanel({ phase, movePlayer, onUsePotion, potionCount, canUsePotion }: ControlsPanelProps) {
  if (phase === 'explore') {
    return (
      /* ══ D-PAD ══ */
      <div className="h-[120px] shrink-0 flex flex-col items-center justify-center border-t border-tile-border/50 bg-[#0c0c10]">
        <span className="text-[9px] uppercase tracking-widest text-[#666] mb-1 font-bold">Движение</span>
        <div className="grid grid-cols-3 gap-[5px]">
          <div />
          <button onClick={() => movePlayer(0, -1)}
            className="dpad-btn w-[48px] h-[48px] bg-[#1e1e28] border-2 border-primary rounded-lg flex items-center justify-center text-primary transition-colors shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          </button>
          <div />
          <button onClick={() => movePlayer(-1, 0)}
            className="dpad-btn w-[48px] h-[48px] bg-[#1e1e28] border-2 border-primary rounded-lg flex items-center justify-center text-primary transition-colors shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button onClick={() => movePlayer(0, 1)}
            className="dpad-btn w-[48px] h-[48px] bg-[#1e1e28] border-2 border-primary rounded-lg flex items-center justify-center text-primary transition-colors shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <button onClick={() => movePlayer(1, 0)}
            className="dpad-btn w-[48px] h-[48px] bg-[#1e1e28] border-2 border-primary rounded-lg flex items-center justify-center text-primary transition-colors shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    /* ══ SKILL BAR ══ */
    <div className="h-[90px] shrink-0 bg-[#111116] border-t border-tile-border p-2 flex justify-center gap-2 overflow-x-auto">
      <button disabled={!canUsePotion} onClick={onUsePotion}
        className={`relative flex flex-col items-center justify-center w-[64px] h-[64px] shrink-0 rounded bg-[#1e1e28] border
          ${canUsePotion ? 'border-green-600 shadow-[0_0_10px_rgba(34,197,94,0.4)] cursor-pointer active:scale-95 transition-all' : 'border-tile-border opacity-60 cursor-not-allowed'}`}>
        <span className="text-xl mb-1">🧪</span>
        <span className="text-[10px] font-bold text-white/80">Зелье</span>
        {potionCount > 0 && (
          <span className="absolute -top-1 -right-1 w-[16px] h-[16px] rounded-full bg-green-600 text-white text-[9px] font-black flex items-center justify-center leading-none">
            {potionCount}
          </span>
        )}
      </button>
    </div>
  );
}
