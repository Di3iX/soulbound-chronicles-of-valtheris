// ─── QUEST DIALOGUE OVERLAY ─────────────────────────────────────────────────────
// Extracted from App.tsx: pure presentational — renders an NpcDialogue (name,
// emoji, lines, action buttons) as a bottom-sheet overlay. No state of its own.
import type { NpcDialogue, DialogAction } from '../quests/npc';

interface QuestDialogueOverlayProps {
  dialogue: NpcDialogue;
  onClose: () => void;
  onAction: (action: DialogAction) => void;
}

export default function QuestDialogueOverlay({ dialogue, onClose, onAction }: QuestDialogueOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-[70] bg-black/85 flex flex-col justify-end rounded px-3 pb-3 pt-8 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full bg-[#0d0d16] border border-tile-border/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92%]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111118] border-b border-tile-border/60 shrink-0">
          <span className="text-xl leading-none">{dialogue.emoji}</span>
          <span className="text-sm font-bold text-primary tracking-wide flex-1">{dialogue.name}</span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-tile-border bg-[#1a1a24] text-[#aaa] text-sm font-bold active:scale-95"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        {/* Текст + кнопки В ОДНОМ скролле */}
        <div className="overflow-y-auto min-h-0 flex-1 overscroll-contain">
          <div className="px-4 py-3 space-y-1">
            {dialogue.lines.map((line, i) => (
              <p key={i} className="text-[12px] text-[#ccc] leading-relaxed italic">
                {i === 0 && '«'}{line}{i === dialogue.lines.length - 1 && '»'}
              </p>
            ))}
          </div>
          <div className="px-4 pb-3 pt-1 flex flex-col gap-[6px] border-t border-tile-border/40">
            {dialogue.buttons.map((btn, i) => (
              <button
                key={i}
                type="button"
                disabled={!!btn.disabled}
                onClick={() => { if (!btn.disabled) onAction(btn.action); }}
                className={`w-full py-2.5 rounded-lg border font-bold text-[12px] active:scale-95 transition-transform ${
                  btn.disabled
                    ? 'border-tile-border bg-[#0a0a10] text-[#444] opacity-60 cursor-not-allowed'
                    : btn.primary
                      ? 'border-primary bg-primary/20 text-primary shadow-[0_0_8px_rgba(200,150,42,0.2)]'
                      : 'border-tile-border bg-[#111118] text-[#ccc]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
