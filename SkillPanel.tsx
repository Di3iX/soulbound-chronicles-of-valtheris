// ─── SKILL PANEL ──────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { SKILL_TREES, SkillDef } from './skills';
import type { SkillProgress } from './skillTree';

interface Props {
  skillProgress: SkillProgress;
  skillPoints:   number;
  onUpgrade:     (skillId: string) => void;
  onClose:       () => void;
}

// ── Pip row ────────────────────────────────────────────────────────────────────
function LevelPips({ current, max }: { current: number; max: number }) {
  return (
    <div className="flex gap-[4px] items-center">
      {Array.from({ length: max }, (_, i) => (
        <div key={i}
          className={`w-[10px] h-[10px] rounded-full border transition-colors ${
            i < current
              ? 'bg-primary border-primary shadow-[0_0_4px_rgba(200,150,42,0.5)]'
              : 'bg-[#1a1a1f] border-tile-border'
          }`} />
      ))}
    </div>
  );
}

// ── Single skill card ──────────────────────────────────────────────────────────
function SkillCard({
  def, currentLevel, skillPoints, onUpgrade,
}: { def: SkillDef; currentLevel: number; skillPoints: number; onUpgrade: () => void }) {
  const isMaxed   = currentLevel >= def.maxLevel;
  const canUpgrade = !isMaxed && skillPoints >= def.cost;

  return (
    <div className={`rounded-xl border px-4 py-3 transition-all ${
      isMaxed
        ? 'border-primary/50 bg-primary/5'
        : currentLevel > 0
          ? 'border-tile-border/60 bg-[#0f0f18]'
          : 'border-tile-border/30 bg-[#0a0a10]'
    }`}>

      {/* Top row — name + level fraction */}
      <div className="flex items-start justify-between gap-2 mb-[6px]">
        <span className={`text-[13px] font-bold leading-tight ${isMaxed ? 'text-primary' : 'text-[#ccc]'}`}>
          {def.name}
        </span>
        <span className={`shrink-0 text-[10px] font-mono font-bold tabular-nums ${
          isMaxed ? 'text-primary' : currentLevel > 0 ? 'text-[#aaa]' : 'text-[#444]'
        }`}>
          {currentLevel} / {def.maxLevel}
        </span>
      </div>

      {/* Level pips */}
      <div className="mb-[8px]">
        <LevelPips current={currentLevel} max={def.maxLevel} />
      </div>

      {/* Description */}
      <p className="text-[11px] text-[#666] leading-snug mb-3">{def.description}</p>

      {/* Upgrade button */}
      {isMaxed ? (
        <div className="flex items-center justify-center py-[5px] rounded-lg border border-primary/30 bg-primary/10">
          <span className="text-[11px] font-bold text-primary">✓ Максимум</span>
        </div>
      ) : (
        <button
          onClick={onUpgrade}
          disabled={!canUpgrade}
          className={`w-full py-[6px] rounded-lg border text-[12px] font-bold transition-all active:scale-95 ${
            canUpgrade
              ? 'border-primary bg-primary/20 text-primary hover:bg-primary/30 shadow-[0_0_8px_rgba(200,150,42,0.15)]'
              : 'border-tile-border bg-[#111118] text-[#444] cursor-not-allowed'
          }`}>
          {canUpgrade
            ? `⬆ Улучшить (1 очко)`
            : skillPoints === 0
              ? 'Нет очков умений'
              : `Уровень ${currentLevel}`}
        </button>
      )}
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────
export default function SkillPanel({ skillProgress, skillPoints, onUpgrade, onClose }: Props) {
  const [activeTree, setActiveTree] = useState<'warrior' | 'ranger' | 'mage'>('warrior');

  const tree = SKILL_TREES.find(t => t.id === activeTree)!;

  return (
    <div className="absolute inset-0 z-[60] bg-[#08080d]/97 flex flex-col rounded backdrop-blur-md">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-tile-border shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-primary tracking-wide">🌟 Умения</h2>
          {/* Skill-points counter */}
          <div className={`flex items-center gap-1 px-2 py-[2px] rounded border text-[11px] font-bold tabular-nums ${
            skillPoints > 0
              ? 'border-primary/60 bg-primary/10 text-primary'
              : 'border-tile-border bg-[#111118] text-[#444]'
          }`}>
            {skillPoints > 0 && <span className="animate-pulse">★</span>}
            {skillPoints} {skillPoints === 1 ? 'очко' : skillPoints < 5 ? 'очка' : 'очков'}
          </div>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded border border-tile-border text-[#888] hover:text-white hover:border-primary transition-colors text-sm font-bold">
          ✕
        </button>
      </div>

      {/* ── Tree tabs ──────────────────────────────────────────────────────── */}
      <div className="flex border-b border-tile-border shrink-0">
        {SKILL_TREES.map(t => {
          const invested = t.skills.reduce((sum, s) => sum + (skillProgress[s.id] ?? 0), 0);
          return (
            <button key={t.id}
              onClick={() => setActiveTree(t.id)}
              className={`flex-1 flex flex-col items-center py-2 gap-[1px] transition-colors border-b-2 ${
                activeTree === t.id
                  ? 'text-primary border-primary bg-primary/5'
                  : 'text-[#555] border-transparent hover:text-[#aaa]'
              }`}>
              <span className="text-base leading-none">{t.emoji}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide">{t.name}</span>
              {invested > 0 && (
                <span className={`text-[9px] font-mono ${activeTree === t.id ? 'text-primary' : 'text-[#555]'}`}>
                  {invested} / {t.skills.reduce((s, sk) => s + sk.maxLevel, 0)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Skill cards ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
        {tree.skills.map(def => (
          <SkillCard
            key={def.id}
            def={def}
            currentLevel={skillProgress[def.id] ?? 0}
            skillPoints={skillPoints}
            onUpgrade={() => onUpgrade(def.id)}
          />
        ))}
      </div>

      {/* ── Footer hint ────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-2 border-t border-tile-border/30 flex items-center justify-center">
        <span className="text-[9px] text-[#2a2a35] font-mono uppercase tracking-widest">
          +{SKILL_TREES.length > 0 ? 1 : 0} очко за уровень · пассивные бонусы
        </span>
      </div>

    </div>
  );
}
