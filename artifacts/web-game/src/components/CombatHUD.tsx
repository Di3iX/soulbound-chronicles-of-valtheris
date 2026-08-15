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

/** Compact top HUD — tight avatar + thin bars + small icon row. */
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
    `relative flex items-center justify-center w-[28px] h-[28px] rounded border text-[13px] transition-colors active:scale-95
     ${active
       ? 'bg-primary/20 border-primary text-primary'
       : 'bg-[#1a1a22] border-[#2a2a35] text-[#9aa]'}`;

  const Badge = ({ n, pulse }: { n: number; pulse?: boolean }) =>
    n > 0 ? (
      <span className={`absolute -top-1 -right-1 min-w-[12px] h-[12px] px-[2px] rounded-full bg-primary text-[#111] text-[7px] font-black flex items-center justify-center leading-none ${pulse ? 'animate-pulse' : ''}`}>
        {n > 99 ? '99+' : n}
      </span>
    ) : null;

  return (
    <div className="shrink-0 border-b border-[#1e1e28] bg-[#0e0e14]">

      {/* Row 1 — avatar + bars + gold */}
      <div className="flex items-center gap-1.5 px-1.5 pt-1 pb-0.5">
        <div className="relative shrink-0 w-[32px] h-[32px] rounded-full border border-primary/60 bg-[#1a1520] flex items-center justify-center">
          <span className="text-[15px] leading-none">{shieldActive ? '🛡️' : '⚔️'}</span>
          <span className="absolute -bottom-0.5 -right-0.5 bg-primary text-[#111] text-[8px] font-black rounded px-[2px] leading-tight">
            {playerLevel}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-1 leading-none">
            <span className="text-[11px] font-bold text-white truncate">Воин</span>
            <span className="text-[9px] text-[#666] font-mono shrink-0 truncate max-w-[40%]">
              {meta?.emoji} {meta?.label}
            </span>
          </div>
          {/* XP */}
          <div className="h-[2px] w-full bg-[#1a1a1f] rounded-full overflow-hidden mt-[2px] mb-[2px]">
            <div className="h-full bg-amber-400/80 transition-all duration-300" style={{ width: `${Math.round(xpPct)}%` }} />
          </div>
          {/* HP */}
          <div className="flex items-center gap-0.5 mb-[1px]">
            <span className="text-[8px] leading-none w-[10px]">❤️</span>
            <div className="flex-1 h-[5px] bg-[#1a0a0a] rounded-sm overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300" style={{ width: `${hpPct}%` }} />
            </div>
            <span className="text-[8px] font-mono text-red-300/90 tabular-nums w-[44px] text-right shrink-0">
              {playerHp}/{playerMaxHp}
            </span>
          </div>
          {/* MP */}
          <div className="flex items-center gap-0.5">
            <span className="text-[8px] leading-none w-[10px]">💙</span>
            <div className="flex-1 h-[4px] bg-[#0a0a1a] rounded-sm overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-300" style={{ width: `${mpPct}%` }} />
            </div>
            <span className="text-[8px] font-mono text-blue-300/90 tabular-nums w-[44px] text-right shrink-0">
              {playerMp}/{playerMaxMp}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-0 pl-0.5">
          <div className="flex items-center gap-0.5 bg-[#1a1a12] border border-yellow-900/30 rounded px-1 py-[1px]">
            <span className="text-[10px]">🪙</span>
            <span className="text-[10px] font-bold text-yellow-400 font-mono tabular-nums">{playerGold}</span>
          </div>
          <span className="text-[7px] text-[#555] font-mono leading-tight">
            {livingEnemiesCount}/{totalEnemiesCount}
          </span>
        </div>
      </div>

      {playerStatusEffects.length > 0 && (
        <div className="flex gap-0.5 px-1.5 pb-0.5">
          {playerStatusEffects.map(e => {
            const def = STATUS_EFFECT_DEFS[e.type];
            return (
              <span key={e.type} title={def.label}
                className="flex items-center text-[8px] font-mono bg-black/40 rounded px-[2px] border border-tile-border/40">
                {def.icon}{Math.ceil(e.remainingMs / 1000)}
              </span>
            );
          })}
        </div>
      )}

      {/* Enemy — only in combat, one thin line */}
      {activeEnemy && (
        <div className="mx-1.5 mb-0.5 px-1.5 py-0.5 rounded bg-[#140a0a]/90 border border-red-900/30">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-red-300 truncate flex-1">
              {isBoss(activeEnemy) ? '👑 ' : ''}{activeEnemy.emoji} {activeEnemy.name}
              {enemyLevel != null && <span className="text-[8px] text-[#777] font-mono ml-0.5">Ур.{enemyLevel}</span>}
            </span>
            <span className="text-[9px] font-mono text-red-200 tabular-nums shrink-0">
              {activeEnemy.hp}/{activeEnemy.maxHp}
            </span>
          </div>
          <div className="h-[4px] w-full bg-[#1a0a0a] rounded-sm overflow-hidden mt-[2px]">
            <div
              className={`h-full transition-all duration-300 ${isBoss(activeEnemy) ? 'bg-gradient-to-r from-red-800 to-amber-500' : 'bg-red-600'}`}
              style={{ width: `${enemyHpPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Icon toolbar — single compact row */}
      <div className="flex items-center justify-between gap-0.5 px-1.5 pb-1 pt-0.5">
        <button type="button" onClick={onToggleCharPanel} className={btn(showCharPanel)} title="Персонаж">
          <Badge n={statPoints} pulse />
          👤
        </button>
        <button type="button" onClick={onToggleInventory} className={btn(showInventory)} title="Инвентарь">
          {inventoryCount > 0 && (
            <span className="absolute -bottom-0.5 -right-0.5 text-[7px] text-[#666] font-mono leading-none">{inventoryCount}</span>
          )}
          🎒
        </button>
        <button type="button" onClick={onToggleQuestPanel} className={btn(showQuestPanel)} title="Задания">
          {hasActiveQuest && (
            <span className="absolute -top-0.5 -right-0.5 w-[10px] h-[10px] rounded-full bg-[#c89628] text-[#111] text-[7px] font-black flex items-center justify-center leading-none">!</span>
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

      {/* Quests — max 1 line each, only if active */}
      {(() => {
        const active = getActiveQuests(questProgress).slice(0, 1);
        if (active.length === 0) return null;
        return (
          <div className="px-1.5 pb-1">
            {active.map(q => (
              <div
                key={q.id}
                className={`flex items-center justify-between gap-1 text-[8px] font-mono rounded px-1 py-[1px] border ${
                  q.ready
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-tile-border/30 bg-[#0a0a12]/80 text-[#8a9]'
                }`}
              >
                <span className="truncate">📜 {q.title}</span>
                <span className="shrink-0 tabular-nums">{q.ready ? '✓' : `${q.current}/${q.required}`}</span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
