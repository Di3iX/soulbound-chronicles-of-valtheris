# Сюжет Главы I–II — что заменить

## Файлы
- `src/quests/quests.ts`
- `src/quests/npc.ts`
- `src/hooks/useCombat.ts` (учёт убийства Огромного Кабана в квесте)

## Цепочка
1. Фермер → «Чума на полях» (5 крыс/кабанов)
2. Староста → «Чёрные кристаллы» (убить Огромного Кабана)
3. Староста → «Тень леса» (5 гоблинов)
4. Дальше — охотник / разведчик как побочки

## App.tsx — одна правка (флаги для диалогов)

Где вызывается `getNpcDialogue(...)`, передай флаги:

```ts
const dlg = getNpcDialogue(npc.id, questProgressRef.current, {
  fieldBoarFirstKill: bossStateRef.current.fieldBoar?.firstKillDone,
  caveChiefFirstKill: bossStateRef.current.caveChief?.firstKillDone,
});
```

То же в `handleNpcInteract`, если там отдельный вызов.

Без этого ветки «после кабана» у фермера/старосты не включатся (квесты всё равно работают).
