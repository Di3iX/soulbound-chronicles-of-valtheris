/**
 * Step 1 UI: choose starting archetype (new game / reset).
 * Drop into src/classes/ClassSelectPanel.tsx
 */
import {
  ARCHETYPE_LIST,
  type ArchetypeId,
} from './playerClass';
import { ALL_PATHS } from './classSystem';

interface Props {
  onSelect: (archetype: ArchetypeId) => void;
  onCancel?: () => void;
}

const ROLE_HINT: Record<ArchetypeId, string> = {
  warrior: 'Ближний бой · Ярость · Танк / урон',
  ranger:  'Дальний бой · Фокус · Контроль',
  mage:    'Магия · Мана · AoE / бурст',
  acolyte: 'Поддержка · Вера · Хил / гибрид',
};

export default function ClassSelectPanel({ onSelect, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-3">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-amber-700/50 bg-[#12101a] shadow-2xl">
        <div className="sticky top-0 border-b border-white/10 bg-[#1a1525] px-4 py-3">
          <h2 className="text-center text-lg font-bold text-amber-200">Выбор пути</h2>
          <p className="mt-1 text-center text-[11px] text-white/50">
            Архетип до 20 уровня. Профессию выберете после испытания.
          </p>
        </div>

        <div className="flex flex-col gap-2 p-3">
          {ARCHETYPE_LIST.map(id => {
            const path = ALL_PATHS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className="rounded-lg border border-white/10 bg-white/5 p-3 text-left transition hover:border-amber-500/60 hover:bg-amber-500/10 active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{path.emoji}</span>
                  <div>
                    <div className="font-bold text-white">{path.name}</div>
                    <div className="text-[11px] text-amber-200/80">{ROLE_HINT[id]}</div>
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-snug text-white/60 line-clamp-3">
                  {path.concept}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">
                    {path.resourceName}
                  </span>
                  {path.weapons.slice(0, 2).map(w => (
                    <span key={w} className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                      {w}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {onCancel && (
          <div className="border-t border-white/10 p-3">
            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-lg py-2 text-sm text-white/50 hover:text-white"
            >
              Отмена
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
