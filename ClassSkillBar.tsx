/**
 * Combat skill buttons driven by class skills (or legacy SKILLS).
 */
import type { CombatReadySkill } from './classCombatSkills';

interface Props {
  skills: CombatReadySkill[];
  skillsCd: Record<string, number>;
  playerMp: number;
  disabled?: boolean;
  resourceLabel?: string;
  onUse: (skill: CombatReadySkill) => void;
}

export default function ClassSkillBar({
  skills,
  skillsCd,
  playerMp,
  disabled,
  resourceLabel = 'MP',
  onUse,
}: Props) {
  const actives = skills.filter(s => s.kind !== 'passive');

  return (
    <div className="flex flex-wrap justify-center gap-1.5 px-2 py-1">
      {actives.map(sk => {
        const cd = skillsCd[sk.id] ?? 0;
        const need = sk.manaCost;
        const noRes = need > 0 && playerMp < need;
        const busy = cd > 0 || disabled || noRes;

        return (
          <button
            key={sk.id}
            type="button"
            disabled={busy}
            title={`${sk.name}: ${sk.description}${need ? ` · ${need} ${resourceLabel}` : ''}`}
            onClick={() => onUse(sk)}
            className={`relative flex h-12 min-w-[3rem] flex-col items-center justify-center rounded-lg border px-1.5 text-center ${
              busy
                ? 'border-white/10 bg-black/40 opacity-45'
                : 'border-amber-500/40 bg-amber-500/15 active:scale-95'
            }`}
          >
            <span className="text-base leading-none">{sk.emoji}</span>
            <span className="max-w-[4.5rem] truncate text-[9px] text-white/80">{sk.name}</span>
            {cd > 0 && (
              <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/55 text-sm font-bold text-white">
                {cd}
              </span>
            )}
            {need > 0 && cd <= 0 && (
              <span className="text-[8px] text-sky-300/80">{need}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
