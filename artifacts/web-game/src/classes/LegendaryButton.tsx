/**
 * Button to activate current path legendary talent.
 */
import { useEffect, useState } from 'react';
import type { PlayerClassState } from './playerClass';
import {
  type LegendaryState,
  legendaryForPath,
  canActivateLegendary,
  activateLegendary,
  legendaryCooldownLeft,
  isLegendaryUnlocked,
} from './legendaryTalents';

interface Props {
  classState: PlayerClassState | null;
  level: number;
  legendaryState: LegendaryState;
  onChange: (next: LegendaryState) => void;
  onLog?: (msg: string) => void;
  disabled?: boolean;
}

export default function LegendaryButton({
  classState,
  level,
  legendaryState,
  onChange,
  onLog,
  disabled,
}: Props) {
  const def = legendaryForPath(classState);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 500);
    return () => clearInterval(t);
  }, []);

  if (!def || !classState) return null;

  const unlocked = isLegendaryUnlocked(def, level, classState);
  const check = canActivateLegendary(legendaryState, def, level, classState);
  const cd = legendaryCooldownLeft(legendaryState, def.id);
  const active =
    legendaryState.active &&
    legendaryState.active.id === def.id &&
    legendaryState.active.endsAt > Date.now();

  return (
    <button
      type="button"
      disabled={disabled || !unlocked || !check.ok}
      title={`${def.name}\n${def.description}`}
      onClick={() => {
        const r = canActivateLegendary(legendaryState, def, level, classState);
        if (!r.ok) {
          onLog?.(r.reason ?? 'Нельзя');
          return;
        }
        const next = activateLegendary(legendaryState, def);
        onChange(next);
        onLog?.(`★ ${def.name}!`);
      }}
      className={`relative flex h-12 min-w-[3.2rem] flex-col items-center justify-center rounded-lg border px-1.5 ${
        active
          ? 'border-amber-300 bg-amber-500/30 animate-pulse'
          : check.ok
            ? 'border-amber-500/60 bg-amber-600/20 active:scale-95'
            : 'border-white/10 bg-black/40 opacity-50'
      }`}
    >
      <span className="text-base">★</span>
      <span className="max-w-[4.5rem] truncate text-[8px] text-amber-100">{def.name}</span>
      {cd > 0 && (
        <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 text-xs font-bold text-white">
          {cd}
        </span>
      )}
    </button>
  );
}
