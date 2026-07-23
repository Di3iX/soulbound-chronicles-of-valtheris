import React from 'react';
import { QuestProgress, QUEST_DEFS, getQuestEntry } from '../quests/quests';
import { ITEM_CATALOG } from '../inventory';

interface QuestPanelProps {
  questProgress: QuestProgress;
  onClose: () => void;
}

/** Full-screen quest log overlay: every quest, its objective/progress bar, and rewards. */
export default function QuestPanel({ questProgress, onClose }: QuestPanelProps) {
  return (
    <div className="absolute inset-0 z-[60] bg-[#08080d]/97 flex flex-col rounded backdrop-blur-md">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-tile-border shrink-0">
        <h2 className="text-base font-bold text-primary tracking-wide">📜 Задания</h2>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded border border-tile-border text-[#888] hover:text-white hover:border-primary transition-colors text-sm font-bold">✕</button>
      </div>

      {/* Quest list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {Object.values(QUEST_DEFS).map(def => {
          const entry    = getQuestEntry(questProgress, def.id);
          const pct      = Math.min(100, Math.round((entry.current / def.objective.required) * 100));
          const isDone   = entry.status === 'completed';
          const isActive = entry.status === 'active';
          return (
            <div key={def.id}
              className={`rounded-lg border px-3 py-3 ${
                isDone   ? 'border-green-800/50 bg-green-950/20' :
                isActive ? 'border-primary/40 bg-primary/5' :
                           'border-tile-border bg-[#111118]'
              }`}>

              {/* Title + status badge */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className={`text-[13px] font-bold leading-tight ${isDone ? 'text-green-400' : isActive ? 'text-primary' : 'text-[#aaa]'}`}>
                  {def.title}
                </span>
                <span className={`shrink-0 text-[9px] font-bold uppercase px-[5px] py-[2px] rounded ${
                  isDone   ? 'bg-green-900/50 text-green-400' :
                  isActive ? 'bg-primary/20 text-primary' :
                             'bg-[#222] text-[#555]'
                }`}>
                  {isDone ? '✓ Выполнено' : isActive ? 'Активно' : 'Неактивно'}
                </span>
              </div>

              {/* Description */}
              <p className="text-[11px] text-[#555] mb-2 leading-snug">{def.description}</p>

              {/* Objective + progress bar */}
              {entry.status !== 'inactive' && (
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-[#666]">{def.objective.description}</span>
                    <span className={`font-mono font-bold ${isDone ? 'text-green-400' : 'text-[#aaa]'}`}>
                      {entry.current} / {def.objective.required}
                    </span>
                  </div>
                  <div className="h-[4px] bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isDone ? 'bg-green-600' : 'bg-primary'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}

              {/* Rewards */}
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-tile-border/30">
                <span className="text-[9px] text-[#444] font-bold uppercase tracking-wide">Награда:</span>
                <span className="text-[10px] text-yellow-400 font-bold">💰 {def.reward.gold}</span>
                <span className="text-[10px] text-[#38bdf8] font-bold">✨ {def.reward.xp} опыта</span>
                {(def.reward.items ?? []).map(key => (
                  <span key={key} className="text-[10px] text-[#aaa] font-bold">
                    🗡️ {ITEM_CATALOG[key]?.name ?? key}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {Object.keys(QUEST_DEFS).length === 0 && (
          <p className="text-center text-[#444] text-sm py-8">Заданий пока нет</p>
        )}
      </div>

    </div>
  );
}
