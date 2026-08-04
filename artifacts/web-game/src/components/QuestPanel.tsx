import React, { useMemo, useState } from 'react';
import { QuestProgress, QUEST_DEFS, getQuestEntry, type QuestDef } from '../quests/quests';
import { ITEM_CATALOG } from '../inventory';

interface QuestPanelProps {
  questProgress: QuestProgress;
  onClose: () => void;
}

type Tab = 'story' | 'daily';

function isDailyQuest(def: QuestDef): boolean {
  return (
    def.id.startsWith('daily_') ||
    def.title.startsWith('Ежедневно') ||
    def.title.includes('Ежедневно:')
  );
}

/**
 * Задания:
 * - вкладки Сюжет / Ежедневные
 * - активные: название + цель + прогресс
 * - не взятые: только название
 * - выполненные: название + «Выполнено»
 */
export default function QuestPanel({ questProgress, onClose }: QuestPanelProps) {
  const [tab, setTab] = useState<Tab>('story');

  const { story, daily } = useMemo(() => {
    const all = Object.values(QUEST_DEFS);
    return {
      story: all.filter(d => !isDailyQuest(d)),
      daily: all.filter(d => isDailyQuest(d)),
    };
  }, []);

  // Sort: active first, then inactive, then completed
  const sortQuests = (list: QuestDef[]) => {
    const rank = (id: string) => {
      const s = getQuestEntry(questProgress, id).status;
      if (s === 'active') return 0;
      if (s === 'inactive') return 1;
      return 2;
    };
    return [...list].sort((a, b) => rank(a.id) - rank(b.id));
  };

  const list = sortQuests(tab === 'story' ? story : daily);

  return (
    <div className="absolute inset-0 z-[60] bg-[#08080d]/97 flex flex-col rounded backdrop-blur-md">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-tile-border shrink-0">
        <h2 className="text-base font-bold text-primary tracking-wide">📜 Задания</h2>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded border border-tile-border text-[#888] hover:text-white hover:border-primary transition-colors text-sm font-bold"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-tile-border shrink-0">
        {([
          { id: 'story' as const, label: '📖 Сюжет', count: story.length },
          { id: 'daily' as const, label: '📅 Ежедневные', count: daily.length },
        ]).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-[12px] font-bold border-b-2 transition-colors ${
              tab === t.id
                ? 'text-primary border-primary bg-primary/5'
                : 'text-[#555] border-transparent hover:text-[#aaa]'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1 text-[9px] opacity-60">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Quest list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {list.length === 0 && (
          <p className="text-center text-[#444] text-sm py-10">
            {tab === 'daily' ? 'Ежедневных заданий пока нет' : 'Сюжетных заданий пока нет'}
          </p>
        )}

        {list.map(def => {
          const entry = getQuestEntry(questProgress, def.id);
          const isDone = entry.status === 'completed';
          const isActive = entry.status === 'active';
          const isInactive = entry.status === 'inactive';
          const pct = Math.min(100, Math.round((entry.current / Math.max(1, def.objective.required)) * 100));

          return (
            <div
              key={def.id}
              className={`rounded-lg border px-3 py-2.5 ${
                isDone
                  ? 'border-green-800/40 bg-green-950/15'
                  : isActive
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-tile-border/60 bg-[#0e0e14]'
              }`}
            >
              {/* Title + badge */}
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`text-[13px] font-bold leading-tight ${
                    isDone ? 'text-green-400' : isActive ? 'text-primary' : 'text-[#888]'
                  }`}
                >
                  {def.title}
                </span>
                <span
                  className={`shrink-0 text-[9px] font-bold uppercase px-[5px] py-[2px] rounded ${
                    isDone
                      ? 'bg-green-900/50 text-green-400'
                      : isActive
                        ? 'bg-primary/20 text-primary'
                        : 'bg-[#1a1a22] text-[#555]'
                  }`}
                >
                  {isDone ? '✓ Выполнено' : isActive ? 'Активно' : 'Не взято'}
                </span>
              </div>

              {/* Active: objective + progress */}
              {isActive && (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] mb-1 gap-2">
                    <span className="text-[#999] leading-snug">{def.objective.description}</span>
                    <span className="font-mono font-bold text-primary shrink-0">
                      {entry.current}/{def.objective.required}
                    </span>
                  </div>
                  <div className="h-[4px] bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {/* Rewards for active */}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 pt-1.5 border-t border-tile-border/25">
                    <span className="text-[9px] text-yellow-400/90">💰 {def.reward.gold}</span>
                    <span className="text-[9px] text-[#38bdf8]/90">✨ {def.reward.xp} XP</span>
                    {(def.reward.items ?? []).map(key => (
                      <span key={key} className="text-[9px] text-[#888]">
                        {ITEM_CATALOG[key]?.name ?? key}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed: only badge already shown — optional thin note */}
              {isDone && (
                <p className="text-[10px] text-green-700/80 mt-1">Задание сдано</p>
              )}

              {/* Inactive: title only — no description, no objective, no rewards */}
              {isInactive && null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
