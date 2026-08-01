// ─── CRAFTING ─────────────────────────────────────────────────────────────────
import type { Item } from './inventory';
import { makeItem, ITEM_CATALOG } from './inventory';

export interface CraftIngredient {
  key: string;
  count: number;
}

export interface CraftRecipe {
  id: string;
  /** Result item key in ITEM_CATALOG */
  resultKey: string;
  ingredients: CraftIngredient[];
  /** Shown at blacksmith */
  label: string;
  description: string;
}

/** Recipes available at the village blacksmith. */
export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'craft_leather_patch',
    resultKey: 'leather_armor',
    label: 'Кожаный доспех',
    description: 'Грубая броня из шкур.',
    ingredients: [
      { key: 'wolf_hide', count: 2 },
      { key: 'boar_hide', count: 1 },
    ],
  },
  {
    id: 'craft_wolf_charm',
    resultKey: 'bone_amulet',
    label: 'Костяной амулет',
    description: 'Клыки и кости — защита от зверя.',
    ingredients: [
      { key: 'wolf_fang', count: 2 },
      { key: 'raw_meat', count: 1 },
    ],
  },
  {
    id: 'craft_crystal_charm',
    resultKey: 'pendant_of_protection',
    label: 'Кулон защиты',
    description: 'Чёрный кристалл в оправе — холодит кожу.',
    ingredients: [
      { key: 'black_crystal', count: 2 },
      { key: 'silver_ring', count: 1 },
    ],
  },
  {
    id: 'craft_field_ration',
    resultKey: 'healing_potion',
    label: 'Полевое зелье',
    description: 'Мясо и травы в пузырьке.',
    ingredients: [
      { key: 'raw_meat', count: 2 },
      { key: 'rat_tail', count: 1 },
    ],
  },
  {
    id: 'craft_boar_blade',
    resultKey: 'iron_sword',
    label: 'Клинок с клыком',
    description: 'Кузнец вковывает клык кабана в клинок.',
    ingredients: [
      { key: 'boar_tusk', count: 1 },
      { key: 'rusty_sword', count: 1 },
      { key: 'black_crystal', count: 1 },
    ],
  },
];

export function countKey(inventory: Item[], key: string): number {
  return inventory.filter(i => i.key === key).length;
}

export function canCraft(recipe: CraftRecipe, inventory: Item[]): boolean {
  return recipe.ingredients.every(ing => countKey(inventory, ing.key) >= ing.count);
}

/** Remove ingredients (first matching items) and return new inventory + crafted item. */
export function craftItem(
  recipe: CraftRecipe,
  inventory: Item[],
): { ok: true; inventory: Item[]; item: Item } | { ok: false; reason: string } {
  if (!ITEM_CATALOG[recipe.resultKey]) {
    return { ok: false, reason: `Неизвестный рецепт: ${recipe.resultKey}` };
  }
  if (!canCraft(recipe, inventory)) {
    return { ok: false, reason: 'Не хватает материалов' };
  }

  let next = [...inventory];
  for (const ing of recipe.ingredients) {
    let left = ing.count;
    const kept: Item[] = [];
    for (const it of next) {
      if (it.key === ing.key && left > 0) {
        left -= 1;
        continue;
      }
      kept.push(it);
    }
    next = kept;
  }

  const item = makeItem(recipe.resultKey);
  return { ok: true, inventory: [...next, item], item };
}

export function recipeRequirementsText(recipe: CraftRecipe): string {
  return recipe.ingredients
    .map(ing => {
      const name = ITEM_CATALOG[ing.key]?.name ?? ing.key;
      return `${ing.count}× ${name}`;
    })
    .join(', ');
}
