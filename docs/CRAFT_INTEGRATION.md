# Крафт у кузнеца

## Файлы (актуально после рефакторинга — крафт/апгрейд/зачарование/тир вынесены в свою папку)
- `src/items/craft.ts` — `CRAFT_RECIPES`, `craftItem()`, `learnRecipe()`, `isRecipeUnlocked()`
- `src/hooks/useQuestActions.ts` — обработка `action.kind === 'craft'` (ветка внутри
  `handleQuestAction`). **Это больше не в `App.tsx`** — весь диалоговый экшен-диспатчинг
  переехал в этот хук.
- `src/hooks/useItemActions.ts` — `handleCraft`/`handleLearn` для отдельной панели крафта
  (`CraftPanel.tsx`), отдельно от диалога кузнеца.
- `src/quests/npc.ts` — диалог кузнеца + action `craft`
- кузнец уже на карте деревни: id `smith`

## Как это работает сейчас

Внутри `hooks/useQuestActions.ts`, в `handleQuestAction`, ветка `action.kind === 'craft'`:
1. Находит рецепт в `CRAFT_RECIPES` по `action.recipeId`.
2. Вызывает `craftItem(recipe, inventoryRef.current)` — списывает материалы, добавляет результат.
3. Обновляет диалог кузнеца тем же вызовом `getNpcDialogue('smith', ..., buildDialogueFlags(...))`,
   что и при первом открытии — `buildDialogueFlags()` (живёт в `App.tsx`, передаётся в хук как
   зависимость) собирает флаги первого убийства боссов, состояние лекаря и т.д. в одном месте.

Если добавляешь новый craft-триггер в диалоге — правь `handleQuestAction` в
`hooks/useQuestActions.ts`, а НЕ `App.tsx`.

## Рецепты

Актуальный список — источник истины: `CRAFT_RECIPES` в `src/items/craft.ts` (на момент
последнего обновления доков — 8 рецептов). Не дублируем таблицу здесь, чтобы она не расходилась
с кодом второй раз подряд.

## Проверка
1. Набей шкуры/клыки/кристаллы
2. Деревня → кузнец ⚒️
3. Выбери рецепт → предмет в инвентаре, материалы списаны
