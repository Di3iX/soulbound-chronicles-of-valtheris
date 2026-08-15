import React from 'react';
import {
  Item, RARITY_STYLE, TYPE_LABEL, formatBonuses, itemIcon, itemQty, isStackable,
} from '../inventory';
import { Equipment, SLOT_META, findEquippedSlot } from '../equipment';
import { CONSUMABLE_HEAL, CONSUMABLE_MANA } from '../shop/shop';

interface InventoryPanelProps {
  inventory: Item[];
  equipment: Equipment;
  selectedItem: Item | null;
  setSelectedItem: (item: Item | null) => void;
  equipItem: (item: Item) => void;
  unequipItem: (slot: keyof Equipment) => void;
  handleUseItem: (item: Item) => void;
  onClose: () => void;
}

const SLOT_ORDER: (keyof Equipment)[] = ['weapon', 'helmet', 'armor', 'gloves', 'boots', 'ring1', 'ring2', 'amulet'];

export default function InventoryPanel({
  inventory, equipment, selectedItem, setSelectedItem,
  equipItem, unequipItem, handleUseItem, onClose,
}: InventoryPanelProps) {
  const totalUnits = inventory.reduce((s, it) => s + itemQty(it), 0);

  return (
    <div className="absolute inset-0 z-[60] bg-[#0d0d0f]/95 flex flex-col rounded backdrop-blur-md">

      <div className="flex items-center justify-between px-4 py-3 border-b border-tile-border shrink-0">
        <h2 className="text-base font-bold text-primary tracking-wide">🎒 Инвентарь</h2>
        <span className="text-[11px] text-[#555] font-mono">
          {inventory.length} яч. · {totalUnits} шт.
        </span>
        <button onClick={() => { onClose(); setSelectedItem(null); }}
          className="w-8 h-8 flex items-center justify-center rounded border border-tile-border text-[#888] hover:text-white hover:border-primary transition-colors text-sm font-bold">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 pt-3 pb-2">
          <p className="text-[10px] uppercase tracking-widest text-[#444] mb-2 font-bold">Снаряжение</p>
          <div className="grid grid-cols-4 gap-2">
            {SLOT_ORDER.map(slot => {
              const meta = SLOT_META[slot];
              const equipped = equipment[slot];
              const rs = equipped ? RARITY_STYLE[equipped.rarity] : null;
              const isSelected = equipped && selectedItem?.id === equipped.id;
              return equipped ? (
                <button key={slot}
                  onClick={() => setSelectedItem(isSelected ? null : equipped)}
                  className={`relative aspect-square flex flex-col items-center justify-center gap-[2px] rounded-lg border-2 transition-all active:scale-95
                    ${isSelected ? 'ring-2 ring-inset ring-white/30' : ''} ${rs!.border} ${rs!.bg} ${rs!.glow}`}>
                  <span className="text-[22px] leading-none">{itemIcon(equipped)}</span>
                  <span className={`text-[7px] font-bold leading-none ${rs!.text} truncate max-w-full px-[2px]`}>{meta.label}</span>
                </button>
              ) : (
                <div key={slot}
                  className="aspect-square flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-tile-border/40 bg-[#0f0f14]">
                  <span className="text-[20px] leading-none opacity-25">{meta.icon}</span>
                  <span className="text-[7px] text-[#444] font-medium leading-none">{meta.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-3 pt-1 pb-20">
          <p className="text-[10px] uppercase tracking-widest text-[#444] mb-2 font-bold">Предметы</p>
          {inventory.length === 0 ? (
            <p className="text-[12px] text-[#444] italic text-center py-4">Инвентарь пуст</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {inventory.map(item => {
                const rs = RARITY_STYLE[item.rarity];
                const isSelected = selectedItem?.id === item.id;
                const q = itemQty(item);
                return (
                  <button key={item.id}
                    onClick={() => setSelectedItem(isSelected ? null : item)}
                    className={`relative aspect-square flex flex-col items-center justify-center gap-[2px] rounded-lg border-2 p-1 transition-all active:scale-95
                      ${isSelected ? 'ring-2 ring-inset ring-white/30' : ''} ${rs.border} ${rs.bg} ${rs.glow}`}>
                    <span className="text-[22px] leading-none">{itemIcon(item)}</span>
                    <span className={`text-[8px] font-bold leading-tight text-center truncate max-w-full px-[2px] ${rs.text}`}>{item.name}</span>
                    {isStackable(item) && q > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[10px] font-black text-white bg-black/70 rounded px-1 leading-tight tabular-nums">
                        ×{q}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedItem && (() => {
        const rs = RARITY_STYLE[selectedItem.rarity];
        const equippedSlot = findEquippedSlot(equipment, selectedItem);
        const isEquipped = equippedSlot !== null;
        const q = itemQty(selectedItem);
        return (
          <div className={`absolute bottom-0 inset-x-0 z-10 border-t-2 ${rs.border} ${rs.glow} ${rs.bg} rounded-b p-4 animate-in slide-in-from-bottom duration-200`}>
            <div className="flex items-start gap-3 mb-2">
              <span className="text-3xl leading-none shrink-0">{itemIcon(selectedItem)}</span>
              <div className="flex-1 min-w-0">
                <h3 className={`text-[15px] font-bold ${rs.text}`}>
                  {selectedItem.name}
                  {isStackable(selectedItem) && q > 1 && (
                    <span className="ml-2 text-white/70 font-mono text-[13px]">×{q}</span>
                  )}
                </h3>
                <p className="text-[11px] text-[#666]">
                  {TYPE_LABEL[selectedItem.type]} · {rs.label}
                  {isEquipped && <span className="ml-2 text-primary font-bold">· Надето</span>}
                </p>
              </div>
              <button onClick={() => setSelectedItem(null)}
                className="text-[#666] hover:text-white text-lg leading-none px-1 shrink-0">✕</button>
            </div>
            <div className="flex flex-col gap-[3px] mb-3">
              {formatBonuses(selectedItem.bonuses).map((line, i) => (
                <span key={i} className="text-[13px] text-white font-mono">• {line}</span>
              ))}
            </div>
            {selectedItem.type === 'consumable' ? (
              <>
                {CONSUMABLE_HEAL[selectedItem.key] && (
                  <p className="text-[12px] text-green-400 mb-2">
                    ❤️ Восстанавливает {CONSUMABLE_HEAL[selectedItem.key]} HP
                  </p>
                )}
                {CONSUMABLE_MANA[selectedItem.key] && (
                  <p className="text-[12px] text-[#3a8fc4] mb-2">
                    🔷 Восстанавливает {CONSUMABLE_MANA[selectedItem.key]} MP
                  </p>
                )}
                <button
                  onClick={() => handleUseItem(selectedItem)}
                  className="w-full py-2 rounded border-2 border-green-700 text-green-400 font-bold text-[13px] bg-green-950/20 active:scale-95 transition-transform shadow-[0_0_8px_rgba(34,197,94,0.15)]">
                  🧪 Использовать{q > 1 ? ` (останется ${q - 1})` : ''}
                </button>
              </>
            ) : isEquipped ? (
              <button
                onClick={() => unequipItem(equippedSlot)}
                className="w-full py-2 rounded border-2 border-[#555] text-[#aaa] font-bold text-[13px] bg-[#111118] active:scale-95 transition-transform">
                📤 Снять
              </button>
            ) : (
              <button
                onClick={() => equipItem(selectedItem)}
                className={`w-full py-2 rounded border-2 ${rs.border} ${rs.text} font-bold text-[13px] bg-[#111118] active:scale-95 transition-transform ${rs.glow}`}>
                ⚔️ Надеть
              </button>
            )}
          </div>
        );
      })()}

    </div>
  );
}
