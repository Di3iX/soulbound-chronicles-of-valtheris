import React, { useState } from 'react';
import { useGameStore } from './store/gameStore';
import { useCombat } from './hooks/useCombat';
import { useWorld } from './hooks/useWorld';

import StatusHeader from './components/game/StatusHeader';
import GameMap from './components/game/GameMap';
import DPad from './components/game/DPad';
import SkillBar from './components/game/SkillBar';
import CombatLog from './components/game/CombatLog';

import ShopPanel from './shop/ShopPanel';
import SkillPanel from './skills/SkillPanel';
import BossVictoryPanel from './boss/BossVictoryPanel';

export default function App() {
  const game = useGameStore();
  const combat = useCombat();
  const world = useWorld();

  const [showShop, setShowShop] = useState(false);
  const [showSkillPanel, setShowSkillPanel] = useState(false);
  const [showBossVictory, setShowBossVictory] = useState(false);

  return (
    <div className="min-h-[100dvh] w-full max-w-[420px] mx-auto bg-background text-foreground flex flex-col relative select-none">
      <StatusHeader game={game} />

      <GameMap game={game} combat={combat} world={world} />

      <DPad onMove={world.movePlayer} disabled={combat.phase !== 'explore'} />

      <SkillBar 
        skillsCd={combat.skillsCd} 
        onUseSkill={combat.useSkill} 
        phase={combat.phase} 
      />

      <CombatLog logs={combat.logs} />

      {/* Overlays */}
      {showShop && <ShopPanel onClose={() => setShowShop(false)} />}
      {showSkillPanel && <SkillPanel onClose={() => setShowSkillPanel(false)} />}
      {showBossVictory && <BossVictoryPanel onContinue={() => setShowBossVictory(false)} />}
    </div>
  );
}