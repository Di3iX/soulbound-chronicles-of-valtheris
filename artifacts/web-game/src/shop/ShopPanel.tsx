// ─── SHOP PANEL ───────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Item, ITEM_CATALOG, RARITY_STYLE, TYPE_LABEL, formatBonuses } from '../inventory';
import { Equipment } from '../equipment';
import { MERCHANT_ITEMS, CONSUMABLE_HEAL, sellPrice } from './shop';

interface Props {
  playerGold: number;
  inventory:  Item[];
  equipment:  Equipment;
  onBuy:      (key: string) => void;
  onSell:     (itemId: string) => void;
  onClose:    () => void;
}

export default function ShopPanel({
  playerGold, inventory, equipment, onBuy, onSell, onClose,
}: Props) {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');

  // IDs of currently equipped items — cannot be sold
  const equippedIds = new Set(
    Object.values(equipment).filter(Boolean).map(eq => (eq as Item).id),
  );

  // Items the player can sell: anything unequipped
  const sellable = inventory.filter(i => !equippedIds.has(i.id));

  return (
    <div className="absolute inset-0 z-[60] bg-[#08080d]/97 flex flex-col rounded backdrop-blur-md">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-tile-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">🛒</span>
          <h2 className="text-base font-bold text-primary tracking-wide">Торговец</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-bold font-mono text-yellow-400">💰 {playerGold}</span>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded border border-tile-border text-[#888] hover:text-white hover:border-primary transition-colors text-sm font-bold">
            ✕
          </button>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-tile-border shrink-0">
        {(['buy', 'sell'] as const).map(t => (
          <button key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-[7px] text-[13px] font-bold transition-colors border-b-2 ${
              tab === t
                ? 'text-primary border-primary bg-primary/5'
                : 'text-[#555] border-transparent hover:text-[#aaa]'
            }`}>
            {t === 'buy' ? '🛍️ Купить' : '💸 Продать'}
          </button>
        ))}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-[6px]">

        {/* BUY TAB */}
        {tab === 'buy' && MERCHANT_ITEMS.map(shopItem => {
          const def = ITEM_CATALOG[shopItem.key];
          if (!def) return null;
          const rs         = RARITY_STYLE[def.rarity];
          const canAfford  = playerGold >= shopItem.price;
          const isConsumable = def.type === 'consumable';
          const healAmt    = isConsumable ? (CONSUMABLE_HEAL[shopItem.key] ?? 0) : 0;
          const bonusLines = isConsumable ? [] : formatBonuses(def.bonuses);
          return (
            <div key={shopItem.key}
              className={`flex items-center gap-3 p-3 rounded-lg border ${rs.border} ${rs.bg} ${rs.glow}`}>

              {/* Item info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[6px] mb-[2px]">
                  <span className={`text-[13px] font-bold ${rs.text} leading-tight`}>{def.name}</span>
                  <span className={`text-[9px] font-bold uppercase px-[4px] py-[1px] rounded border ${rs.border} ${rs.text} opacity-60`}>
                    {rs.label}
                  </span>
                </div>
                {isConsumable ? (
                  <p className="text-[11px] text-green-500">❤️ Восстанавливает {healAmt} HP</p>
                ) : bonusLines.length > 0 ? (
                  <p className="text-[10px] text-[#88c] font-mono">{bonusLines.join(' · ')}</p>
                ) : (
                  <p className="text-[10px] text-[#555]">{TYPE_LABEL[def.type]}</p>
                )}
              </div>

              {/* Price + button */}
              <div className="flex flex-col items-end gap-[5px] shrink-0">
                <span className={`text-[12px] font-bold font-mono ${canAfford ? 'text-yellow-400' : 'text-[#6b3c1a]'}`}>
                  💰 {shopItem.price}
                </span>
                <button
                  disabled={!canAfford}
                  onClick={() => onBuy(shopItem.key)}
                  className="px-3 py-[4px] rounded border text-[11px] font-bold transition-all active:scale-95
                    border-primary bg-primary/20 text-primary
                    disabled:opacity-25 disabled:cursor-not-allowed
                    enabled:hover:bg-primary/35">
                  Купить
                </button>
              </div>
            </div>
          );
        })}

        {/* SELL TAB */}
        {tab === 'sell' && (
          sellable.length === 0 ? (
            <p className="text-center text-[#444] text-[12px] italic py-10">Нечего продавать</p>
          ) : sellable.map(item => {
            const rs      = RARITY_STYLE[item.rarity];
            const price   = sellPrice(item);
            const isConsumable = item.type === 'consumable';
            const healAmt  = isConsumable ? (CONSUMABLE_HEAL[item.key] ?? 0) : 0;
            const bonusLines = isConsumable ? [] : formatBonuses(item.bonuses);
            return (
              <div key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${rs.border} ${rs.bg}`}>

                {/* Item info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-[6px] mb-[2px]">
                    <span className={`text-[13px] font-bold ${rs.text} leading-tight`}>{item.name}</span>
                    <span className={`text-[9px] font-bold uppercase px-[4px] py-[1px] rounded border ${rs.border} ${rs.text} opacity-60`}>
                      {rs.label}
                    </span>
                  </div>
                  {isConsumable ? (
                    <p className="text-[11px] text-green-500">❤️ Восстанавливает {healAmt} HP</p>
                  ) : bonusLines.length > 0 ? (
                    <p className="text-[10px] text-[#88c] font-mono">{bonusLines.join(' · ')}</p>
                  ) : (
                    <p className="text-[10px] text-[#555]">{TYPE_LABEL[item.type]}</p>
                  )}
                </div>

                {/* Sell price + button */}
                <div className="flex flex-col items-end gap-[5px] shrink-0">
                  <span className="text-[12px] font-bold font-mono text-yellow-400">💰 {price}</span>
                  <button
                    onClick={() => onSell(item.id)}
                    className="px-3 py-[4px] rounded border text-[11px] font-bold transition-all active:scale-95
                      border-[#555] bg-[#0f0f14] text-[#aaa] hover:text-white hover:border-[#888]">
                    Продать
                  </button>
                </div>
              </div>
            );
          })
        )}

      </div>

      {/* ── Footer hint ────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-2 border-t border-tile-border/30 flex items-center justify-center">
        <span className="text-[9px] text-[#333] font-mono uppercase tracking-wide">
          {tab === 'sell' ? 'Выкуп — 50% от цены' : 'Удачных покупок, путник'}
        </span>
      </div>

    </div>
  );
}
