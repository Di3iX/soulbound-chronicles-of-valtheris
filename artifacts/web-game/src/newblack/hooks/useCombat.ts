import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { SKILLS } from '../combat';
import { appendLog } from '../game/ui/logger';

export const useCombat = () => {
  const game = useGameStore();
  const phaseRef = useRef('explore');
  const activeEnemyIdRef = useRef<number | null>(null);
  const playerAttackTimeout = useRef<NodeJS.Timeout | null>(null);
  const enemyAttackTimeout = useRef<NodeJS.Timeout | null>(null);

  const [phase, setPhase] = useState('explore');
  const [logs, setLogs] = useState([]);
  const [floatingNums, setFloatingNums] = useState([]);
  const [skillsCd, setSkillsCd] = useState({});

  const log = useCallback((msg: string) => {
    appendLog(setLogs, msg);
  }, []);

  // ... (вся боевая логика из старого App.tsx — атаки, навыки, таймеры)

  const useSkill = useCallback((skill) => {
    // логика использования навыка
  }, [game]);

  // useEffect для combat loop

  return {
    phase,
    logs,
    floatingNums,
    skillsCd,
    useSkill,
    // другие значения
  };
};