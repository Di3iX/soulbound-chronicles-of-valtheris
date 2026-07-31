import React from 'react';
import { Phase, SKILLS } from '../combat';

interface ControlsPanelProps {
  phase: Phase;
  movePlayer: (dx: number, dy: number) => void;
  skillsCd: Record<number, number>;
  playerMp: number;
  useSkill: (skill: typeof SKILLS[0]) => void;
  onUsePotion: () => void;
  potionCount: number;
  canUsePotion: boolean;
}

/** Bottom action controls: 4-way D-pad (explore only) OR skill bar with cooldowns (combat only). */
export default function ControlsPanel({ phase, movePlayer, skillsCd, playerMp, useSkill, onUsePotion, potionCount, canUsePotion }: ControlsPanelProps) {
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
      {SKILLS.map(skill => {
        const cd = skillsCd[skill.id] || 0;
        const isOnCd = cd > 0;
        const notEnoughMana = skill.manaCost > 0 && playerMp < skill.manaCost;
        const isUsable = !isOnCd && !notEnoughMana;
        return (
          <button key={skill.id} disabled={!isUsable} onClick={() => useSkill(skill)}
            className={`relative flex flex-col items-center justify-center w-[64px] h-[64px] shrink-0 rounded bg-[#1e1e28] border
              ${isUsable ? 'border-skill shadow-[0_0_10px_rgba(26,74,139,0.5)] cursor-pointer active:scale-95 transition-all' : 'border-tile-border opacity-60 cursor-not-allowed'}`}>
            <span className="text-xl mb-1">{skill.emoji}</span>
            <span className="text-[10px] font-bold text-white/80">{skill.name}</span>
            {skill.manaCost > 0 && (
              <span className={`text-[9px] font-mono ${notEnoughMana ? 'text-destructive' : 'text-[#3a8fc4]'}`}>🔷{skill.manaCost}</span>
            )}
            {isOnCd && (
              <div className="absolute inset-0 bg-black/70 rounded flex items-center justify-center">
                <span className="text-white font-mono font-bold text-sm">{(cd / 10).toFixed(1)}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
