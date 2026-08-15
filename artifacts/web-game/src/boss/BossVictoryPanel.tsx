// ─── BOSS VICTORY PANEL ───────────────────────────────────────────────────────
import React from 'react';
import { RARITY_STYLE } from '../inventory';
import type { BossRewardInfo } from './boss';

interface Props {
  reward: BossRewardInfo;
  /** Optional display name of the defeated boss */
  bossName?: string;
  onContinue: () => void;
}

export default function BossVictoryPanel({ reward, bossName, onContinue }: Props) {
  return (
    <div
      className="absolute inset-0 z-[70] bg-black/92 flex flex-col rounded backdrop-blur-md animate-in fade-in duration-300"
      onClick={onContinue}
      role="dialog"
      aria-label="Победа"
    >
      {/* Scrollable body — keeps the button always on screen */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-4 pt-6 pb-3 flex flex-col items-center text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-4xl mb-2 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">👑</div>

        <h2 className="text-2xl font-black text-red-400 mb-1 tracking-wide">
          ПОБЕДА!
        </h2>
        <p className="text-white/80 text-sm font-medium mb-2">
          {bossName ? `${bossName} повержен!` : 'Босс повержен!'}
        </p>

        {reward.leveledUp && (
          <div className="mb-2 px-3 py-1 bg-primary/20 border border-primary rounded-lg">
            <p className="text-primary font-bold text-sm">🌟 НОВЫЙ УРОВЕНЬ {reward.newLevel}!</p>
          </div>
        )}

        <div className="w-full max-w-sm bg-[#0a0a12] border border-tile-border rounded-xl px-4 py-3 mb-2 text-left space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-[#444] font-bold mb-1">Награды</p>

          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#888]">Опыт</span>
            <span className="text-[13px] font-bold text-[#38bdf8]">+{reward.xp}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#888]">Золото</span>
            <span className="text-[13px] font-bold text-yellow-400">+{reward.gold}</span>
          </div>

          {reward.dropItem && (
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#888]">Предмет</span>
              <span className={`text-[12px] font-bold ${RARITY_STYLE[reward.dropItem.rarity]?.text ?? 'text-white'}`}>
                📦 {reward.dropItem.name}
              </span>
            </div>
          )}

          {reward.wasFirstKill && reward.trophyItem && (
            <div className="flex items-center justify-between pt-1 border-t border-tile-border/40">
              <span className="text-[12px] text-[#888]">Трофей (1-й раз)</span>
              <span className={`text-[12px] font-bold ${RARITY_STYLE[reward.trophyItem.rarity]?.text ?? 'text-white'}`}>
                🏆 {reward.trophyItem.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Always-visible footer */}
      <div
        className="shrink-0 px-4 pb-4 pt-2 border-t border-tile-border/40 bg-black/80"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onContinue}
          className="w-full py-3.5 bg-[#1e1e28] border-2 border-red-600 text-red-400 font-black text-base rounded-xl shadow-[0_0_18px_rgba(220,38,38,0.35)] active:scale-95 transition-transform tracking-wide"
        >
          Продолжить →
        </button>
        <p className="text-[10px] text-[#555] mt-1.5 text-center">или нажми на фон</p>
      </div>
    </div>
  );
}
