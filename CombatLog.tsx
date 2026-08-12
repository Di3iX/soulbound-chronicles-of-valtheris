import React from 'react';
import { LogEntry } from '../types/ui';

interface CombatLogProps {
  logs: LogEntry[];
}

/** Scrolling combat log — newest message on top, most recent in bold. */
export default function CombatLog({ logs }: CombatLogProps) {
  return (
    <div className="h-[90px] shrink-0 bg-[#0a0a0f] border-t border-tile-border/80 overflow-y-auto p-2 combat-log-scroll">
      <div className="flex flex-col-reverse justify-end min-h-full">
        {logs.map((log, i) => (
          <div key={log.id} className={`text-[12px] leading-[18px] font-mono ${i === 0 ? 'text-white/90 font-bold' : 'text-[#888]'}`}>
            {log.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
