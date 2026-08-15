/**
 * Compact combat controls — fixed height so the map area stays stable.
 * Path: artifacts/web-game/src/components/CombatControls.tsx
 */
import type { CombatReadySkill } from '../classes/classCombatSkills';
import type { ClassResourceState } from '../classes/classResource';
import type { PlayerClassState } from '../classes/playerClass';
import type { LegendaryState } from '../classes/legendaryTalents';
import ResourceBar from '../classes/ResourceBar';
import ClassSkillBar from '../classes/ClassSkillBar';
import LegendaryButton from '../classes/LegendaryButton';

interface Props {
  classState: PlayerClassState | null;
  classResource: ClassResourceState;
  classSkills: CombatReadySkill[];
  skillsCd: Record<string, number>;
  onUseSkill: (sk: CombatReadySkill) => void;
  playerLevel: number;
  legendaryState: LegendaryState;
  onLegendaryChange: (next: LegendaryState) => void;
  onLog: (msg: string) => void;
  onUsePotion: () => void;
  potionCount: number;
  canUsePotion: boolean;
}

export default function CombatControls({
  classState,
  classResource,
  classSkills,
  skillsCd,
  onUseSkill,
  playerLevel,
  legendaryState,
  onLegendaryChange,
  onLog,
  onUsePotion,
  potionCount,
  canUsePotion,
}: Props) {
  return (
    <div className="shrink-0 border-t border-tile-border/50 bg-[#0c0c10] px-1.5 pt-1 pb-1.5">
      {classState && (
        <ResourceBar resource={classResource} className="px-1 mb-1" />
      )}

      <div className="flex items-end justify-center gap-1.5 flex-wrap">
        <ClassSkillBar
          skills={classSkills}
          skillsCd={skillsCd}
          playerMp={classResource.current}
          resourceLabel={classResource.name}
          onUse={onUseSkill}
        />
        <LegendaryButton
          classState={classState}
          level={playerLevel}
          legendaryState={legendaryState}
          onChange={onLegendaryChange}
          onLog={onLog}
          disabled={false}
        />
        <button
          type="button"
          disabled={!canUsePotion}
          onClick={onUsePotion}
          className={`relative flex flex-col items-center justify-center w-[52px] h-[52px] shrink-0 rounded-lg bg-[#1e1e28] border
            ${canUsePotion
              ? 'border-green-600 shadow-[0_0_8px_rgba(34,197,94,0.35)] active:scale-95'
              : 'border-tile-border opacity-50 cursor-not-allowed'}`}
        >
          <span className="text-lg leading-none">🧪</span>
          <span className="text-[8px] font-bold text-white/80 mt-0.5">Зелье</span>
          {potionCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-green-600 text-white text-[9px] font-black flex items-center justify-center leading-none">
              {potionCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
