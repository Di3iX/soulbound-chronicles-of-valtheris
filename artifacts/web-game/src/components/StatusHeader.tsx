import React from 'react';
import { LocationId, LOCATION_META } from '../world/locations';
import { BaseStats, ComputedStats } from '../stats';
import { EquipBonuses } from '../equipment';

interface StatusHeaderProps {
  playerLevel: number;
  playerHp: number;
  playerMaxHp: number;
  shieldActive: boolean;
  playerXp: number;
  xpToNext: number;
  playerGold: number;
  currentLocation: LocationId;
  activeEnemyId: number | null;
  activeEnemyHp?: number;
  activeEnemyMaxHp?: number;
  activeEnemyName?: string;
  activeEnemyEmoji?: string;
  livingEnemiesCount: number;
  totalEnemiesCount: number;
  statPoints: number;
  skillPoints: number;
  questProgress: Record<string, any>;
  showCharPanel: boolean;
  showInventory: boolean;
  showWorldMap: boolean;
  showQuestPanel: boolean;
  showSkillPanel: boolean;
  inventoryLength: number;
  onCharPanelToggle: (value: boolean) => void;
  onInventoryToggle: (value: boolean) => void;
  onWorldMapToggle: (value: boolean) => void;
  onQuestPanelToggle: (value: boolean) => void;
  onSkillPanelToggle: (value: boolean) => void;
  onCloseAllPanels: () => void;
}

/**
 * Верхняя панель со статусом игрока, врага и кнопками панелей
 */
