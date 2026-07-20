import type { Dispatch, SetStateAction } from 'react';
import type { LogEntry } from '../types/ui';

export function addLog(
  setLogs: Dispatch<SetStateAction<LogEntry[]>>,
  msg: string
) {
  setLogs(prev => [
    { id: Date.now() + Math.random(), msg },
    ...prev,
  ].slice(0, 12));
}