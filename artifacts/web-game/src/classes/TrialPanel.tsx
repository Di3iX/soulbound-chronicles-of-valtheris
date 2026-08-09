/**
 * UI: show active trial progress + pick profession/spec after completion.
 */
import { ALL_PATHS } from './classSystem';
import type { TrialDef } from './trials';
import type { QuestProgress } from '../quests/quests';

interface Props {
  trial: TrialDef;
  progress: QuestProgress;
  /** Called when player selects unlocked path after trial is ready/completed. */
  onChoose?: (unlockId: string) => void;
  onClose: () => void;
  /** If true, show unlock buttons. */
  canChoose?: boolean;
}

export default function TrialPanel({
  trial,
  progress,
  onChoose,
  onClose,
  canChoose,
}: Props) {
  const entry = progress[trial.id];
  const cur = entry?.current ?? 0;
  const need = trial.quest.objective.required;
  const done = entry?.status === 'completed' || cur >= need;
  const pct = Math.min(100, Math.floor((cur / need) * 100));

  return (
    <div className="fixed inset-0 z-[78] flex items-center justify-center bg-black/70 p-3">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-amber-600/50 bg-[#16120c]">
        <div className="border-b border-white/10 bg-[#1c160e] px-3 py-2">
          <div className="text-center text-lg font-bold text-amber-200">
            {trial.tier === 20 ? '⚔️' : '✨'} {trial.quest.title}
          </div>
          <div className="text-center text-[10px] text-white/45">
            Испытание {trial.tier} уровня
          </div>
        </div>

        <p className="px-3 pt-3 text-[12px] leading-relaxed text-white/65">
          {trial.quest.description}
        </p>

        <div className="m-3 rounded-lg bg-black/30 p-2">
          <div className="text-[11px] text-white/50">{trial.quest.objective.description}</div>
          <div className="mt-1 flex items-center justify-between text-sm text-white">
            <span>
              {Math.min(cur, need)} / {need}
            </span>
            <span className={done ? 'text-green-400' : 'text-amber-300'}>
              {done ? 'Готово' : `${pct}%`}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded bg-white/10">
            <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="px-3 text-[11px] text-white/40">
          Награда: {trial.quest.reward.xp} XP · {trial.quest.reward.gold} золота
        </div>

        {canChoose && done && onChoose && (
          <div className="m-3 space-y-1.5">
            <div className="text-xs font-bold text-amber-200">Выберите путь:</div>
            {trial.unlocks.map(id => {
              const p = ALL_PATHS[id];
              if (!p) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChoose(id)}
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-2 py-2 text-left hover:border-amber-400"
                >
                  <span className="text-white font-medium">
                    {p.emoji} {p.name}
                  </span>
                  <span className="block text-[10px] text-white/45">{p.concept}</span>
                </button>
              );
            })}
          </div>
        )}

        {!done && (
          <p className="px-3 pb-2 text-[11px] text-white/40">
            Убийства засчитываются автоматически. Сдайте испытание у Старосты или выберите путь здесь, когда счётчик полон.
          </p>
        )}

        <div className="p-3">
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
