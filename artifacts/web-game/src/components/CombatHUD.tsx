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
  /** @deprecated use bossIds */
  bossId?:        number;
  /** All reserved boss enemy ids (cave / field / ruins). */
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
  shieldActive, playerLevel, playerHp, playerMaxHp, playerMp, playerMaxMp, playerStatusEffects,
  activeEnemy, bossId, bossIds, currentLocation, locationMeta,
  livingEnemiesCount, totalEnemiesCount,
  xpPct, playerXp, xpToNext, playerGold,
  statPoints, skillPoints, inventoryCount, questProgress,
  showCharPanel, showInventory, showWorldMap, showQuestPanel, showSkillPanel,
  onToggleCharPanel, onToggleInventory, onToggleWorldMap, onToggleQuestPanel, onToggleSkillPanel,
}: CombatHUDProps) {
  const meta = locationMeta[currentLocation];
  const bossIdSet = new Set(bossIds ?? (bossId != null ? [bossId] : []));
  const isBoss = (e: Enemy | null) => !!e && bossIdSet.has(e.id);

  const enemyDef = activeEnemy ? MONSTER_DEFS[activeEnemy.name] : undefined;
  const enemyLevel = enemyDef?.level;
  const enemyHpPct = activeEnemy
    ? Math.round((activeEnemy.hp / Math.max(1, activeEnemy.maxHp)) * 100)
    : 0;

  /** Small icon row with countdown — used for both player and enemy status effects. */
  const StatusIcons = ({ effects, align }: { effects: StatusEffect[]; align: 'start' | 'end' }) => (
    effects.length === 0 ? null : (
      <div className={`flex gap-1 ${align === 'end' ? 'justify-end' : 'justify-start'}`}>
        {effects.map(e => {
          const def = STATUS_EFFECT_DEFS[e.type];
          return (
            <span key={e.type} title={def.label}
              className="flex items-center gap-[1px] text-[9px] font-mono bg-black/40 rounded px-[3px] py-[1px] border border-tile-border/50">
              {def.icon}{Math.ceil(e.remainingMs / 1000)}
            </span>
          );
        })}
      </div>
    )
  );

  return (
    <div className="shrink-0 border-b border-tile-border bg-[#111116]">

      {/* Row 1 — HP / MP / XP bars */}
      <div className="flex items-center px-3 pt-1 pb-0 justify-between">
        <div className="flex flex-col w-[45%]">
          {/* HP */}
          <div className="flex justify-between items-end mb-[2px]">
            <span className="text-xs font-bold text-white tracking-wide">
              Воин{shieldActive ? ' 🛡️' : ''}
              <span className="text-primary text-[10px] font-mono ml-1">Lv.{playerLevel}</span>
            </span>
            <span className="text-[10px] text-primary font-mono">{playerHp}/{playerMaxHp}</span>
          </div>
          <div className="h-[5px] w-full bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border">
            <div className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.round((playerHp / playerMaxHp) * 100)}%` }} />
          </div>

          {/* MP */}
          <div className="flex justify-between items-end mt-[3px] mb-[1px]">
            <span className="text-[9px] text-[#3a8fc4] font-mono">MP</span>
            <span className="text-[9px] text-[#3a8fc4] font-mono">{playerMp}/{playerMaxMp}</span>
          </div>
          <div className="h-[3px] w-full bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border">
            <div className="h-full bg-[#3a8fc4] transition-all duration-300"
              style={{ width: `${Math.round((playerMp / playerMaxMp) * 100)}%` }} />
          </div>

          {/* XP — same style as HP/MP */}
          <div className="flex justify-between items-end mt-[3px] mb-[1px]">
            <span className="text-[9px] text-[#a78bfa] font-mono">Опыт</span>
            <span className="text-[9px] text-[#a78bfa] font-mono">{playerXp}/{xpToNext}</span>
          </div>
          <div className="h-[3px] w-full bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border">
            <div className="h-full bg-[#a78bfa] transition-all duration-300"
              style={{ width: `${Math.round(xpPct)}%` }} />
          </div>

          {playerStatusEffects.length > 0 && <div className="mt-[2px]"><StatusIcons effects={playerStatusEffects} align="start" /></div>}
        </div>

        <div className="text-xs font-bold text-[#444] text-center w-[10%]">VS</div>

        <div className="flex flex-col w-[45%]">
          {activeEnemy ? (
            <>
              {isBoss(activeEnemy) && (
                <div className="flex justify-center mb-[1px]">
                  <span className="text-[8px] font-black text-red-500 uppercase tracking-widest animate-pulse">👑 БОСС</span>
                </div>
              )}
              {!isBoss(activeEnemy) && activeEnemy.rarity !== 'common' && (
                <div className="flex justify-end mb-[1px]">
                  <span className="text-[8px] font-black uppercase tracking-widest"
                    style={{ color: ENEMY_RARITY_DEFS[activeEnemy.rarity].color }}>
                    {ENEMY_RARITY_DEFS[activeEnemy.rarity].emoji} {ENEMY_RARITY_DEFS[activeEnemy.rarity].label}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-end mb-[2px] gap-1">
                <span className={`text-[10px] font-mono shrink-0 ${isBoss(activeEnemy) ? 'text-red-400' : 'text-destructive'}`}>
                  {activeEnemy.hp}/{activeEnemy.maxHp}
                </span>
                <span className="text-xs font-bold tracking-wide text-right leading-tight"
                  style={{ color: isBoss(activeEnemy) ? '#f87171' : (activeEnemy.rarity !== 'common' ? ENEMY_RARITY_DEFS[activeEnemy.rarity].color : undefined) }}>
                  <span className={isBoss(activeEnemy) || activeEnemy.rarity !== 'common' ? '' : 'text-white'}>
                    {activeEnemy.emoji} {activeEnemy.name}
                  </span>
                  {enemyLevel != null && (
                    <span className="block text-[9px] font-mono text-[#888] font-normal">
                      Ур. {enemyLevel} · {enemyHpPct}%
                    </span>
                  )}
                  {enemyLevel == null && isBoss(activeEnemy) && (
                    <span className="block text-[9px] font-mono text-red-500/80 font-normal">Босс</span>
                  )}
                </span>
              </div>
              <div className="h-[6px] w-full bg-[#1a1a1f] rounded-full overflow-hidden border border-tile-border flex justify-end">
                <div className={`h-full transition-all duration-300 ${isBoss(activeEnemy) ? 'bg-red-600' : 'bg-destructive'}`}
                  style={{
                    width: `${enemyHpPct}%`,
                    backgroundColor: !isBoss(activeEnemy) && activeEnemy.rarity !== 'common' ? ENEMY_RARITY_DEFS[activeEnemy.rarity].color : undefined,
                  }} />
              </div>
              {(activeEnemy.statusEffects ?? []).length > 0 && <div className="mt-[2px]"><StatusIcons effects={activeEnemy.statusEffects ?? []} align="end" /></div>}
            </>
          ) : (
            <>
              <div className="flex justify-end items-end mb-[2px]">
                {meta.isSafeZone
                  ? <span className="text-[10px] text-green-700 font-mono">Безопасная зона</span>
                  : <span className="text-[10px] text-[#666] font-mono">Врагов: {livingEnemiesCount} / {totalEnemiesCount}</span>
                }
              </div>
              <div className="h-[5px] w-full bg-[#1a1a1f] rounded-full border border-tile-border" />
            </>
          )}
        </div>
      </div>

      {/* Row 2 — location + gold + panel buttons, all on one line */}
      <div className="flex items-center px-3 pt-[1px] pb-1.5 gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[9px] font-bold text-[#666] uppercase tracking-widest min-w-0 truncate">
          {meta.emoji} {meta.label}{meta.isSafeZone ? ' ·' : ''}
        </span>
        {meta.isSafeZone && <span className="text-[8px] text-green-800 font-bold shrink-0">безопасно</span>}
        <span className="text-[10px] font-bold text-yellow-400 shrink-0">💰{playerGold}</span>

        <div className="flex-1 min-w-[8px]" />

        {/* Персонаж button */}
        <button
          onClick={onToggleCharPanel}
          className={`shrink-0 flex items-center gap-1 px-1.5 py-[2px] rounded border text-[10px] font-bold transition-colors
            ${showCharPanel ? 'bg-primary/20 border-primary text-primary' : 'bg-[#1e1e28] border-tile-border text-[#aaa]'}`}>
          {statPoints > 0 && (
            <span className="w-[13px] h-[13px] rounded-full bg-primary text-[#111] text-[8px] font-black flex items-center justify-center leading-none">{statPoints}</span>
          )}
          👤
        </button>

        {/* Инвентарь button */}
        <button
          onClick={onToggleInventory}
          className={`shrink-0 flex items-center gap-1 px-1.5 py-[2px] rounded border text-[10px] font-bold transition-colors
            ${showInventory ? 'bg-primary/20 border-primary text-primary' : 'bg-[#1e1e28] border-tile-border text-[#aaa]'}`}>
          {inventoryCount > 0 && (
            <span className="w-[13px] h-[13px] rounded-full bg-[#3a3a50] text-white text-[8px] font-black flex items-center justify-center leading-none">{inventoryCount}</span>
          )}
          🎒
        </button>

        {/* Карта мира button */}
        <button
          onClick={onToggleWorldMap}
          className={`shrink-0 flex items-center gap-1 px-1.5 py-[2px] rounded border text-[10px] font-bold transition-colors
            ${showWorldMap ? 'bg-primary/20 border-primary text-primary' : 'bg-[#1e1e28] border-tile-border text-[#aaa]'}`}>
          🗺
        </button>

        {/* Задания button */}
        <button
          onClick={onToggleQuestPanel}
          className={`shrink-0 flex items-center gap-1 px-1.5 py-[2px] rounded border text-[10px] font-bold transition-colors
            ${showQuestPanel ? 'bg-primary/20 border-primary text-primary' : 'bg-[#1e1e28] border-tile-border text-[#aaa]'}`}>
          {Object.values(questProgress).some(e => e.status === 'active') && (
            <span className="w-[13px] h-[13px] rounded-full bg-[#c89628] text-[#111] text-[8px] font-black flex items-center justify-center leading-none">!</span>
          )}
          📜
        </button>

        {/* Умения button */}
        <button
          onClick={onToggleSkillPanel}
          className={`shrink-0 flex items-center gap-1 px-1.5 py-[2px] rounded border text-[10px] font-bold transition-colors
            ${showSkillPanel ? 'bg-primary/20 border-primary text-primary' : 'bg-[#1e1e28] border-tile-border text-[#aaa]'}`}>
          {skillPoints > 0 && (
            <span className="w-[13px] h-[13px] rounded-full bg-primary text-[#111] text-[8px] font-black flex items-center justify-center leading-none animate-pulse">
              {skillPoints}
            </span>
          )}
          🌟
        </button>
      </div>

      {/* Active quest tracker */}
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
                    : 'border-tile-border/50 bg-[#0a0a12]/90 text-[#9ab]'
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
