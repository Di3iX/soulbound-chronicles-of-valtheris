/**
 * Combat skill bar — reference-style icons with CD overlay.
 * Path: src/classes/ClassSkillBar.tsx
 */
import type { CombatReadySkill } from './classCombatSkills';

interface Props {
  skills: CombatReadySkill[];
  skillsCd: Record<string, number>;
  playerMp: number;
  disabled?: boolean;
  resourceLabel?: string;
  onUse: (skill: CombatReadySkill) => void;
  /** Max slots to show (empty = locked). Default 6. */
  slots?: number;
}

const SLOT_GLOW: Record<string, string> = {
  attack:  'border-orange-500/50 shadow-[0_0_8px_rgba(249,115,22,0.25)]',
  defend:  'border-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.25)]',
  heal:    'border-green-500/50 shadow-[0_0_8px_rgba(34,197,94,0.25)]',
  buff:    'border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.25)]',
  default: 'border-amber-500/40 shadow-[0_0_6px_rgba(245,158,11,0.2)]',
};

function glowFor(sk: CombatReadySkill): string {
  const id = (sk.id || '').toLowerCase();
  const name = (sk.name || '').toLowerCase();
  if (sk.healSelf || name.includes('исцел') || name.includes('heal')) return SLOT_GLOW.heal;
  if (name.includes('защит') || name.includes('щит') || id.includes('guard')) return SLOT_GLOW.defend;
  if (name.includes('рывок') || name.includes('ярость') || name.includes('клич')) return SLOT_GLOW.buff;
  if (sk.kind === 'passive') return SLOT_GLOW.default;
  return SLOT_GLOW.attack;
}

export default function ClassSkillBar({
  skills,
  skillsCd,
  playerMp,
  disabled,
  resourceLabel = 'MP',
  onUse,
  slots = 6,
}: Props) {
  const actives = skills.filter(s => s.kind !== 'passive').slice(0, slots);
  const empty = Math.max(0, slots - actives.length);

  return (
    <div className="flex items-end justify-center gap-1.5 px-1">
      {actives.map(sk => {
        const cd = skillsCd[sk.id] ?? 0;
        const need = sk.manaCost ?? 0;
        const noRes = need > 0 && playerMp < need;
        const busy = cd > 0 || !!disabled || noRes;
        const glow = glowFor(sk);

        return (
          <button
            key={sk.id}
            type="button"
            disabled={busy}
            title={`${sk.name}: ${sk.description}${need ? ` · ${need} ${resourceLabel}` : ''}`}
            onClick={() => onUse(sk)}
            className={`relative flex h-[58px] w-[52px] flex-col items-center justify-end rounded-lg border-2 pb-1 pt-0.5 transition-transform
              ${busy
                ? 'border-white/10 bg-[#121218] opacity-50'
                : `bg-[#1a1520] ${glow} active:scale-95`
              }`}
          >
            {/* icon */}
            <span className="text-[20px] leading-none mb-0.5">{sk.emoji}</span>
            {/* name */}
            <span className="max-w-full truncate px-0.5 text-[8px] font-bold leading-tight text-white/85">
              {sk.name}
            </span>
            {/* cost */}
            {need > 0 && cd <= 0 && (
              <span className="text-[8px] font-mono text-sky-300/90 leading-none mt-[1px]">
                {need}
              </span>
            )}
            {/* CD overlay */}
            {cd > 0 && (
              <span className="absolute inset-0 flex items-center justify-center rounded-[6px] bg-black/65 text-lg font-black text-white tabular-nums">
                {cd}
              </span>
            )}
            {/* not enough resource tint */}
            {noRes && cd <= 0 && (
              <span className="absolute inset-0 rounded-[6px] bg-blue-950/40 pointer-events-none" />
            )}
          </button>
        );
      })}

      {/* locked empty slots */}
      {Array.from({ length: empty }).map((_, i) => (
        <div
          key={`lock-${i}`}
          className="flex h-[58px] w-[52px] flex-col items-center justify-center rounded-lg border-2 border-[#2a2a35] bg-[#0e0e14] opacity-60"
          title="Слот закрыт"
        >
          <span className="text-[18px] text-[#444]">🔒</span>
        </div>
      ))}
    </div>
  );
}
