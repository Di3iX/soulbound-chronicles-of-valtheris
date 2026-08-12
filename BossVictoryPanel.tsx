// ─── BOSS VICTORY PANEL ───────────────────────────────────────────────────────
import React from 'react';
import { RARITY_STYLE } from '../inventory';
import type { BossRewardInfo } from './boss';

interface Props {
  reward:     BossRewardInfo;
  onContinue: () => void;
}

export default function BossVictoryPanel({ reward, onContinue }: Props) {
  return (
    <div className="absolute inset-0 z-50 bg-black/92 flex flex-col items-center justify-center p-5 text-center rounded backdrop-blur-md animate-in fade-in duration-500">

      {/* Crown glow */}
      <div className="text-5xl mb-3 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)] animate-pulse">
        👑
      </div>

      <h2 className="text-3xl font-black text-red-400 mb-1 drop-shadow-lg tracking-wide">
        ПОБЕДА!
      </h2>
      <p className="text-white/80 text-sm font-medium mb-[2px]">
        Главарь гоблинов повержен!
      </p>

      {/* Level up badge */}
      {reward.leveledUp && (
        <div className="mt-2 mb-3 px-3 py-1 bg-primary/20 border border-primary rounded-lg">
          <p className="text-primary font-bold text-sm">🌟 НОВЫЙ УРОВЕНЬ {reward.newLevel}!</p>
        </div>
      )}

      {/* Rewards list */}
      <div className="w-full bg-[#0a0a12] border border-tile-border rounded-xl px-4 py-3 mt-3 mb-3 text-left space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-[#444] font-bold mb-2">Награды</p>

        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#888]">Опыт</span>
          <span className="text-[13px] font-bold text-[#38bdf8]">+{reward.xp}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#888]">Золото</span>
          <span className="text-[13px] font-bold text-yellow-400">+{reward.gold}</span>
        </div>

        {/* Guaranteed item drop */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#888]">Предмет</span>
          <span className={`text-[12px] font-bold ${RARITY_STYLE[reward.dropItem.rarity].text}`}>
            📦 {reward.dropItem.name}
          </span>
        </div>

        {/* Trophy — first kill only */}
        {reward.wasFirstKill && reward.trophyItem && (
          <div className="flex items-center justify-between pt-1 border-t border-tile-border/40">
            <span className="text-[12px] text-[#888]">Трофей (1-й раз)</span>
            <span className={`text-[12px] font-bold ${RARITY_STYLE[reward.trophyItem.rarity].text}`}>
              🏆 {reward.trophyItem.name}
            </span>
          </div>
        )}
      </div>

      {/* Ruins unlock banner */}
      {reward.wasFirstKill && (
        <div className="w-full px-4 py-2 mb-3 bg-[#0d0f1a] border border-blue-700/40 rounded-lg flex items-center gap-2">
          <span className="text-base">🏛️</span>
          <div className="text-left">
            <p className="text-blue-400 text-[11px] font-bold">Руины разблокированы!</p>
            <p className="text-[#555] text-[10px]">Выход на востоке пещеры теперь открыт</p>
          </div>
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full py-3 bg-[#1e1e28] border-2 border-red-600 text-red-400 font-black text-base rounded-xl shadow-[0_0_18px_rgba(220,38,38,0.3)] active:scale-95 transition-transform tracking-wide">
        Продолжить →
      </button>
    </div>
  );
}
