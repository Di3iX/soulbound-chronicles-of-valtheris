import React from 'react';
import { BaseStats, ComputedStats } from '../stats';
import { EquipBonuses } from '../equipment';

interface CharacterPanelProps {
  playerLevel: number;
  playerHp: number;
  cs: ComputedStats;
  stats: BaseStats;
  equipBonuses: EquipBonuses;
  statPoints: number;
  spendStat: (stat: keyof BaseStats) => void;
  onClose: () => void;
  onResetCharacter: () => void;
}

/** Full-screen character sheet overlay: level/HP, allocatable stats, combat stats, reset. */
export default function CharacterPanel({
  playerLevel, playerHp, cs, stats, equipBonuses, statPoints,
  spendStat, onClose, onResetCharacter,
}: CharacterPanelProps) {
  return (
    <div className="absolute inset-0 z-[60] bg-[#0d0d0f]/95 flex flex-col rounded backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3 border-b border-tile-border shrink-0">
        <h2 className="text-base font-bold text-primary tracking-wide">⚔️ Персонаж</h2>
        {statPoints > 0 && (
          <span className="text-xs text-primary font-bold animate-pulse">
            {statPoints} очко{statPoints === 1 ? '' : statPoints < 5 ? 'а' : 'в'} не потрачено
          </span>
        )}
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded border border-tile-border text-[#888] hover:text-white hover:border-primary transition-colors text-sm font-bold">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1">

        {/* Level + current HP */}
        <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
          <span className="text-[13px] text-[#888]">Уровень</span>
          <span className="text-[13px] font-bold text-primary font-mono">{playerLevel}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
          <span className="text-[13px] text-[#888]">HP</span>
          <span className="text-[13px] font-bold text-white font-mono">{Math.round(playerHp)} / {cs.maxHp}</span>
        </div>

        {/* ── Allocatable stats ── */}
        <p className="text-[10px] uppercase tracking-widest text-[#444] pt-3 pb-1 font-bold">Характеристики</p>

        {/* Strength */}
        <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
          <div className="flex flex-col">
            <span className="text-[13px] text-white font-medium">Сила</span>
            <span className="text-[10px] text-[#555]">+2 урона · +0.5 защита · +0.2% крит{equipBonuses.strength > 0 ? ` (+${equipBonuses.strength} экип.)` : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-white font-mono w-12 text-right">
              {stats.strength}{equipBonuses.strength > 0 ? <span className="text-green-400 text-[11px]">+{equipBonuses.strength}</span> : ''}
            </span>
            <button disabled={statPoints === 0} onClick={() => spendStat('strength')}
              className="w-7 h-7 rounded border text-sm font-black flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed enabled:border-primary enabled:text-primary enabled:bg-primary/10 enabled:hover:bg-primary/25 enabled:active:scale-90">+</button>
          </div>
        </div>

        {/* Agility */}
        <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
          <div className="flex flex-col">
            <span className="text-[13px] text-white font-medium">Ловкость</span>
            <span className="text-[10px] text-[#555]">−3% скор.атаки · +0.5% уклон{equipBonuses.agility > 0 ? ` (+${equipBonuses.agility} экип.)` : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-white font-mono w-12 text-right">
              {stats.agility}{equipBonuses.agility > 0 ? <span className="text-green-400 text-[11px]">+{equipBonuses.agility}</span> : ''}
            </span>
            <button disabled={statPoints === 0} onClick={() => spendStat('agility')}
              className="w-7 h-7 rounded border text-sm font-black flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed enabled:border-primary enabled:text-primary enabled:bg-primary/10 enabled:hover:bg-primary/25 enabled:active:scale-90">+</button>
          </div>
        </div>

        {/* Intelligence */}
        <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
          <div className="flex flex-col">
            <span className="text-[13px] text-white font-medium">Интеллект</span>
            <span className="text-[10px] text-[#555]">+0.5% урона/очко{equipBonuses.intelligence > 0 ? ` (+${equipBonuses.intelligence} экип.)` : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-white font-mono w-12 text-right">
              {stats.intelligence}{equipBonuses.intelligence > 0 ? <span className="text-green-400 text-[11px]">+{equipBonuses.intelligence}</span> : ''}
            </span>
            <button disabled={statPoints === 0} onClick={() => spendStat('intelligence')}
              className="w-7 h-7 rounded border text-sm font-black flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed enabled:border-primary enabled:text-primary enabled:bg-primary/10 enabled:hover:bg-primary/25 enabled:active:scale-90">+</button>
          </div>
        </div>

        {/* Vitality */}
        <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
          <div className="flex flex-col">
            <span className="text-[13px] text-white font-medium">Живучесть</span>
            <span className="text-[10px] text-[#555]">+10 макс. HP/очко{equipBonuses.vitality > 0 ? ` (+${equipBonuses.vitality} экип.)` : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-white font-mono w-12 text-right">
              {stats.vitality}{equipBonuses.vitality > 0 ? <span className="text-green-400 text-[11px]">+{equipBonuses.vitality}</span> : ''}
            </span>
            <button disabled={statPoints === 0} onClick={() => spendStat('vitality')}
              className="w-7 h-7 rounded border text-sm font-black flex items-center justify-center transition-all disabled:opacity-25 disabled:cursor-not-allowed enabled:border-primary enabled:text-primary enabled:bg-primary/10 enabled:hover:bg-primary/25 enabled:active:scale-90">+</button>
          </div>
        </div>

        {/* ── Combat stats ── */}
        <p className="text-[10px] uppercase tracking-widest text-[#444] pt-3 pb-1 font-bold">Боевые показатели</p>

        <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
          <span className="text-[13px] text-[#888]">Урон</span>
          <span className="text-[13px] font-bold text-white font-mono">{cs.dmgMin}–{cs.dmgMax}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
          <span className="text-[13px] text-[#888]">Защита</span>
          <span className="text-[13px] font-bold text-white font-mono">{cs.defense}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
          <span className="text-[13px] text-[#888]">Крит. шанс</span>
          <span className="text-[13px] font-bold text-white font-mono">{cs.critChance.toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
          <span className="text-[13px] text-[#888]">Крит. урон</span>
          <span className="text-[13px] font-bold text-white font-mono">{cs.critDamagePct}%</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
          <span className="text-[13px] text-[#888]">Уклонение</span>
          <span className="text-[13px] font-bold text-white font-mono">{cs.dodgeChance.toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
          <span className="text-[13px] text-[#888]">Скорость атаки</span>
          <span className="text-[13px] font-bold text-white font-mono">
            {cs.attackIntervalSec}с{equipBonuses.atkSpeedPenalty > 0 ? <span className="text-destructive text-[10px] ml-1">−{equipBonuses.atkSpeedPenalty}%</span> : ''}
          </span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-tile-border/40">
          <span className="text-[13px] text-[#888]">Максимальное HP</span>
          <span className="text-[13px] font-bold text-white font-mono">
            {cs.maxHp}{equipBonuses.hp > 0 ? <span className="text-green-400 text-[10px] ml-1">+{equipBonuses.hp} экип.</span> : ''}
          </span>
        </div>

        {/* Free points */}
        <div className={`flex items-center justify-between py-2 rounded px-2 mt-2 ${statPoints > 0 ? 'bg-primary/10 border border-primary/40' : ''}`}>
          <span className={`text-[13px] font-medium ${statPoints > 0 ? 'text-primary' : 'text-[#888]'}`}>Свободные очки</span>
          <span className={`text-[16px] font-black font-mono ${statPoints > 0 ? 'text-primary' : 'text-[#555]'}`}>{statPoints}</span>
        </div>

        {/* Danger zone: full reset — wipes save, back to Lv.1 */}
        <button
          onClick={() => {
            if (window.confirm('Сбросить весь прогресс и начать новую игру? Это действие необратимо.')) {
              onResetCharacter();
              onClose();
            }
          }}
          className="mt-4 w-full py-2 rounded border-2 border-destructive/60 text-destructive font-bold text-[12px] bg-destructive/5 active:scale-95 transition-transform">
          🗑️ Новая игра (сбросить прогресс)
        </button>
      </div>
    </div>
  );
}
