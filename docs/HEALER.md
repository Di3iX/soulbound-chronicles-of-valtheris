# Лекарь — полное исцеление

## Файлы
- `src/quests/npc.ts` — диалог + action `{ kind: 'heal' }`

## App.tsx — handleQuestAction

```ts
if (action.kind === 'heal') {
  playerHpRef.current = playerMaxHpRef.current;
  setPlayerHp(playerMaxHpRef.current);
  playerMpRef.current = playerMaxMpRef.current;
  setPlayerMp(playerMaxMpRef.current);
  // опционально снять дебаффы:
  playerStatusEffectsRef.current = [];
  setPlayerStatusEffects([]);
  log('💚 Лекарь восстановил ваши силы.');
  setQuestDialogue(null);
  return;
}
```

Используй актуальные max HP/MP из `computeStats` / refs, как у тебя уже для боя.

## Где
Деревня, NPC **💚 Лекарь** (id: `healer`).
