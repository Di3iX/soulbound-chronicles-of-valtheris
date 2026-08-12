import { describe, it, expect } from 'vitest';
import {
  CRAFT_RECIPES, countKey, canCraft, isRecipeUnlocked, learnRecipe, craftItem, getRecipe, recipeTab,
} from './craft';
import { makeItem, type Item } from '../inventory';
import type { QuestProgress } from '../quests/quests';

const NO_PROGRESS: QuestProgress = {};

function stack(key: string, count: number): Item[] {
  return Array.from({ length: count }, () => makeItem(key, { rollAffixes: false }));
}

describe('CRAFT_RECIPES — data integrity', () => {
  it('every recipe.resultKey exists in the item catalog (craftItem would otherwise always fail)', () => {
    for (const r of CRAFT_RECIPES) {
      expect(() => makeItem(r.resultKey), r.id).not.toThrow();
    }
  });

  it('every recipe id is unique', () => {
    const ids = CRAFT_RECIPES.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every recipe has at least one ingredient', () => {
    for (const r of CRAFT_RECIPES) expect(r.ingredients.length, r.id).toBeGreaterThan(0);
  });
});

describe('countKey / canCraft', () => {
  it('countKey counts matching items only', () => {
    const inv = [...stack('wolf_hide', 2), ...stack('boar_hide', 1)];
    expect(countKey(inv, 'wolf_hide')).toBe(2);
    expect(countKey(inv, 'boar_hide')).toBe(1);
    expect(countKey(inv, 'nonexistent_key')).toBe(0);
  });

  it('canCraft is true only when every ingredient count is met', () => {
    const recipe = getRecipe('craft_leather_patch')!; // 2× wolf_hide, 1× boar_hide
    expect(canCraft(recipe, [...stack('wolf_hide', 2), ...stack('boar_hide', 1)])).toBe(true);
    expect(canCraft(recipe, [...stack('wolf_hide', 1), ...stack('boar_hide', 1)])).toBe(false);
    expect(canCraft(recipe, [])).toBe(false);
  });
});

describe('isRecipeUnlocked', () => {
  it('unlockedByDefault recipes are always available', () => {
    const recipe = getRecipe('craft_leather_patch')!;
    expect(isRecipeUnlocked(recipe, [], [], NO_PROGRESS)).toBe(true);
  });

  it('a recipe already in the unlocked list is available even without its scroll', () => {
    const recipe = getRecipe('craft_boar_blade')!; // requiresRecipeItem
    expect(isRecipeUnlocked(recipe, [recipe.id], [], NO_PROGRESS)).toBe(true);
  });

  it('a scroll-gated recipe needs the scroll in inventory (or to already be learned)', () => {
    const recipe = getRecipe('craft_boar_blade')!; // requiresRecipeItem: recipe_boar_blade
    expect(isRecipeUnlocked(recipe, [], [], NO_PROGRESS)).toBe(false);
    expect(isRecipeUnlocked(recipe, [], stack('recipe_boar_blade', 1), NO_PROGRESS)).toBe(true);
  });

  it('a quest-gated recipe needs the quest completed', () => {
    const recipe = getRecipe('craft_ice_charm')!; // requiresQuest: quest_ice_001 AND requiresRecipeItem
    const notDone: QuestProgress = { quest_ice_001: { status: 'active', current: 0 } };
    const done: QuestProgress    = { quest_ice_001: { status: 'completed', current: 1 } };
    // Even with the scroll, an incomplete gating quest blocks it (requiresQuest checked first).
    expect(isRecipeUnlocked(recipe, [], stack('recipe_ice_charm', 1), notDone)).toBe(false);
    expect(isRecipeUnlocked(recipe, [], stack('recipe_ice_charm', 1), done)).toBe(true);
  });
});

describe('learnRecipe', () => {
  it('refuses to re-learn an already-known or default recipe', () => {
    const recipe = getRecipe('craft_leather_patch')!; // unlockedByDefault
    const r = learnRecipe(recipe, [], []);
    expect(r.learned).toBe(false);
  });

  it('consumes exactly one scroll and adds the recipe id when learning a scroll-gated recipe', () => {
    const recipe = getRecipe('craft_boar_blade')!;
    const inv = stack('recipe_boar_blade', 2);
    const r = learnRecipe(recipe, [], inv);
    expect(r.learned).toBe(true);
    expect(r.unlocked).toContain(recipe.id);
    expect(countKey(r.inventory, 'recipe_boar_blade')).toBe(1); // consumed exactly 1
  });

  it('refuses to learn a scroll-gated recipe with no scroll in hand', () => {
    const recipe = getRecipe('craft_boar_blade')!;
    const r = learnRecipe(recipe, [], []);
    expect(r.learned).toBe(false);
  });
});

describe('craftItem', () => {
  it('fails with a reason when ingredients are missing, and does not touch the inventory', () => {
    const recipe = getRecipe('craft_leather_patch')!;
    const result = craftItem(recipe, []);
    expect(result.ok).toBe(false);
  });

  it('on success: consumes exactly the required ingredients and adds one result item', () => {
    const recipe = getRecipe('craft_leather_patch')!; // 2× wolf_hide, 1× boar_hide
    const inv = [...stack('wolf_hide', 3), ...stack('boar_hide', 1)]; // 1 extra wolf_hide
    const result = craftItem(recipe, inv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(countKey(result.inventory, 'wolf_hide')).toBe(1); // 3 - 2 consumed
    expect(countKey(result.inventory, 'boar_hide')).toBe(0); // 1 - 1 consumed
    expect(result.item.key).toBe(recipe.resultKey);
    // Total item count: (3+1) - 3 consumed + 1 crafted = 2
    expect(result.inventory).toHaveLength(2);
  });

  it('fails cleanly for an unknown result key instead of throwing', () => {
    const bogusRecipe = { ...getRecipe('craft_leather_patch')!, resultKey: 'not_a_real_item' };
    const result = craftItem(bogusRecipe, stack('wolf_hide', 2).concat(stack('boar_hide', 1)));
    expect(result.ok).toBe(false);
  });
});

describe('recipeTab', () => {
  it('maps a recipe to the item-type tab of its result', () => {
    expect(recipeTab(getRecipe('craft_leather_patch')!)).toBe('armor');
    expect(recipeTab(getRecipe('craft_wolf_charm')!)).toBe('amulet');
    expect(recipeTab(getRecipe('craft_field_ration')!)).toBe('consumable');
  });
});
