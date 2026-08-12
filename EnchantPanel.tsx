// ─── ENCHANT PANEL ────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import type { Item } from '../inventory';
import { itemDisplayName, formatBonuses, RARITY_STYLE, formatAffixes } from '../inventory';
import type { Equipment } from '../equipment';
import { ENCHANT_DEFS, enchantsForItem, type EnchantDef } from '../items/enchant';

interface Props {
  inventory: Item[];
  equipment: Equipment;
  playerGold: number;
  onEnchantInventory: (itemId: string, enchantId: string) => void;
  onEnchantEquipped: (slot: string, enchantId: string) => void;
  onClose: () => void;
}

type SlotKey = keyof Equipment;

const SLOT_LABEL: Partial<Record<SlotKey, string>> = {
  weapon: 'Оружие', helmet: 'Шлем', armor: 'Броня', gloves: 'Перчатки',
  boots: 'Сапоги', ring1: 'Кольцо 1', ring2: 'Кольцо 2', amulet: 'Амулет',
};

export default function EnchantPanel({
  inventory, equipment, playerGold,
  onEnchantInventory, onEnchantEquipped, onClose,
}: Props) {
  const [tab, setTab] = useState<'equipped' | 'bag'>('equipped');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const cry = inventory.filter(i => i.key === 'black_crystal').length;

  const selectedItem: Item | null = useMemo(() => {
    if (selectedSlot) return (equipment[selectedSlot as SlotKey] as Item) ?? null;
    if (selectedId) return inventory.find(i => i.id === selectedId) ?? null;
    return null;
  }, [selectedId, selectedSlot, equipment, inventory]);

  const list = useMemo(() => {
    if (tab === 'equipped') {
      return (Object.keys(SLOT_LABEL) as SlotKey[])
        .map(slot => ({ key: slot, item: equipment[slot] as Item | undefined, kind: 'eq' as const }))
        .filter(x => x.item && x.item.type !== 'consumable');
    }
    return inventory
      .filter(i => i.type !== 'consumable')
      .map(item => ({ key: item.id, item, kind: 'bag' as const }));
  }, [tab, equipment, inventory]);

  const available: EnchantDef[] = selectedItem ? enchantsForItem(selectedItem) : [];

  return (
    <div className="absolute inset-0 z-[60] bg-[#08080d]/97 flex flex-col rounded backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3 border-b border-tile-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔮</span>
          <h2 className="text-base font-bold text-primary">Зачарование</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-yellow-400">💰 {playerGold}</span>
          <span className="text-[11px] font-mono text-[#a78bfa]">💎 {cry}</span>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded border border-tile-border text-[#888] font-bold">✕</button>
        </div>
      </div>

      <div className="flex border-b border-tile-border shrink-0">
        {(['equipped', 'bag'] as const).map(t => (
          <button key={t} type="button" onClick={() => { setTab(t); setSelectedId(null); setSelectedSlot(null); }}
            className={`flex-1 py-2 text-[12px] font-bold border-b-2 ${
              tab === t ? 'text-primary border-primary' : 'text-[#555] border-transparent'
            }`}>
            {t === 'equipped' ? 'Надето' : 'Инвентарь'}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        {/* Item list */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-1 border-b md:border-b-0 md:border-r border-tile-border">
          {list.length === 0 && (
            <p className="text-center text-[#555] text-[12px] py-6">Нет предметов</p>
          )}
          {list.map(({ key, item, kind }) => {
            const it = item!;
            const rs = RARITY_STYLE[it.rarity];
            const active = kind === 'eq' ? selectedSlot === key : selectedId === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (kind === 'eq') { setSelectedSlot(key); setSelectedId(null); }
                  else { setSelectedId(key); setSelectedSlot(null); }
                }}
                className={`w-full text-left p-2 rounded border text-[11px] ${
                  active ? 'border-primary bg-primary/10' : `${rs.border} ${rs.bg}`
                }`}
              >
                <span className={`font-bold ${rs.text}`}>{itemDisplayName(it)}</span>
                {it.enchantName && (
                  <span className="block text-[9px] text-purple-300">🔮 {it.enchantName}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Enchant list */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2">
          {!selectedItem && (
            <p className="text-center text-[#555] text-[12px] py-8">Выбери предмет</p>
          )}
          {selectedItem && (
            <>
              <div className="text-[10px] text-[#888] mb-1">
                {formatBonuses(selectedItem.bonuses).join(' · ')}
                {formatAffixes(selectedItem).length > 0 && (
                  <span className="block text-purple-400/80">{formatAffixes(selectedItem).join(' · ')}</span>
                )}
                {selectedItem.enchantName && (
                  <span className="block text-primary">Текущее: {selectedItem.enchantName}</span>
                )}
              </div>
              {available.length === 0 && (
                <p className="text-[12px] text-[#555]">Нет доступных зачарований для этого предмета / тира</p>
              )}
              {available.map(def => {
                const can = playerGold >= def.gold && cry >= def.crystals;
                return (
                  <div key={def.id} className="p-2 rounded border border-tile-border bg-[#0d0d16]">
                    <div className="flex justify-between gap-2">
                      <div>
                        <div className="text-[12px] font-bold text-purple-300">🔮 {def.name}</div>
                        <p className="text-[9px] text-[#777]">{def.description}</p>
                        <p className="text-[9px] text-[#6a8] font-mono mt-0.5">
                          {formatBonuses(def.bonuses).join(' · ')}
                        </p>
                        <p className="text-[9px] text-yellow-400 mt-0.5">
                          {def.gold}💰 + {def.crystals} кристалл
                          {def.minTier ? ` · T${def.minTier}+` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!can}
                        onClick={() => {
                          if (selectedSlot) onEnchantEquipped(selectedSlot, def.id);
                          else if (selectedId) onEnchantInventory(selectedId, def.id);
                        }}
                        className="shrink-0 self-center px-2 py-1 rounded border text-[10px] font-bold
                          border-purple-500/50 bg-purple-950/40 text-purple-200
                          disabled:opacity-30"
                      >
                        Зачаровать
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 px-3 py-2 border-t border-tile-border/40 text-[9px] text-[#444] text-center">
        Одно зачарование на вещь · новое заменяет старое · аффиксы сохраняются
      </div>
    </div>
  );
}
