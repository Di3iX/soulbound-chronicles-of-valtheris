# Крафт у кузнеца

## Файлы
- `src/craft.ts` (или `src/shop/craft.ts`) — рецепты
- `src/quests/npc.ts` — диалог кузнеца + action `craft`
- кузнец уже на карте деревни: id `smith`

## App.tsx — обработка craft

В `handleQuestAction` добавь ветку:

```ts
import { CRAFT_RECIPES, craftItem } from './craft';

// внутри handleQuestAction:
if (action.kind === 'craft') {
  const recipe = CRAFT_RECIPES.find(r => r.id === action.recipeId);
  if (!recipe) { setQuestDialogue(null); return; }
  const result = craftItem(recipe, inventoryRef.current);
  if (!result.ok) {
    log(`⚒️ ${result.reason}`);
    return;
  }
  inventoryRef.current = result.inventory;
  setInventory(result.inventory);
  setLootNotif(result.item.name);
  setTimeout(() => setLootNotif(null), 2500);
  log(`⚒️ Скрафчено: ${result.item.name}!`);
  // обновить диалог кузнеца (те же кнопки)
  const dlg = getNpcDialogue('smith', questProgressRef.current, {
    fieldBoarFirstKill: bossStateRef.current.fieldBoar?.firstKillDone,
    caveChiefFirstKill: bossStateRef.current.caveChief?.firstKillDone,
    crystalCount: result.inventory.filter(i => i.key === 'black_crystal').length,
  });
  if (dlg) setQuestDialogue(dlg);
  return;
}
```

TypeScript: `DialogAction` уже включает `craft` в npc.ts — если App импортирует тип оттуда, ОК.

## Рецепты
| Результат | Материалы |
|-----------|-----------|
| Кожаный доспех | 2× шкура волка, 1× шкура кабана |
| Костяной амулет | 2× клык волка, 1× мясо |
| Кулон защиты | 2× чёрный кристалл, 1× серебряное кольцо |
| Полевое зелье | 2× мясо, 1× крысиный хвост |
| Клинок с клыком | 1× клык кабана, 1× ржавый меч, 1× кристалл |

## Проверка
1. Набей шкуры/клыки/кристаллы
2. Деревня → кузнец ⚒️
3. Выбери рецепт → предмет в инвентаре, материалы списаны
