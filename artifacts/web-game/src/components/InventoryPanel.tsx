import React from 'react';
import {
  Item, RARITY_STYLE, TYPE_LABEL, formatBonuses,
} from '../inventory';
import { Equipment, SLOT_META } from '../equipment';
import { CONSUMABLE_HEAL } from '../shop/shop';

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

/** Full-screen inventory overlay: equipped-slot list, item grid, bottom detail sheet. */
export default function InventoryPanel({
  inventory, equipment, selectedItem, setSelectedItem,
  equipItem, unequipItem, handleUseItem, onClose,
}: InventoryPanelProps) {
  return (
    <div className="absolute inset-0 z-[60] bg-[#0d0d0f]/95 flex flex-col rounded backdrop-blur-md">

      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-tile-border shrink-0">
        <h2 className="text-base font-bold text-primary tracking-wide">🎒 Инвентарь</h2>
        <span className="text-[11px] text-[#555] font-mono">{inventory.length} предм.</span>
        <button onClick={() => { onClose(); setSelectedItem(null); }}
          className="w-8 h-8 flex items-center justify-center rounded border border-tile-border text-[#888] hover:text-white hover:border-primary transition-colors text-sm font-bold">✕</button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Equipment slots — tappable to select/unequip ── */}
        <div className="px-3 pt-3 pb-2">
          <p className="text-[10px] uppercase tracking-widest text-[#444] mb-2 font-bold">Экипировка</p>
          <div className="flex flex-col gap-[6px]">
            {(Object.entries(SLOT_META) as [keyof Equipment, { label: string; icon: string }][]).map(([slot, meta]) => {
              const equipped = equipment[slot];
              const rs = equipped ? RARITY_STYLE[equipped.rarity] : null;
              const isSelected = equipped && selectedItem?.id === equipped.id;
              return equipped ? (
                <button key={slot}
                  onClick={() => setSelectedItem(isSelected ? null : equipped)}
                  className={`w-full flex items-center gap-2 p-2 rounded border text-left transition-all active:scale-[0.98]
                    ${isSelected
                      ? `${rs!.border} bg-[#1a1a2e] ${rs!.glow} ring-1 ring-inset ring-white/10`
                      : `${rs!.border} bg-[#141420] ${rs!.glow}`}`}>
                  <span className="text-base w-6 text-center shrink-0">{meta.icon}</span>
                  <span className="text-[11px] text-[#666] w-[54px] shrink-0">{meta.label}</span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[12px] font-bold ${rs!.text} truncate block`}>{equipped.name}</span>
                    <span className="text-[10px] text-[#555]">{formatBonuses(equipped.bonuses).join(' · ')}</span>
                  </div>
                  <span className="text-[10px] text-[#444] shrink-0">▸</span>
                </button>
              ) : (
                <div key={slot} className="flex items-center gap-2 p-2 rounded border border-tile-border/30 bg-[#0f0f14]">
                  <span className="text-base w-6 text-center shrink-0 opacity-40">{meta.icon}</span>
                  <span className="text-[11px] text-[#666] w-[54px] shrink-0">{meta.label}</span>
                  <span className="text-[11px] text-[#383838] italic">— пусто —</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Inventory items grid ── */}
        <div className="px-3 pt-1 pb-20">
          <p className="text-[10px] uppercase tracking-widest text-[#444] mb-2 font-bold">Предметы</p>
          {inventory.length === 0 ? (
            <p className="text-[12px] text-[#444] italic text-center py-4">Инвентарь пуст</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {inventory.map(item => {
                const rs = RARITY_STYLE[item.rarity];
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button key={item.id}
                    onClick={() => setSelectedItem(isSelected ? null : item)}
                    className={`text-left p-2 rounded border transition-all active:scale-95
                      ${isSelected
                        ? `${rs.border} bg-[#1a1a2e] ${rs.glow} ring-1 ring-inset ring-white/10`
                        : `${rs.border} bg-[#111118] hover:bg-[#161622] ${rs.glow}`}`}>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className={`text-[12px] font-bold ${rs.text} leading-tight`}>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] text-[#555]">{TYPE_LABEL[item.type]}</span>
                      <span className="text-[#333]">·</span>
                      <span className={`text-[10px] font-medium ${rs.text}`}>{rs.label}</span>
                    </div>
                    <div className="flex flex-col gap-[1px]">
                      {formatBonuses(item.bonuses).map((line, i) => (
                        <span key={i} className="text-[11px] text-[#88c] font-mono">{line}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Selected item detail (bottom sheet) ── */}
      {selectedItem && (() => {
        const rs = RARITY_STYLE[selectedItem.rarity];
        const slot = selectedItem.type as keyof Equipment;
        const isEquipped = equipment[slot]?.id === selectedItem.id;
        return (
          <div className={`absolute bottom-0 inset-x-0 z-10 border-t-2 ${rs.border} ${rs.glow} ${rs.bg} rounded-b p-4 animate-in slide-in-from-bottom duration-200`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className={`text-[15px] font-bold ${rs.text}`}>{selectedItem.name}</h3>
                <p className="text-[11px] text-[#666]">
                  {TYPE_LABEL[selectedItem.type]} · {rs.label}
                  {isEquipped && <span className="ml-2 text-primary font-bold">· Надето</span>}
                </p>
              </div>
              <button onClick={() => setSelectedItem(null)}
                className="text-[#666] hover:text-white text-lg leading-none px-1">✕</button>
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
                <button
                  onClick={() => handleUseItem(selectedItem)}
                  className="w-full py-2 rounded border-2 border-green-700 text-green-400 font-bold text-[13px] bg-green-950/20 active:scale-95 transition-transform shadow-[0_0_8px_rgba(34,197,94,0.15)]">
                  🧪 Использовать
                </button>
              </>
            ) : isEquipped ? (
              <button
                onClick={() => unequipItem(slot)}
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
