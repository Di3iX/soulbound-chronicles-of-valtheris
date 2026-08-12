// ─── TIER PROMOTION PANEL ─────────────────────────────────────────────────────
import React, { useState } from 'react';
import type { Item } from '../inventory';
import {
  itemDisplayName, formatBonuses, RARITY_STYLE, TIER_STYLE, tierLabel,
} from '../inventory';
import type { Equipment } from '../equipment';
import {
  canPromoteTier, previewTierPromote, TIER_STAT_MULT,
} from '../items/tierPromote';

interface Props {
  inventory: Item[];
  equipment: Equipment;
  playerGold: number;
  playerLevel: number;
  onPromoteInventory: (itemId: string) => void;
  onPromoteEquipped: (slot: string) => void;
  onClose: () => void;
}

type SlotKey = keyof Equipment;

const SLOT_LABEL: Partial<Record<SlotKey, string>> = {
  weapon: 'Оружие', helmet: 'Шлем', armor: 'Броня', gloves: 'Перчатки',
  boots: 'Сапоги', ring1: 'Кольцо 1', ring2: 'Кольцо 2', amulet: 'Амулет',
};

export default function TierPromotePanel({
  inventory, equipment, playerGold, playerLevel,
  onPromoteInventory, onPromoteEquipped, onClose,
}: Props) {
  const [tab, setTab] = useState<'equipped' | 'bag'>('equipped');
  const cry = inventory.filter(i => i.key === 'black_crystal').length;

  const equippedList = (Object.keys(SLOT_LABEL) as SlotKey[])
    .map(slot => ({ slot, item: equipment[slot] as Item | null | undefined }))
    .filter(x => x.item && canPromoteTier(x.item));

  const bagGear = inventory.filter(i => i.type !== 'consumable' && canPromoteTier(i));

  const Row = ({ item, onPromote, tag }: { item: Item; onPromote: () => void; tag?: string }) => {
    const prev = previewTierPromote(item);
    const rs = RARITY_STYLE[item.rarity];
    const tier = item.tier ?? 1;
    const canPay = prev && playerGold >= prev.gold && cry >= prev.crystals;
    const levelOk = prev ? playerLevel >= prev.requiredLevel : false;

    return (
      <div className={`p-3 rounded-lg border ${rs.border} ${rs.bg}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className={`text-[13px] font-bold ${rs.text}`}>
              {itemDisplayName(item)}
              {tag && <span className="ml-1 text-[9px] text-[#666]">{tag}</span>}
            </div>
            <p className="text-[10px] text-[#88c] font-mono mt-0.5">
              {formatBonuses(item.bonuses).join(' · ') || '—'}
            </p>
            {prev && (
              <p className="text-[10px] mt-1 font-mono">
                <span style={{ color: TIER_STYLE[prev.from].color }}>T{prev.from}</span>
                {' → '}
                <span style={{ color: TIER_STYLE[prev.to].color }} className="font-bold">T{prev.to}</span>
                <span className="text-[#666]"> (×{TIER_STAT_MULT[prev.to]} статов, ур. {prev.requiredLevel}+)</span>
                <br />
                <span className="text-[#a78bfa]">
                  → {formatBonuses(prev.bonuses).join(' · ')}
                </span>
                <br />
                <span className="text-yellow-400">{prev.gold}💰 + {prev.crystals} кристалл</span>
                {!levelOk && (
                  <span className="block text-red-400 text-[9px]">
                    Нужен {prev.requiredLevel} уровень (сейчас {playerLevel})
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={!canPay || !levelOk}
            onClick={onPromote}
            className="shrink-0 px-2 py-1.5 rounded border text-[11px] font-bold border-primary bg-primary/20 text-primary
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Тир ↑
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-[60] bg-[#08080d]/97 flex flex-col rounded backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3 border-b border-tile-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">⬆️</span>
          <h2 className="text-base font-bold text-primary">Прокачка тира</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-yellow-400">💰 {playerGold}</span>
          <span className="text-[11px] font-mono text-[#a78bfa]">💎 {cry}</span>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded border border-tile-border text-[#888] font-bold">✕</button>
        </div>
      </div>

      <p className="px-3 py-1.5 text-[9px] text-[#666] border-b border-tile-border/50">
        T1 (1–10) → T2 (11–20) → … → T6 (51–60). Статы растут с тиром. Нужен уровень нового тира.
      </p>

      <div className="flex border-b border-tile-border shrink-0">
        {(['equipped', 'bag'] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[12px] font-bold border-b-2 ${
              tab === t ? 'text-primary border-primary' : 'text-[#555] border-transparent'
            }`}>
            {t === 'equipped' ? 'Надето' : 'Инвентарь'}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2">
        {tab === 'equipped' && equippedList.length === 0 && (
          <p className="text-center text-[#555] text-[12px] py-8">Нечего повышать (или всё на T6)</p>
        )}
        {tab === 'equipped' && equippedList.map(({ slot, item }) => (
          <Row key={slot} item={item!} tag={SLOT_LABEL[slot]}
            onPromote={() => onPromoteEquipped(slot)} />
        ))}
        {tab === 'bag' && bagGear.length === 0 && (
          <p className="text-center text-[#555] text-[12px] py-8">Пусто</p>
        )}
        {tab === 'bag' && bagGear.map(item => (
          <Row key={item.id} item={item} onPromote={() => onPromoteInventory(item.id)} />
        ))}
      </div>
    </div>
  );
}
