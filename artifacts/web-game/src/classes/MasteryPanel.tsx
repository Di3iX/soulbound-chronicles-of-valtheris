/**
 * Step 2: Созвездие Мастерства — spend mastery points on branch nodes.
 */
import { useMemo, useState } from 'react';
import {
  MASTERY_BRANCHES,
  type MasteryBranchId,
  type PlayerMasteryState,
  canUnlockNode,
  spendMasteryPoint,
  sumMasteryBonuses,
} from './masteryConstellation';

interface Props {
  masteryState: PlayerMasteryState;
  level: number;
  onChange: (next: PlayerMasteryState) => void;
  onClose: () => void;
}

export default function MasteryPanel({ masteryState, level, onChange, onClose }: Props) {
  const [branchId, setBranchId] = useState<MasteryBranchId>('strength');
  const branch = MASTERY_BRANCHES.find(b => b.id === branchId)!;
  const bonuses = useMemo(() => sumMasteryBonuses(masteryState), [masteryState]);

  const spend = (nodeId: string) => {
    const next = spendMasteryPoint(masteryState, nodeId, level);
    if (next !== masteryState) onChange(next);
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center bg-black/65 p-2">
      <div className="flex w-full max-w-lg max-h-[90vh] flex-col overflow-hidden rounded-xl border border-violet-500/40 bg-[#120f1a]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#1a1430] px-3 py-2">
          <div>
            <div className="font-bold text-violet-200">🌌 Созвездие Мастерства</div>
            <div className="text-[10px] text-white/45">
              Очков: <span className="text-violet-300 font-semibold">{masteryState.points}</span>
              {' · '}ур. {level}
            </div>
          </div>
          <button type="button" onClick={onClose} className="px-2 text-white/50 hover:text-white">✕</button>
        </div>

        {/* Branch tabs */}
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 px-2 py-2">
          {MASTERY_BRANCHES.map(b => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBranchId(b.id)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${
                branchId === b.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {b.emoji} {b.name}
            </button>
          ))}
        </div>

        {/* Branch info */}
        <div className="shrink-0 px-3 pt-2 text-[11px] text-white/50">{branch.description}</div>

        {/* Nodes */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex flex-col gap-1.5">
            {branch.nodes.map(node => {
              const rank = masteryState.ranks[node.id] ?? 0;
              const check = canUnlockNode(masteryState, node, level);
              const maxed = rank >= node.maxRank;
              const locked = !check.ok && rank === 0;

              return (
                <button
                  key={node.id}
                  type="button"
                  disabled={maxed || !check.ok}
                  onClick={() => spend(node.id)}
                  className={`rounded-lg border px-2.5 py-2 text-left transition ${
                    maxed
                      ? 'border-violet-400/50 bg-violet-500/20'
                      : check.ok
                        ? 'border-white/15 bg-white/5 hover:border-violet-400 hover:bg-violet-500/15'
                        : 'border-white/5 bg-black/20 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">{node.name}</div>
                      <div className="text-[10px] text-white/45">{node.description}</div>
                      <div className="mt-0.5 text-[10px] text-violet-200/80">
                        {node.effect.type}: +{node.effect.valuePerRank}
                        {node.effect.unit === '%' ? '%' : ''} / ранг
                        {node.minLevel > 1 ? ` · с ${node.minLevel} ур.` : ''}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={`text-sm font-bold ${maxed ? 'text-violet-300' : 'text-white/80'}`}>
                        {rank}/{node.maxRank}
                      </div>
                      {!maxed && (
                        <div className="text-[9px] text-white/40">
                          {check.ok ? 'нажать' : check.reason}
                        </div>
                      )}
                      {maxed && <div className="text-[9px] text-violet-300">макс</div>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bonus summary */}
        {Object.keys(bonuses).length > 0 && (
          <div className="shrink-0 border-t border-white/10 bg-black/30 px-3 py-2">
            <div className="mb-1 text-[10px] font-semibold text-white/50">Суммарные бонусы</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(bonuses).map(([k, v]) => (
                <span key={k} className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-100">
                  {k} +{Number(v.toFixed(2))}
                </span>
              ))}
            </div>
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
