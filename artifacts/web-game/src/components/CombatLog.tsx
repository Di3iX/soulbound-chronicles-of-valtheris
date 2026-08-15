import React, { useEffect, useState } from 'react';
import { LogEntry } from '../types/ui';

interface CombatLogProps {
  logs: LogEntry[];
  /** When 'combat', shows a compact fight header. */
  phase?: string;
  /** Active enemy name for the fight header. */
  enemyName?: string | null;
  /** Unix ms when current fight started — enables timer. */
  combatStartedAt?: number | null;
}

function lineClass(msg: string, isNewest: boolean): string {
  const base = isNewest ? 'font-semibold' : 'opacity-80';
  if (msg.includes('урона') && (msg.includes('наносит') || msg.includes('Вы ') || msg.includes('нанесли'))) {
    return `${base} text-amber-200/90`;
  }
  if (msg.includes('атакует') || msg.includes('нанёс') || msg.includes('получили')) {
    return `${base} text-red-300/85`;
  }
  if (msg.includes('опыта') || msg.includes('уровен')) {
    return `${base} text-sky-300/90`;
  }
  if (msg.includes('золот') || msg.includes('💰')) {
    return `${base} text-yellow-400/90`;
  }
  if (msg.includes('повержен') || msg.includes('ПОБЕДА')) {
    return `${base} text-green-400/90`;
  }
  if (msg.includes('лут') || msg.includes('📦') || msg.includes('Получен')) {
    return `${base} text-purple-300/90`;
  }
  return isNewest ? 'text-white/90 font-semibold' : 'text-[#7a7a88]';
}

/** Compact scrolling combat log — low height, color-coded lines, optional fight timer. */
export default function CombatLog({
  logs,
  phase,
  enemyName,
  combatStartedAt,
}: CombatLogProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (phase !== 'combat' || !combatStartedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [phase, combatStartedAt]);

  const elapsed =
    phase === 'combat' && combatStartedAt
      ? Math.max(0, Math.floor((now - combatStartedAt) / 1000))
      : null;
  const mm = elapsed != null ? String(Math.floor(elapsed / 60)).padStart(2, '0') : null;
  const ss = elapsed != null ? String(elapsed % 60).padStart(2, '0') : null;

  // Newest first for display (logs usually append; reverse visual)
  const visible = logs.slice(0, 12);

  return (
    <div className="shrink-0 border-t border-[#1e1e28] bg-[#08080c]">
      {phase === 'combat' && enemyName && (
        <div className="flex items-center justify-between px-2 py-[2px] border-b border-[#1a1a22] bg-[#100c10]">
          <span className="text-[9px] font-bold text-red-300/90 truncate tracking-wide">
            ⚔ БОЙ · {enemyName}
          </span>
          {mm != null && ss != null && (
            <span className="text-[9px] font-mono text-[#666] tabular-nums shrink-0">
              {mm}:{ss}
            </span>
          )}
        </div>
      )}

      <div className="h-[56px] overflow-y-auto px-1.5 py-0.5 combat-log-scroll">
        <div className="flex flex-col-reverse justify-end min-h-full">
          {visible.map((log, i) => (
            <div
              key={log.id}
              className={`text-[10px] leading-[14px] font-mono truncate ${lineClass(log.msg, i === 0)}`}
            >
              {log.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
