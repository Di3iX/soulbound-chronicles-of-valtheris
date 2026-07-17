// ─── SHOP / MERCHANT SYSTEM ───────────────────────────────────────────────────

export interface ShopItem {
  key:   string;
  price: number; // gold cost to BUY from merchant
}

/** Items the Village Merchant sells. */
export const MERCHANT_ITEMS: ShopItem[] = [
  { key: 'healing_potion',         price: 25  },
  { key: 'greater_healing_potion', price: 75  },
  { key: 'rusty_sword',            price: 100 },
  { key: 'leather_helm',           price: 80  },
  { key: 'leather_armor',          price: 120 },
];

/** Fast-lookup: buy price by item key. */
export const SHOP_BUY_PRICE: Record<string, number> = Object.fromEntries(
  MERCHANT_ITEMS.map(i => [i.key, i.price]),
);

/** How much HP each consumable restores when used. */
export const CONSUMABLE_HEAL: Record<string, number> = {
  healing_potion:         50,
  greater_healing_potion: 150,
};

/** Rarity fallback sell values for items not sold by the merchant. */
const RARITY_SELL_FALLBACK: Record<string, number> = {
  common: 5, uncommon: 15, rare: 35, epic: 75, legendary: 150,
};

/**
 * Sell price for any item.
 * Shop items: 50% of buy price (floor).
 * Other items: rarity-based fallback.
 */
export function sellPrice(item: { key: string; rarity: string }): number {
  const buy = SHOP_BUY_PRICE[item.key];
  return buy !== undefined
    ? Math.floor(buy * 0.5)
    : RARITY_SELL_FALLBACK[item.rarity] ?? 5;
}
