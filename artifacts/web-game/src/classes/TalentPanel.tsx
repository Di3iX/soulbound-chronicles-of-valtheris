/**
 * Step 3: Class talent tree — spend classPoints.
 */
import { useMemo, useState } from 'react';
import { ALL_PATHS } from './classSystem';
import {
  type PlayerClassState,
  currentPathId,
  currentTalentTree,
  canSpendClassTalent,
  spendClassTalent,
  spentTalentSummary,
} from './playerClass';

interface Props {
  classState: PlayerClassState;
  onChange: (next: PlayerClassState) => void;
  onClose: () => void;
}

export default function TalentPanel({ classState, onChange, onClose }: Props) {
  const path = ALL_PATHS[currentPathId(classState)];
  const tree = currentTalentTree(classState);
  const [filter, setFilter] = useState<'all' | 'open' | 'spent'>('all');

  const rows = useMemo(() => {
    const maxRow = Math.max(0, ...tree.map(t => t.row));
    return Array.from({ length: maxRow + 1 }, (_, row) =>
      tree.filter(t => t.row === row).sort((a, b) => a.col - b.col),
    );
  }, [tree]);

  const summary = spentTalentSummary(classState);

  const visible = (id: string, rank: number, can: boolean) => {
    if (filter === 'open') return can || rank > 0;
    if (filter === 'spent') return rank > 0;
    return true;
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center bg-black/65 p-2">
      <div className="flex w-full max-w-lg max-h-[90vh] flex-col overflow-hidden rounded-xl border border-amber-600/40 bg-[#14100c]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#1c160e] px-3 py-2">
          <div>
            <div className="font-bold text-amber-200">
              {path?.emoji} Таланты — {path?.name}
            </div>
            <div className="text-[10px] text-white/45">
              Очков класса:{' '}
              <span className="font-semibold text-amber-300">{classState.classPoints}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="px-2 text-white/50 hover:text-white">
            ✕
          </button>
        </div>

        <div className="flex shrink-0 gap-1 border-b border-white/10 px-2 py-1.5">
          {(['all', 'open', 'spent'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] ${
                filter === f ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/50'
              }`}
            >
              {f === 'all' ? 'Все' : f === 'open' ? 'Доступные' : 'Взятые'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {rows.map((nodes, rowIdx) => (
            <div key={rowIdx} className="mb-2">
              <div className="mb-1 text-[9px] uppercase tracking-wide text-white/30">
                Ряд {rowIdx + 1}
              </div>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {nodes.map(node => {
                  const rank = classState.spentClassTalents[node.id] ?? 0;
                  const check = canSpendClassTalent(classState, node.id);
                  if (!visible(node.id, rank, check.ok)) return null;
                  const maxed = rank >= node.maxRank;

                  return (
                    <button
                      key={node.id}
                      type="button"
                      disabled={maxed || !check.ok}
                      onClick={() => {
                        const next = spendClassTalent(classState, node.id);
                        if (next !== classState) onChange(next);
                      }}
                      className={`rounded-lg border px-2 py-1.5 text-left ${
                        maxed
                          ? 'border-amber-400/50 bg-amber-500/20'
                          : check.ok
                            ? 'border-white/15 bg-white/5 hover:border-amber-400'
                            : 'border-white/5 bg-black/25 opacity-45'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium text-white">
                            {node.name}
                          </div>
                          <div className="text-[10px] leading-snug text-white/45">
                            {node.description}
                          </div>
                        </div>
                        <div className="shrink-0 text-right text-[11px] font-bold text-amber-200">
                          {rank}/{node.maxRank}
                        </div>
                      </div>
                      {!maxed && (
                        <div className="mt-0.5 text-[9px] text-white/35">
                          {check.ok ? `−${node.costPerRank} очко` : check.reason}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {summary.length > 0 && (
          <div className="shrink-0 border-t border-white/10 bg-black/30 px-3 py-2">
            <div className="text-[10px] text-white/45">Взято: {summary.slice(0, 8).join(' · ')}
              {summary.length > 8 ? ` +${summary.length - 8}` : ''}
            </div>
          </div>
        )}

        {path?.legendaryTalent && (
          <div className="shrink-0 border-t border-amber-700/30 bg-amber-500/10 px-3 py-2">
            <div className="text-[10px] font-bold text-amber-200">
              ★ {path.legendaryTalent.name}
            </div>
            <div className="text-[10px] text-white/55">{path.legendaryTalent.description}</div>
            <div className="text-[9px] text-white/35">Открывается по прогрессу пути (контент / квест)</div>
          </div>
        )}

        <div className="shrink-0 p-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-white/10 py-2 text-sm text-white"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