export const StatusHeader: React.FC<StatusHeaderProps> = ({
  playerLevel,
  playerHp,
  playerMaxHp,
  shieldActive,
  playerXp,
  xpToNext,
  playerGold,
  currentLocation,
  activeEnemyId,
  activeEnemyHp,
  activeEnemyMaxHp,
  activeEnemyName,
  activeEnemyEmoji,
  livingEnemiesCount,
  totalEnemiesCount,
  statPoints,
  skillPoints,
  questProgress,
  showCharPanel,
  showInventory,
  showWorldMap,
  showQuestPanel,
  showSkillPanel,
  inventoryLength,
  onCharPanelToggle,
  onInventoryToggle,
  onWorldMapToggle,
  onQuestPanelToggle,
  onSkillPanelToggle,
  onCloseAllPanels,
}) => {
  const xpPct = Math.min(100, Math.round((playerXp / xpToNext) * 100));
  const locationMeta = LOCATION_META[currentLocation];
  const isSafeZone = locationMeta.isSafeZone;

  const handleCharPanelClick = () => {
    onCloseAllPanels();
    onCharPanelToggle(!showCharPanel);
  };

  const handleInventoryClick = () => {
    onCloseAllPanels();
    onInventoryToggle(!showInventory);
  };

  const handleWorldMapClick = () => {
    onCloseAllPanels();
    onWorldMapToggle(!showWorldMap);
  };

  const handleQuestPanelClick = () => {
    onCloseAllPanels();
    onQuestPanelToggle(!showQuestPanel);
  };

  const handleSkillPanelClick = () => {
    onCloseAllPanels();
    onSkillPanelToggle(!showSkillPanel);
  };

  const hasActiveQuests = Object.values(questProgress).some((e: any) => e.status === 'active');

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
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.round((playerHp / playerMaxHp) * 100)}%` }}
            />
          </div>
        </div>

        <div className="text-sm font-bold text-[#444] text-center w-[10%]">VS</div>

        <div className="flex flex-col w-[45%]">
          {activeEnemyId !== null && activeEnemyHp !== undefined && activeEnemyMaxHp !== undefined ? (
            <>
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-mono text-destructive">
                  {activeEnemyHp}/{activeEnemyMaxHp}
                </span>
                <span className="text-sm font-bold text-white tracking-wide">
                  {activeEnemyEmoji} {activeEnemyName}
                </span>
              </div>
              <div className="h-[6px] w-full bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border flex justify-end">
                <div
                  className="h-full bg-destructive transition-all duration-300"
                  style={{ width: `${Math.round((activeEnemyHp / activeEnemyMaxHp) * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-end items-end mb-1">
                {isSafeZone ? (
                  <span className="text-xs text-green-700 font-mono">Безопасная зона</span>
                ) : (
                  <span className="text-xs text-[#666] font-mono">
                    Врагов: {livingEnemiesCount} / {totalEnemiesCount}
                  </span>
                )}
              </div>
              <div className="h-[6px] w-full bg-[#1a1a1f] rounded-full border border-tile-border" />
            </>
          )}
        </div>
      </div>

      {/* Row 1b — Location name */}
      <div className="flex items-center justify-center gap-2 pb-[2px]">
        <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest">
          {locationMeta.emoji} {locationMeta.label}
        </span>
        {isSafeZone && <span className="text-[9px] text-green-800 font-bold">· Безопасная зона</span>}
      </div>

      {/* Row 2 — XP bar + gold + panel buttons */}
      <div className="flex items-center px-4 pb-2 gap-2">
        <span className="text-[10px] text-[#555] font-bold uppercase tracking-wide shrink-0">
          Опыт
        </span>
        <div className="flex-1 h-[5px] bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border">
          <div
            className="h-full rounded-full transition-all duration-500 bg-[#3a8fc4]"
            style={{ width: `${xpPct}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-[#666] shrink-0">
          {playerXp}/{xpToNext}
        </span>
        <span className="text-[11px] font-bold text-yellow-400 shrink-0">💰{playerGold}</span>

        {/* Персонаж button */}
        <button
          onClick={handleCharPanelClick}
          className={`shrink-0 flex items-center gap-1 px-2 py-[3px] rounded border text-[11px] font-bold transition-colors
            ${
              showCharPanel
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-[#1e1e28] border-tile-border text-[#aaa]'
            }`}
        >
          {statPoints > 0 && (
            <span className="w-[14px] h-[14px] rounded-full bg-primary text-[#111] text-[9px] font-black flex items-center justify-center leading-none">
              {statPoints}
            </span>
          )}
          👤
        </button>

        {/* Инвентарь button */}
        <button
          onClick={handleInventoryClick}
          className={`shrink-0 flex items-center gap-1 px-2 py-[3px] rounded border text-[11px] font-bold transition-colors
            ${
              showInventory
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-[#1e1e28] border-tile-border text-[#aaa]'
            }`}
        >
          {inventoryLength > 0 && (
            <span className="w-[14px] h-[14px] rounded-full bg-[#3a3a50] text-white text-[9px] font-black flex items-center justify-center leading-none">
              {inventoryLength}
            </span>
          )}
          🎒
        </button>

        {/* Карта мира button */}
        <button
          onClick={handleWorldMapClick}
          className={`shrink-0 flex items-center gap-1 px-2 py-[3px] rounded border text-[11px] font-bold transition-colors
            ${
              showWorldMap
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-[#1e1e28] border-tile-border text-[#aaa]'
            }`}
        >
          🗺
        </button>

        {/* Задания button */}
        <button
          onClick={handleQuestPanelClick}
          className={`shrink-0 flex items-center gap-1 px-2 py-[3px] rounded border text-[11px] font-bold transition-colors
            ${
              showQuestPanel
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-[#1e1e28] border-tile-border text-[#aaa]'
            }`}
        >
          {hasActiveQuests && (
            <span className="w-[14px] h-[14px] rounded-full bg-[#c89628] text-[#111] text-[9px] font-black flex items-center justify-center leading-none">
              !
            </span>
          )}
          📜
        </button>

        {/* Умения button */}
        <button
          onClick={handleSkillPanelClick}
          className={`shrink-0 flex items-center gap-1 px-2 py-[3px] rounded border text-[11px] font-bold transition-colors
            ${
              showSkillPanel
                ? 'bg-primary/20 border-primary text-primary'
                : 'bg-[#1e1e28] border-tile-border text-[#aaa]'
            }`}
        >
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
};
