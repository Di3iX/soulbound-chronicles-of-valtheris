# Чёрные кристаллы + квест «Осколки Тьмы»

## Файлы
- inventory.ts — предмет `black_crystal`
- monsters.ts — дроп с крыс, кабанов, гоблинов, Огромного Кабана
- boss.ts — в общем луте боссов
- quests.ts — `quest_shards_001` (после главаря, сдать 3 шт.)
- npc.ts — диалоги старосты

## App.tsx

### 1) При открытии диалога — передать число кристаллов

```ts
const crystalCount = inventoryRef.current.filter(i => i.key === 'black_crystal').length;
// или из state inventory

const dlg = getNpcDialogue(npc.id, questProgressRef.current, {
  fieldBoarFirstKill: bossStateRef.current.fieldBoar?.firstKillDone,
  caveChiefFirstKill: bossStateRef.current.caveChief?.firstKillDone,
  crystalCount,
});
```

То же в handleNpcInteract.

### 2) При complete_quest — забрать deliverItems

Внутри `if (action.kind === 'complete_quest')` после проверки def:

```ts
if (def.deliverItems) {
  const { key, count } = def.deliverItems;
  let left = count;
  const nextInv: Item[] = [];
  for (const it of inventoryRef.current) {
    if (it.key === key && left > 0) { left -= 1; continue; }
    nextInv.push(it);
  }
  if (left > 0) {
    log('Не хватает предметов для сдачи!');
    return;
  }
  inventoryRef.current = nextInv;
  setInventory(nextInv);
  log(`📦 Сдано: ${count} × ${ITEM_CATALOG[key]?.name ?? key}`);
}
```

## Проверка
1. Убивай крыс/гоблинов/кабана — иногда падает «Чёрный кристалл»
2. После квеста главаря — староста просит 3 кристалла
3. Сдать → награда, кристаллы исчезают из инвентаря
