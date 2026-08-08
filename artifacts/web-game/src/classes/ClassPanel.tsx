/**
 * Panel: current path, points, unlocked skills, profession gate.
 */
import { ALL_PATHS } from './classSystem';
import {
  type PlayerClassState,
  type PlayerMasteryState,
  currentPathId,
  availableProfessions,
  availableSpecializations,
  unlockedSkills,
} from './playerClass';

interface Props {
  classState: PlayerClassState;
  masteryState: PlayerMasteryState;
  level: number;
  onClose: () => void;
  onOpenMastery?: () => void;
  onChooseProfession?: (id: string) => void;
  onChooseSpec?: (id: string) => void;
}

export default function ClassPanel({
  classState,
  masteryState,
  level,
  onClose,
  onOpenMastery,
  onChooseProfession,
  onChooseSpec,
}: Props) {
  const path = ALL_PATHS[currentPathId(classState)];
  const skills = unlockedSkills(classState, level);
  const profs = level >= 20 && !classState.profession ? availableProfessions(classState) : [];
  const specs =
    level >= 40 && classState.profession && !classState.specialization
      ? availableSpecializations(classState)
      : [];

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 p-2">
      <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-xl border border-white/15 bg-[#14121c]">
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#1a1525] px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{path?.emoji}</span>
            <div>
              <div className="font-bold text-white">{path?.name}</div>
              <div className="text-[10px] text-white/45">
                {classState.specialization
                  ? 'Специализация'
                  : classState.profession
                    ? 'Профессия'
                    : 'Архетип'}
                {' · '}ур. {level}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="px-2 text-white/50 hover:text-white">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 text-center text-sm">
          <div className="rounded-lg bg-amber-500/15 py-2">
            <div className="text-[10px] text-amber-200/70">Очки класса</div>
            <div className="text-lg font-bold text-amber-200">{classState.classPoints}</div>
          </div>
          <div className="rounded-lg bg-violet-500/15 py-2">
            <div className="text-[10px] text-violet-200/70">Очки мастерства</div>
            <div className="text-lg font-bold text-violet-200">{masteryState.points}</div>
          </div>
        </div>

        <p className="px-3 text-[11px] leading-relaxed text-white/55">{path?.concept}</p>

        <div className="px-3 pt-3">
          <div className="mb-1 text-xs font-semibold text-white/80">Навыки</div>
          <div className="flex flex-col gap-1.5">
            {skills.map(s => (
              <div key={s.id} className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5">
                <div className="flex items-center gap-1.5 text-sm text-white">
                  <span>{s.emoji}</span>
                  <span className="font-medium">{s.name}</span>
                  <span className="ml-auto text-[10px] text-white/40">
                    {s.kind === 'passive' ? 'пассив' : `CD ${s.cooldownSec}с`}
                    {s.cost > 0 ? ` · ${s.cost}` : ''}
                  </span>
                </div>
                <div className="text-[10px] text-white/45">{s.description}</div>
              </div>
            ))}
            {skills.length === 0 && (
              <div className="text-[11px] text-white/40">Пока нет открытых навыков</div>
            )}
          </div>
        </div>

        {profs.length > 0 && (
          <div className="m-3 rounded-lg border border-amber-600/40 bg-amber-500/10 p-2">
            <div className="mb-1 text-xs font-bold text-amber-200">Испытание 20 ур. — выберите профессию</div>
            <div className="flex flex-col gap-1">
              {profs.map(pid => {
                const p = ALL_PATHS[pid];
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => onChooseProfession?.(pid)}
                    className="rounded border border-white/10 bg-black/30 px-2 py-1.5 text-left text-sm text-white hover:border-amber-400"
                  >
                    {p.emoji} {p.name}
                    <span className="block text-[10px] text-white/45">{p.concept}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {specs.length > 0 && (
          <div className="m-3 rounded-lg border border-violet-600/40 bg-violet-500/10 p-2">
            <div className="mb-1 text-xs font-bold text-violet-200">Испытание 40 ур. — специализация</div>
            {specs.map(sid => {
              const s = ALL_PATHS[sid];
              return (
                <button
                  key={sid}
                  type="button"
                  onClick={() => onChooseSpec?.(sid)}
                  className="mb-1 w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-left text-sm text-white hover:border-violet-400"
                >
                  {s.emoji} {s.name}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-2 p-3">
          {onOpenMastery && (
            <button
              type="button"
              onClick={onOpenMastery}
              className="flex-1 rounded-lg bg-violet-600/80 py-2 text-sm font-medium text-white"
            >
              🌌 Созвездие
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-white/10 py-2 text-sm text-white"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
