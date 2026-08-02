// ─── CRAFT PANEL (tabs by item type) ──────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import type { Item } from '../inventory';
import { ITEM_CATALOG } from '../inventory';
import type { QuestProgress } from '../quests/quests';
import {
  CRAFT_RECIPES, CRAFT_TAB_LABEL, RECIPE_RARITY_STYLE, CraftTab, CraftRecipe,
  canCraft, isRecipeUnlocked, recipeRequirementsText, recipeTab,
  type UnlockedRecipes,
} from '../craft';

interface Props {
  inventory: Item[];
  questProgress: QuestProgress;
  unlockedRecipes: UnlockedRecipes;
  onCraft: (recipeId: string) => void;
  onLearn: (recipeId: string) => void;
  onClose: () => void;
}

const TAB_ORDER: CraftTab[] = [
  'weapon', 'armor', 'helmet', 'gloves', 'boots', 'ring', 'amulet', 'consumable',
];

export default function CraftPanel({
  inventory, questProgress, unlockedRecipes, onCraft, onLearn, onClose,
}: Props) {
  const [tab, setTab] = useState<CraftTab>('weapon');

  const { unlocked, locked } = useMemo(() => {
    const u: CraftRecipe[] = [];
    const l: CraftRecipe[] = [];
    for (const r of CRAFT_RECIPES) {
      if (isRecipeUnlocked(r, unlockedRecipes, inventory, questProgress)) u.push(r);
      else l.push(r);
    }
    return { unlocked: u, locked: l };
  }, [inventory, questProgress, unlockedRecipes]);

  const visible = unlocked.filter(r => recipeTab(r) === tab);
  const tabsPresent = TAB_ORDER.filter(t => unlocked.some(r => recipeTab(r) === t));

  return (
    <div className="absolute inset-0 z-[60] bg-[#08080d]/97 flex flex-col rounded backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3 border-b border-tile-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚒️</span>
          <h2 className="text-base font-bold text-primary tracking-wide">Кузница</h2>
        </div>
        <button type="button" onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded border border-tile-border text-[#888] hover:text-white text-sm font-bold">
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 px-2 py-2 border-b border-tile-border shrink-0">
        {tabsPresent.map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
              tab === t
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-tile-border text-[#666] hover:text-[#aaa]'
            }`}>
            {CRAFT_TAB_LABEL[t]}
          </button>
        ))}
        {locked.length > 0 && (
          <button type="button" onClick={() => setTab('locked')}
            className={`px-2 py-1 rounded text-[10px] font-bold border ${
              tab === 'locked'
                ? 'border-red-800 bg-red-950/40 text-red-400'
                : 'border-tile-border text-[#555]'
            }`}>
            🔒 {locked.length}
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2">
        {tab === 'locked' && locked.map(r => (
          <div key={r.id} className={`p-3 rounded-lg border opacity-80 ${RECIPE_RARITY_STYLE[r.rarity].border} ${RECIPE_RARITY_STYLE[r.rarity].bg}`}>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-[#666]">🔒 {r.label}</span>
              <span className="text-[9px] font-bold uppercase" style={{ color: RECIPE_RARITY_STYLE[r.rarity].color }}>
                {RECIPE_RARITY_STYLE[r.rarity].label}
              </span>
            </div>
            <p className="text-[10px] text-[#555] mt-1">
              {r.requiresRecipeItem
                ? `Нужен свиток: ${ITEM_CATALOG[r.requiresRecipeItem]?.name ?? r.requiresRecipeItem}`
                : r.requiresQuest
                  ? `Нужен квест: ${r.requiresQuest}`
                  : 'Закрыто'}
            </p>
          </div>
        ))}

        {tab !== 'locked' && visible.length === 0 && (
          <p className="text-center text-[#555] text-[12px] py-8">В этой вкладке пока пусто</p>
        )}

        {tab !== 'locked' && visible.map(r => {
          const ok = canCraft(r, inventory);
          const needLearn = !!(r.requiresRecipeItem && !unlockedRecipes.includes(r.id) && !r.unlockedByDefault);
          const hasScroll = r.requiresRecipeItem ? inventory.some(i => i.key === r.requiresRecipeItem) : false;
          return (
            <div key={r.id} className={`p-3 rounded-lg border ${RECIPE_RARITY_STYLE[r.rarity].border} ${RECIPE_RARITY_STYLE[r.rarity].bg}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-bold" style={{ color: RECIPE_RARITY_STYLE[r.rarity].color }}>{r.label}</span>
                    <span className="text-[9px] font-bold uppercase px-1 rounded border opacity-80"
                      style={{ color: RECIPE_RARITY_STYLE[r.rarity].color, borderColor: RECIPE_RARITY_STYLE[r.rarity].color }}>
                      {RECIPE_RARITY_STYLE[r.rarity].label}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#888] mt-0.5">{r.description}</p>
                  <p className="text-[10px] text-[#6a8] font-mono mt-1">{recipeRequirementsText(r)}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {needLearn && hasScroll && (
                    <button type="button" onClick={() => onLearn(r.id)}
                      className="px-2 py-1 rounded border border-[#5a7] text-[10px] font-bold text-[#8c8]">
                      Изучить
                    </button>
                  )}
                  <button type="button" disabled={!ok || needLearn}
                    onClick={() => onCraft(r.id)}
                    className="px-2 py-1 rounded border text-[10px] font-bold border-primary bg-primary/20 text-primary
                      disabled:opacity-30 disabled:cursor-not-allowed">
                    Создать
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 px-3 py-2 border-t border-tile-border/40 text-center text-[9px] text-[#444]">
        Свитки рецептов выпадают с врагов · часть рецептов открывается квестами
      </div>
    </div>
  );
}
