import React from 'react';
import { Enemy, LocationId } from '../combat';
import { QuestProgress } from '../quests/quests';

interface CombatHUDProps {
  shieldActive:   boolean;
  playerLevel:    number;
  playerHp:       number;
  playerMaxHp:    number;
  activeEnemy:    Enemy | null;
  bossId:         number;
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
  inventoryCount: number;
  questProgress: QuestProgress;

  showCharPanel:    boolean;
  showInventory:    boolean;
  showWorldMap:     boolean;
  showQuestPanel:   boolean;
  showSkillPanel:   boolean;

  onToggleCharPanel:  () => void;
  onToggleInventory:  () => void;
  onToggleWorldMap:   () => void;
  onToggleQuestPanel: () => void;
  onToggleSkillPanel: () => void;
}

/**
 * Top status bar: player/enemy HP, location label, XP bar + gold,
 * and the five panel-toggle buttons (character/inventory/map/quests/skills).
 * Purely presentational — every "close the other panels" decision is made
 * by the caller (App.tsx) inside the on-toggle callbacks.
 */
export default function CombatHUD({
  shieldActive, playerLevel, playerHp, playerMaxHp,
  activeEnemy, bossId, currentLocation, locationMeta,
  livingEnemiesCount, totalEnemiesCount,
  xpPct, playerXp, xpToNext, playerGold,
  statPoints, skillPoints, inventoryCount, questProgress,
  showCharPanel, showInventory, showWorldMap, showQuestPanel, showSkillPanel,
  onToggleCharPanel, onToggleInventory, onToggleWorldMap, onToggleQuestPanel, onToggleSkillPanel,
}: CombatHUDProps) {
  const meta = locationMeta[currentLocation];

  return (
    <div className="shrink-0 border-b border-tile-border bg-[#111116]">

      {/* Row 1 — HP bars */}
      <div className="flex items-center px-4 pt-2 pb-1 justify-between">
        <div className="flex flex-col w-[45%]">
          <div className="flex justify-between items-end mb-1">
            <span className="text-sm font-bold text-white tracking-wide">
              Воин{shieldActive ? ' 🛡️' : ''}
              <span className="text-primary text-xs font-mono ml-1">Lv.{playerLevel}</span>
            </span>
            <span className="text-xs text-primary font-mono">{playerHp}/{playerMaxHp}</span>
          </div>
          <div className="h-[6px] w-full bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border">
            <div className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.round((playerHp / playerMaxHp) * 100)}%` }} />
          </div>
        </div>

        <div className="text-sm font-bold text-[#444] text-center w-[10%]">VS</div>

        <div className="flex flex-col w-[45%]">
          {activeEnemy ? (
            <>
              {activeEnemy.id === bossId && (
                <div className="flex justify-center mb-[2px]">
                  <span className="text-[9px] font-black text-red-500 uppercase tracking-widest animate-pulse">👑 БОСС</span>
                </div>
              )}
              <div className="flex justify-between items-end mb-1">
                <span className={`text-xs font-mono ${activeEnemy.id === bossId ? 'text-red-400' : 'text-destructive'}`}>{activeEnemy.hp}/{activeEnemy.maxHp}</span>
                <span className="text-sm font-bold text-white tracking-wide">{activeEnemy.emoji} {activeEnemy.name}</span>
              </div>
              <div className="h-[6px] w-full bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border flex justify-end">
                <div className={`h-full transition-all duration-300 ${activeEnemy.id === bossId ? 'bg-red-600' : 'bg-destructive'}`}
                  style={{ width: `${Math.round((activeEnemy.hp / activeEnemy.maxHp) * 100)}%` }} />
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-end items-end mb-1">
                {meta.isSafeZone
                  ? <span className="text-xs text-green-700 font-mono">Безопасная зона</span>
                  : <span className="text-xs text-[#666] font-mono">Врагов: {livingEnemiesCount} / {totalEnemiesCount}</span>
                }
              </div>
              <div className="h-[6px] w-full bg-[#1a1a1f] rounded-full border border-tile-border" />
            </>
          )}
        </div>
      </div>

      {/* Row 1b — Location name */}
      <div className="flex items-center justify-center gap-2 pb-[2px]">
        <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest">
          {meta.emoji} {meta.label}
        </span>
        {meta.isSafeZone && (
          <span className="text-[9px] text-green-800 font-bold">· Безопасная зона</span>
        )}
      </div>

      {/* Row 2 — XP bar + gold + panel buttons */}
      <div className="flex items-center px-4 pb-2 gap-2">
        <span className="text-[10px] text-[#555] font-bold uppercase tracking-wide shrink-0">Опыт</span>
        <div className="flex-1 h-[5px] bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border">
          <div className="h-full rounded-full transition-all duration-500 bg-[#3a8fc4]" style={{ width: `${xpPct}%` }} />
        </div>
        <span className="text-[10px] font-mono text-[#666] shrink-0">{playerXp}/{xpToNext}</span>
        <span className="text-[11px] font-bold text-yellow-400 shrink-0">💰{playerGold}</span>

        {/* Персонаж button */}
        <button
          onClick={onToggleCharPanel}
          className={`shrink-0 flex items-center gap-1 px-2 py-[3px] rounded border text-[11px] font-bold transition-colors
            ${showCharPanel ? 'bg-primary/20 border-primary text-primary' : 'bg-[#1e1e28] border-tile-border text-[#aaa]'}`}>
          {statPoints > 0 && (
            <span className="w-[14px] h-[14px] rounded-full bg-primary text-[#111] text-[9px] font-black flex items-center justify-center leading-none">{statPoints}</span>
          )}
          👤
        </button>

        {/* Инвентарь button */}
        <button
          onClick={onToggleInventory}
          className={`shrink-0 flex items-center gap-1 px-2 py-[3px] rounded border text-[11px] font-bold transition-colors
            ${showInventory ? 'bg-primary/20 border-primary text-primary' : 'bg-[#1e1e28] border-tile-border text-[#aaa]'}`}>
          {inventoryCount > 0 && (
            <span className="w-[14px] h-[14px] rounded-full bg-[#3a3a50] text-white text-[9px] font-black flex items-center justify-center leading-none">{inventoryCount}</span>
          )}
          🎒
        </button>

        {/* Карта мира button */}
        <button
          onClick={onToggleWorldMap}
          className={`shrink-0 flex items-center gap-1 px-2 py-[3px] rounded border text-[11px] font-bold transition-colors
            ${showWorldMap ? 'bg-primary/20 border-primary text-primary' : 'bg-[#1e1e28] border-tile-border text-[#aaa]'}`}>
          🗺
        </button>

        {/* Задания button */}
        <button
          onClick={onToggleQuestPanel}
          className={`shrink-0 flex items-center gap-1 px-2 py-[3px] rounded border text-[11px] font-bold transition-colors
            ${showQuestPanel ? 'bg-primary/20 border-primary text-primary' : 'bg-[#1e1e28] border-tile-border text-[#aaa]'}`}>
          {Object.values(questProgress).some(e => e.status === 'active') && (
            <span className="w-[14px] h-[14px] rounded-full bg-[#c89628] text-[#111] text-[9px] font-black flex items-center justify-center leading-none">!</span>
          )}
          📜
        </button>

        {/* Умения button */}
        <button
          onClick={onToggleSkillPanel}
          className={`shrink-0 flex items-center gap-1 px-2 py-[3px] rounded border text-[11px] font-bold transition-colors
            ${showSkillPanel ? 'bg-primary/20 border-primary text-primary' : 'bg-[#1e1e28] border-tile-border text-[#aaa]'}`}>
          {skillPoints > 0 && (
            <span className="w-[14px] h-[14px] rounded-full bg-primary text-[#111] text-[9px] font-black flex items-center justify-center leading-none animate-pulse">
              {skillPoints}
            </span>
          )}
          🌟
        </button>
      </div>
    </div>
  );
}
