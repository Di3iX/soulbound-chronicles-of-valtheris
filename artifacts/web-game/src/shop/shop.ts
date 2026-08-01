// ─── SHOP / MERCHANT SYSTEM ───────────────────────────────────────────────────

export interface ShopItem {
  key:   string;
  price: number; // gold cost to BUY from merchant
}

/** Items the Village Merchant sells. */
export const MERCHANT_ITEMS: ShopItem[] = [
  // Consumables
  { key: 'healing_potion',         price: 25  },
  { key: 'greater_healing_potion', price: 75  },
  { key: 'mana_potion',            price: 25  },
  { key: 'greater_mana_potion',    price: 75  },
  { key: 'raw_meat',               price: 8   },
  // Weapons
  { key: 'rusty_sword',            price: 100 },
  { key: 'iron_sword',             price: 220 },
  // Armor
  { key: 'leather_helm',           price: 80  },
  { key: 'leather_armor',          price: 120 },
  { key: 'leather_gloves',         price: 60  },
  { key: 'light_boots',            price: 60  },
  // Accessories
  { key: 'copper_ring',            price: 90  },
  { key: 'silver_ring',            price: 160 },
];

/** Fast-lookup: buy price by item key. */
export const SHOP_BUY_PRICE: Record<string, number> = Object.fromEntries(
  MERCHANT_ITEMS.map(i => [i.key, i.price]),
);

/** How much HP each consumable restores when used. */
export const CONSUMABLE_HEAL: Record<string, number> = {
  healing_potion:         50,
  greater_healing_potion: 150,
  raw_meat:               20,
};

/** How much MP each consumable restores when used. */
export const CONSUMABLE_MANA: Record<string, number> = {
  mana_potion:         30,
  greater_mana_potion: 90,
};

/** Material / trophy sell prices (craft mats, boss tokens). */
export const MAT_SELL_PRICE: Record<string, number> = {
  // Field / forest mats
  rat_tail:        3,
  raw_meat:        4,
  wolf_hide:       10,
  wolf_fang:       12,
  boar_hide:       12,
  boar_tusk:       15,
  // Story / rare mats
  black_crystal:   35,
  // Boss trophies (first-kill unique-ish)
  goblin_chief_trophy:  80,
  huge_boar_trophy:     40,
  tomb_keeper_trophy:  100,
  swamp_horror_trophy: 110,
  stone_guardian_trophy: 120,
  pass_lord_trophy:    130,
  ice_king_trophy:     200,
};

/** Rarity fallback sell values for items not sold by the merchant. */
const RARITY_SELL_FALLBACK: Record<string, number> = {
  common: 5, uncommon: 15, rare: 35, epic: 75, legendary: 150,
};

/**
 * Sell price for any item.
 * 1) Material table  2) Shop buy/2  3) Rarity fallback
 */
export function sellPrice(item: { key: string; rarity: string }): number {
  if (MAT_SELL_PRICE[item.key] !== undefined) return MAT_SELL_PRICE[item.key];
  const buy = SHOP_BUY_PRICE[item.key];
  return buy !== undefined
    ? Math.floor(buy * 0.5)
    : RARITY_SELL_FALLBACK[item.rarity] ?? 5;
}
