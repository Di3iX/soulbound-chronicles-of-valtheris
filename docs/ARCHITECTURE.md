# Architecture

## Project Philosophy

The project uses a modular architecture.

Every game system should be implemented as an independent module whenever possible.

Avoid placing new gameplay systems directly inside App.tsx.

---

## Current Modules

### Player

Responsible for:

- Character
- Levels
- Experience
- Gold
- Stats

---

### Combat

Responsible for:

- Auto combat
- Damage calculation
- Enemy attacks
- Boss combat

---

### Inventory

Responsible for:

- Inventory
- Item collection
- Item management

---

### Equipment

Responsible for:

- Equipment slots
- Equipment bonuses
- Equip / Unequip

---

### Stats

Responsible for:

- Player statistics
- Bonus calculations
- Final stat calculation

---

### Shop

Responsible for:

- Merchant
- Buying
- Selling

---

### Quests

Responsible for:

- Quest system
- Quest rewards
- Quest progression

---

### Skills

Responsible for:

- Talent tree
- Passive skills

Future:

- Active skills

---

### World

Responsible for:

- Maps
- Zone transitions
- World navigation

---

### Save System

Responsible for:

- Saving progress
- Loading progress

Future:

- Cloud Save
- Multiplayer synchronization

---

## Coding Rules

- Keep modules independent.
- Do not duplicate code.
- Keep functions small and readable.
- Reuse existing systems whenever possible.
- All new features must support future MMORPG expansion.

---

## Long-Term Goal

The architecture should allow replacing LocalStorage with a server database without rewriting gameplay systems.
