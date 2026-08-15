/**
 * Compact combat footer: resource + skills + legendary + potion.
 * Path: src/components/CombatControls.tsx
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
    <div className="shrink-0 border-t border-[#1e1e28] bg-gradient-to-t from-[#0a0a10] to-[#101018] px-1.5 pt-1 pb-1.5">
      {classState && (
        <ResourceBar resource={classResource} className="px-1 mb-1" />
      )}

      <div className="flex items-end justify-center gap-1.5">
        <ClassSkillBar
          skills={classSkills}
          skillsCd={skillsCd}
          playerMp={classResource.current}
          resourceLabel={classResource.name}
          onUse={onUseSkill}
          slots={5}
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
          className={`relative flex h-[58px] w-[48px] flex-col items-center justify-center rounded-lg border-2 shrink-0
            ${canUsePotion
              ? 'border-green-600/70 bg-[#122016] shadow-[0_0_8px_rgba(34,197,94,0.3)] active:scale-95'
              : 'border-[#2a2a35] bg-[#0e0e14] opacity-45 cursor-not-allowed'}`}
        >
          <span className="text-[20px] leading-none">🧪</span>
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
