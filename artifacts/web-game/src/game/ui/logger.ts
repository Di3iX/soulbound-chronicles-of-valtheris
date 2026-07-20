import { LogEntry } from '../types/ui';

export function addLog(
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>,
  msg: string
) {
  setLogs(prev => [
    { id: Date.now() + Math.random(), msg },
    ...prev,
  ].slice(0, 12));
}