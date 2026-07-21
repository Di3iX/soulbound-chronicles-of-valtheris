import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { SKILLS } from '../combat';
import { appendLog } from '../game/ui/logger';
import { spawnFloat } from '../utils'; // если есть

export function useCombat() {
  const game = useGameStore();

  const [phase, setPhase] = useState('explore');
  const [activeEnemyId, setActiveEnemyId] = useState<number | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [floatingNums, setFloatingNums] = useState<any[]>([]);
  const [skillsCd, setSkillsCd] = useState<Record<number, number>>({1:0,2:0,3:0,4:0,5:0});

  const log = useCallback((msg: string) => appendLog(setLogs, msg), []);

  const playerAttackTimeout = useRef<NodeJS.Timeout | null>(null);
  const enemyAttackTimeout = useRef<NodeJS.Timeout | null>(null);

  // Combat logic (атаки, навыки, таймеры) — копируй из старого App.tsx в соответствующие места

  const useSkill = useCallback((skill: any) => {
    if (phase !== 'combat') return;
    if (skillsCd[skill.id] > 0) return;

    setSkillsCd(prev => ({ ...prev, [skill.id]: skill.maxCd }));

    // dmg logic, heal, shield — как было в старом коде
    log(`Использован навык: ${skill.name}`);
  }, [phase, skillsCd, log]);

  // useEffect для старта боя, таймеров и т.д.

  return {
    phase,
    activeEnemyId,
    logs,
    floatingNums,
    skillsCd,
    useSkill,
    setPhase,
    setActiveEnemyId,
    setLogs,
  };
}