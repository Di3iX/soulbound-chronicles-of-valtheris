// ─── CRAFTING (Blacksmith) ────────────────────────────────────────────────────
import type { Item } from '../inventory';
import { ITEM_CATALOG, makeItem, type ItemType } from '../inventory';
import type { QuestProgress } from '../quests/quests';
import { isQuestCompleted } from '../quests/quests';

export interface CraftIngredient {
  key:   string;
  count: number;
}

export type CraftTab =
  | 'weapon'
  | 'armor'
  | 'helmet'
  | 'gloves'
  | 'boots'
  | 'ring'
  | 'amulet'
  | 'consumable'
  | 'locked';

export interface CraftRecipe {
  id:          string;
  resultKey:   string;
  label:       string;
  description: string;
  ingredients: CraftIngredient[];
  /** Always known to the smith. */
  unlockedByDefault?: boolean;
  /** Inventory item key (recipe scroll) required to unlock permanently. */
  requiresRecipeItem?: string;
  /** Quest that must be completed to unlock. */
  requiresQuest?: string;
}

export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'craft_leather_patch',
    resultKey: 'leather_armor',
    label: 'Кожаный доспех',
    description: 'Грубая броня из шкур.',
    unlockedByDefault: true,
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
    unlockedByDefault: true,
    ingredients: [
      { key: 'wolf_fang', count: 2 },
      { key: 'raw_meat', count: 1 },
    ],
  },
  {
    id: 'craft_field_ration',
    resultKey: 'healing_potion',
    label: 'Полевое зелье',
    description: 'Мясо и травы в пузырьке.',
    unlockedByDefault: true,
    ingredients: [
      { key: 'raw_meat', count: 2 },
      { key: 'rat_tail', count: 1 },
    ],
  },
  {
    id: 'craft_boar_blade',
    resultKey: 'iron_sword',
    label: 'Клинок с клыком',
    description: 'Клык кабана в клинке.',
    requiresRecipeItem: 'recipe_boar_blade',
    ingredients: [
      { key: 'boar_tusk', count: 1 },
      { key: 'rusty_sword', count: 1 },
      { key: 'black_crystal', count: 1 },
    ],
  },
  {
    id: 'craft_iron_edge',
    resultKey: 'iron_sword',
    label: 'Железный клинок',
    description: 'Перековка ржавого меча.',
    requiresRecipeItem: 'recipe_iron_edge',
    ingredients: [
      { key: 'rusty_sword', count: 1 },
      { key: 'black_crystal', count: 1 },
    ],
  },
  {
    id: 'craft_chain_patch',
    resultKey: 'chainmail',
    label: 'Кольчуга',
    description: 'Кожа + кристаллы.',
    requiresRecipeItem: 'recipe_chain_patch',
    ingredients: [
      { key: 'leather_armor', count: 1 },
      { key: 'black_crystal', count: 2 },
    ],
  },
  {
    id: 'craft_crystal_charm',
    resultKey: 'pendant_of_protection',
    label: 'Кулон защиты',
    description: 'Чёрный кристалл в оправе.',
    requiresRecipeItem: 'recipe_crystal_charm',
    ingredients: [
      { key: 'black_crystal', count: 2 },
      { key: 'silver_ring', count: 1 },
    ],
  },
  {
    id: 'craft_ice_charm',
    resultKey: 'amulet_of_wisdom',
    label: 'Талисман льда',
    description: 'Против холода Бездны.',
    requiresRecipeItem: 'recipe_ice_charm',
    requiresQuest: 'quest_ice_001',
    ingredients: [
      { key: 'black_crystal', count: 2 },
      { key: 'silver_ring', count: 1 },
    ],
  },
];

export function countKey(inventory: Item[], key: string): number {
  return inventory.filter(i => i.key === key).length;
}

export function canCraft(recipe: CraftRecipe, inventory: Item[]): boolean {
  return recipe.ingredients.every(ing => countKey(inventory, ing.key) >= ing.count);
}

/** Learned recipe ids (persisted in save). */
export type UnlockedRecipes = string[];

export function isRecipeUnlocked(
  recipe: CraftRecipe,
  unlocked: UnlockedRecipes,
  inventory: Item[],
  progress: QuestProgress,
): boolean {
  if (recipe.unlockedByDefault) return true;
  if (unlocked.includes(recipe.id)) return true;
  if (recipe.requiresQuest && !isQuestCompleted(progress, recipe.requiresQuest)) {
    return false;
  }
  if (recipe.requiresRecipeItem) {
    // Has scroll in bag OR already learned
    if (countKey(inventory, recipe.requiresRecipeItem) > 0) return true;
    return false;
  }
  if (recipe.requiresQuest && isQuestCompleted(progress, recipe.requiresQuest)) {
    return true;
  }
  return false;
}

/**
 * Consume recipe scroll and mark learned.
 * Call when player crafts while holding scroll, or presses «Изучить».
 */
export function learnRecipe(
  recipe: CraftRecipe,
  unlocked: UnlockedRecipes,
  inventory: Item[],
): { unlocked: UnlockedRecipes; inventory: Item[]; learned: boolean; msg: string } {
  if (unlocked.includes(recipe.id) || recipe.unlockedByDefault) {
    return { unlocked, inventory, learned: false, msg: 'Уже известно.' };
  }
  if (recipe.requiresRecipeItem) {
    if (countKey(inventory, recipe.requiresRecipeItem) <= 0) {
      return { unlocked, inventory, learned: false, msg: 'Нет свитка рецепта.' };
    }
    // consume one scroll
    let removed = false;
    const nextInv = inventory.filter(it => {
      if (!removed && it.key === recipe.requiresRecipeItem) {
        removed = true;
        return false;
      }
      return true;
    });
    return {
      unlocked: [...unlocked, recipe.id],
      inventory: nextInv,
      learned: true,
      msg: `Изучен рецепт: ${recipe.label}`,
    };
  }
  if (recipe.requiresQuest) {
    return {
      unlocked: [...unlocked, recipe.id],
      inventory,
      learned: true,
      msg: `Изучен рецепт: ${recipe.label}`,
    };
  }
  return { unlocked, inventory, learned: false, msg: 'Нельзя изучить.' };
}

export function craftItem(
  recipe: CraftRecipe,
  inventory: Item[],
): { ok: true; inventory: Item[]; item: Item } | { ok: false; reason: string } {
  if (!ITEM_CATALOG[recipe.resultKey]) {
    return { ok: false, reason: `Неизвестный результат: ${recipe.resultKey}` };
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

export function getRecipe(id: string): CraftRecipe | undefined {
  return CRAFT_RECIPES.find(r => r.id === id);
}

export function recipeTab(recipe: CraftRecipe): CraftTab {
  const t = ITEM_CATALOG[recipe.resultKey]?.type as ItemType | undefined;
  if (!t) return 'consumable';
  if (t === 'weapon') return 'weapon';
  if (t === 'armor') return 'armor';
  if (t === 'helmet') return 'helmet';
  if (t === 'gloves') return 'gloves';
  if (t === 'boots') return 'boots';
  if (t === 'ring') return 'ring';
  if (t === 'amulet') return 'amulet';
  return 'consumable';
}

export const CRAFT_TAB_LABEL: Record<CraftTab, string> = {
  weapon:     '⚔️ Оружие',
  armor:      '🛡️ Броня',
  helmet:     '🪖 Шлемы',
  gloves:     '🧤 Перчатки',
  boots:      '👢 Сапоги',
  ring:       '💍 Кольца',
  amulet:     '📿 Амулеты',
  consumable: '🧪 Прочее',
  locked:     '🔒 Закрыто',
};
