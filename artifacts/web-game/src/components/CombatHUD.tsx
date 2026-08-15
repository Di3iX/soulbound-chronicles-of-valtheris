import React from 'react';
import { Enemy, LocationId, StatusEffect, STATUS_EFFECT_DEFS, ENEMY_RARITY_DEFS } from '../combat';
import { QuestProgress, getActiveQuests } from '../quests/quests';
import { MONSTER_DEFS } from '../monsters';

interface CombatHUDProps {
  shieldActive:   boolean;
  playerLevel:    number;
  playerHp:       number;
  playerMaxHp:    number;
  playerMp:       number;
  playerMaxMp:    number;
  playerStatusEffects: StatusEffect[];
  activeEnemy:    Enemy | null;
  bossId?:        number;
  bossIds?:       number[];
  currentLocation: LocationId;
  locationMeta:   Record<LocationId, { emoji: string; label: string; isSafeZone: boolean }>;
  livingEnemiesCount: number;
  totalEnemiesCount:  number;
  xpPct:      number;
  playerXp:   number;
  xpToNext:   number;
  playerGold: number;

  statPoints:  number;
  skillPoints: number;
  classPointsBadge: number;
  inventoryCount: number;
  questProgress: QuestProgress;

  showCharPanel:    boolean;
  showInventory:    boolean;
  showWorldMap:     boolean;
  showQuestPanel:   boolean;
  showSkillPanel:   boolean;
  showClassPanel:   boolean;

  onToggleCharPanel:  () => void;
  onToggleInventory:  () => void;
  onToggleWorldMap:   () => void;
  onToggleQuestPanel: () => void;
  onToggleSkillPanel: () => void;
  onToggleClassPanel: () => void;
}

