# AI Development Rules

When modifying this project always follow these rules.

## General

- Never rebuild the game from scratch.
- Never remove existing working mechanics.
- Always preserve backward compatibility.
- Keep the current visual style.

## Code

- Prefer modular architecture.
- Avoid making App.tsx larger.
- Create new files for new systems.
- Reuse existing modules.

## Gameplay

Never break:

- Combat
- Inventory
- Equipment
- Quests
- Talents
- Merchant
- Save System

## Future MMORPG

Every new feature should be compatible with future multiplayer support.

Avoid hardcoded systems that cannot be synchronized later.

## Versioning

After completing a feature:

- Update CHANGELOG.md
- Keep ROADMAP.md up to date
