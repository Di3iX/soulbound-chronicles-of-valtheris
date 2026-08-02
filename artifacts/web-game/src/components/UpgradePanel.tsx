// ─── UPGRADE PANEL ────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import type { Item } from '../inventory';
import { itemDisplayName, formatBonuses, RARITY_STYLE } from '../inventory';
import type { Equipment } from '../equipment';
import {
  MAX_UPGRADE_LEVEL, canUpgradeItem, previewUpgrade,
} from '../upgrade';

interface Props {
  inventory: Item[];
  equipment: Equipment;
  playerGold: number;
  onUpgradeInventory: (itemId: string) => void;
  onUpgradeEquipped: (slot: string) => void;
  onClose: () => void;
}

type SlotKey = keyof Equipment;

const SLOT_LABEL: Partial<Record<SlotKey, string>> = {
  weapon: 'Оружие',
  helmet: 'Шлем',
  armor: 'Броня',
  gloves: 'Перчатки',
  boots: 'Сапоги',
  ring: 'Кольцо',
  amulet: 'Амулет',
};

export default function UpgradePanel({
  inventory, equipment, playerGold,
  onUpgradeInventory, onUpgradeEquipped, onClose,
}: Props) {
  const [tab, setTab] = useState<'equipped' | 'bag'>('equipped');

  const equippedList = (Object.keys(SLOT_LABEL) as SlotKey[])
    .map(slot => ({ slot, item: equipment[slot] as Item | null | undefined }))
    .filter(x => x.item);

  const bagGear = inventory.filter(i => i.type !== 'consumable' && canUpgradeItem(i));

  const Row = ({ item, onUpgrade, tag }: { item: Item; onUpgrade: () => void; tag?: string }) => {
    const prev = previewUpgrade(item);
    const lvl = item.upgradeLevel ?? 0;
    const rs = RARITY_STYLE[item.rarity];
    const maxed = !canUpgradeItem(item);
    const canPay = prev && playerGold >= prev.gold;
    const cry = inventory.filter(i => i.key === 'black_crystal').length;
    const canCry = prev ? cry >= prev.crystals : false;

    return (
      <div className={`p-3 rounded-lg border ${rs.border} ${rs.bg}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className={`text-[13px] font-bold ${rs.text}`}>
              {itemDisplayName(item)}
              {tag && <span className="ml-1 text-[9px] text-[#666] font-normal">{tag}</span>}
            </div>
            <p className="text-[10px] text-[#88c] font-mono mt-0.5">
              {formatBonuses(item.bonuses).join(' · ') || '—'}
            </p>
            <p className="text-[9px] text-[#666] mt-1">
              Уровень: +{lvl} / +{MAX_UPGRADE_LEVEL}
            </p>
            {prev && (
              <p className="text-[10px] text-[#a78bfa] mt-1 font-mono">
                → +{prev.nextLevel}: {formatBonuses(prev.bonuses).join(' · ')}
                <br />
                Стоимость: {prev.gold}💰 + {prev.crystals} кристалл
              </p>
            )}
            {maxed && <p className="text-[10px] text-primary mt-1">Максимум</p>}
          </div>
          <button
            type="button"
            disabled={maxed || !canPay || !canCry}
            onClick={onUpgrade}
            className="shrink-0 px-2 py-1.5 rounded border text-[11px] font-bold border-primary bg-primary/20 text-primary
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Улучшить
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-[60] bg-[#08080d]/97 flex flex-col rounded backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3 border-b border-tile-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h2 className="text-base font-bold text-primary">Улучшение</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-mono text-yellow-400">💰 {playerGold}</span>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded border border-tile-border text-[#888] font-bold">✕</button>
        </div>
      </div>

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
          <p className="text-center text-[#555] text-[12px] py-8">Нет надетых предметов</p>
        )}
        {tab === 'equipped' && equippedList.map(({ slot, item }) => (
          <Row
            key={slot}
            item={item!}
            tag={SLOT_LABEL[slot]}
            onUpgrade={() => onUpgradeEquipped(slot)}
          />
        ))}
        {tab === 'bag' && bagGear.length === 0 && (
          <p className="text-center text-[#555] text-[12px] py-8">Нечего улучшать в сумке</p>
        )}
        {tab === 'bag' && bagGear.map(item => (
          <Row key={item.id} item={item} onUpgrade={() => onUpgradeInventory(item.id)} />
        ))}
      </div>

      <div className="shrink-0 px-3 py-2 border-t border-tile-border/40 text-[9px] text-[#444] text-center">
        Макс. +{MAX_UPGRADE_LEVEL} · +12% к бонусам за уровень · кристаллы + золото
      </div>
    </div>
  );
}