/** Compact top bar inspired by classic tile MMOs — avatar + bars + icon strip. */
export default function CombatHUD({
  shieldActive, playerLevel, playerHp, playerMaxHp, playerMp, playerMaxMp, playerStatusEffects,
  activeEnemy, bossId, bossIds, currentLocation, locationMeta,
  livingEnemiesCount, totalEnemiesCount,
  xpPct, playerXp, xpToNext, playerGold,
  statPoints, skillPoints, classPointsBadge, inventoryCount, questProgress,
  showCharPanel, showInventory, showWorldMap, showQuestPanel, showSkillPanel, showClassPanel,
  onToggleCharPanel, onToggleInventory, onToggleWorldMap, onToggleQuestPanel, onToggleSkillPanel, onToggleClassPanel,
}: CombatHUDProps) {
  const meta = locationMeta[currentLocation];
  const bossIdSet = new Set(bossIds ?? (bossId != null ? [bossId] : []));
  const isBoss = (e: Enemy | null) => !!e && bossIdSet.has(e.id);
  const enemyDef = activeEnemy ? MONSTER_DEFS[activeEnemy.name] : undefined;
  const enemyLevel = enemyDef?.level;
  const enemyHpPct = activeEnemy
    ? Math.round((activeEnemy.hp / Math.max(1, activeEnemy.maxHp)) * 100)
    : 0;
  const hpPct = Math.round((playerHp / Math.max(1, playerMaxHp)) * 100);
  const mpPct = Math.round((playerMp / Math.max(1, playerMaxMp)) * 100);
  const hasActiveQuest = Object.values(questProgress).some(e => e.status === 'active');

  const btn = (active: boolean) =>
    `relative flex flex-col items-center justify-center w-[36px] h-[34px] rounded-md border text-[15px] transition-colors active:scale-95
     ${active
       ? 'bg-primary/20 border-primary text-primary shadow-[0_0_8px_rgba(200,150,42,0.25)]'
       : 'bg-[#1a1a22] border-[#2a2a35] text-[#9aa]'}`;

  const Badge = ({ n, pulse }: { n: number; pulse?: boolean }) =>
    n > 0 ? (
      <span className={`absolute -top-1 -right-1 min-w-[14px] h-[14px] px-[2px] rounded-full bg-primary text-[#111] text-[8px] font-black flex items-center justify-center leading-none ${pulse ? 'animate-pulse' : ''}`}>
        {n > 99 ? '99+' : n}
      </span>
    ) : null;

  return (
    <div className="shrink-0 border-b border-[#1e1e28] bg-gradient-to-b from-[#12121a] to-[#0c0c12]">

      {/* Row 1: avatar + identity + currencies */}
      <div className="flex items-center gap-2 px-2 pt-1.5 pb-1">
        <div className="relative shrink-0 w-[44px] h-[44px] rounded-full border-2 border-primary/70 bg-[#1a1520] flex items-center justify-center shadow-[0_0_10px_rgba(200,150,42,0.2)]">
          <span className="text-[22px] leading-none">{shieldActive ? '🛡️' : '⚔️'}</span>
          <span className="absolute -bottom-0.5 -right-0.5 bg-primary text-[#111] text-[9px] font-black rounded px-[3px] leading-tight border border-[#111]">
            {playerLevel}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-1">
            <span className="text-[12px] font-bold text-white truncate tracking-wide">Воин</span>
            <span className="text-[10px] text-[#888] font-mono shrink-0">
              {meta?.emoji} {meta?.label}
            </span>
          </div>

          <div className="h-[3px] w-full bg-[#1a1a1f] rounded-full overflow-hidden mt-[2px] mb-[3px] border border-[#222]">
            <div className="h-full bg-amber-400/90 transition-all duration-300" style={{ width: `${Math.round(xpPct)}%` }} />
          </div>

          <div className="flex items-center gap-1 mb-[2px]">
            <span className="text-[9px] leading-none">❤️</span>
            <div className="flex-1 h-[8px] bg-[#1a0a0a] rounded-sm overflow-hidden border border-red-950/80">
              <div className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300" style={{ width: `${hpPct}%` }} />
            </div>
            <span className="text-[9px] font-mono text-red-300 tabular-nums w-[52px] text-right shrink-0">
              {playerHp}/{playerMaxHp}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[9px] leading-none">💙</span>
            <div className="flex-1 h-[7px] bg-[#0a0a1a] rounded-sm overflow-hidden border border-blue-950/80">
              <div className="h-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-300" style={{ width: `${mpPct}%` }} />
            </div>
            <span className="text-[9px] font-mono text-blue-300 tabular-nums w-[52px] text-right shrink-0">
              {playerMp}/{playerMaxMp}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-0.5 pl-1">
          <div className="flex items-center gap-1 bg-[#1a1a12] border border-yellow-900/40 rounded px-1.5 py-[2px]">
            <span className="text-[11px]">🪙</span>
            <span className="text-[11px] font-bold text-yellow-400 font-mono tabular-nums">{playerGold}</span>
          </div>
          <span className="text-[8px] text-[#555] font-mono">
            {livingEnemiesCount}/{totalEnemiesCount} 👾
          </span>
        </div>
      </div>

      {playerStatusEffects.length > 0 && (
        <div className="flex gap-1 px-2 pb-0.5">
          {playerStatusEffects.map(e => {
            const def = STATUS_EFFECT_DEFS[e.type];
            return (
              <span key={e.type} title={def.label}
                className="flex items-center gap-[1px] text-[9px] font-mono bg-black/40 rounded px-[3px] py-[1px] border border-tile-border/50">
                {def.icon}{Math.ceil(e.remainingMs / 1000)}
              </span>
            );
          })}
        </div>
      )}

      {activeEnemy && (
        <div className="mx-2 mb-1 px-2 py-1 rounded-md bg-[#140a0a]/90 border border-red-900/40">
          <div className="flex items-center justify-between gap-2 mb-[2px]">
            <span className="text-[11px] font-bold text-red-300 truncate">
              {isBoss(activeEnemy) && '👑 '}
              {activeEnemy.emoji} {activeEnemy.name}
              {enemyLevel != null && <span className="text-[9px] text-[#888] font-mono ml-1">Ур.{enemyLevel}</span>}
            </span>
            <span className="text-[10px] font-mono text-red-200 tabular-nums shrink-0">
              {activeEnemy.hp}/{activeEnemy.maxHp}
            </span>
          </div>
          <div className="h-[6px] w-full bg-[#1a0a0a] rounded-sm overflow-hidden border border-red-950">
            <div
              className={`h-full transition-all duration-300 ${isBoss(activeEnemy) ? 'bg-gradient-to-r from-red-800 to-amber-500' : 'bg-gradient-to-r from-red-800 to-red-500'}`}
              style={{ width: `${enemyHpPct}%` }}
            />
          </div>
          {!isBoss(activeEnemy) && activeEnemy.rarity !== 'common' && (
            <div className="text-[8px] font-black uppercase tracking-wider mt-0.5 text-right"
              style={{ color: ENEMY_RARITY_DEFS[activeEnemy.rarity].color }}>
              {ENEMY_RARITY_DEFS[activeEnemy.rarity].emoji} {ENEMY_RARITY_DEFS[activeEnemy.rarity].label}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-1 px-2 pb-1.5 pt-0.5">
        <button type="button" onClick={onToggleCharPanel} className={btn(showCharPanel)} title="Персонаж">
          <Badge n={statPoints} pulse />
          👤
        </button>
        <button type="button" onClick={onToggleInventory} className={btn(showInventory)} title="Инвентарь">
          <span className="text-[9px] absolute bottom-0 right-0.5 text-[#666] font-mono leading-none">{inventoryCount || ''}</span>
          🎒
        </button>
        <button type="button" onClick={onToggleQuestPanel} className={btn(showQuestPanel)} title="Задания">
          {hasActiveQuest && (
            <span className="absolute -top-1 -right-1 w-[12px] h-[12px] rounded-full bg-[#c89628] text-[#111] text-[8px] font-black flex items-center justify-center leading-none">!</span>
          )}
          📜
        </button>
        <button type="button" onClick={onToggleWorldMap} className={btn(showWorldMap)} title="Карта">
          🗺️
        </button>
        <button type="button" onClick={onToggleSkillPanel} className={btn(showSkillPanel)} title="Умения">
          <Badge n={skillPoints} pulse />
          ✨
        </button>
        <button type="button" onClick={onToggleClassPanel} className={btn(showClassPanel)} title="Класс">
          <Badge n={classPointsBadge} pulse />
          ⚔️
        </button>
      </div>

      {(() => {
        const active = getActiveQuests(questProgress).slice(0, 2);
        if (active.length === 0) return null;
        return (
          <div className="px-2 pb-1.5 space-y-[2px]">
            {active.map(q => (
              <div
                key={q.id}
                className={`flex items-center justify-between gap-2 text-[9px] font-mono rounded px-1.5 py-[2px] border ${
                  q.ready
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-tile-border/40 bg-[#0a0a12]/90 text-[#9ab]'
                }`}
              >
                <span className="truncate">📜 {q.title}</span>
                <span className="shrink-0 tabular-nums">
                  {q.ready ? '✓ сдать' : `${q.current}/${q.required}`}
                </span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
