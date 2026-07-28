# Changelog

All notable changes to this project will be documented here.

---

# v0.1.12

### Added

- Damage types: Physical, Fire, Electric, Ice (Ice has no source yet — ready for a future skill/enemy)
- Fire skill deals Fire damage, Lightning skill deals Electric damage
- Per-enemy elemental resistance/weakness (Troll: weak to Fire; Zombie: weak to Electric)
- Elemental resistance stats on equipment (Plate Armor, Void Plate, Wind Walkers, Titan Gauntlets), shown in the character panel and item tooltips

---

# v0.1.11

### Changed

- Enemies now respawn individually in place 30 seconds after death, instead of requiring a full-location "Play Again" reset
- Cave boss respawns automatically 10 minutes after defeat (same "area must be clear" trigger as its first appearance)
- Removed the full-clear "Играть снова" screen — killing the last enemy in a location just logs a message and returns to normal exploration
- Boss encounter state is now a persisted respawn timer instead of a per-location-visit flag

---

# v0.1.10

### Added

- Block: a defensive stat (base 5% + Vitality×0.3 + equipment bonus, capped 50%) that halves incoming damage when it triggers
- Block chance rolls on Iron Helm and Chainmail
- Block % shown in the character panel

---

# v0.1.9

### Added

- Status effects: Poison, Burn, Slow, Stun — bidirectional (enemies ↔ player)
- Giant Spider inflicts Poison, Orc inflicts Stun, Troll inflicts Slow on hit
- Fire skill inflicts Burn, Lightning skill inflicts Stun on enemies
- Status effect icons with countdown in the combat HUD (player and enemy)
- Poison/Burn can kill on their own, triggering normal death/reward or defeat flow

---

# v0.1.8

### Added

- Minimap with fog of war (top-right corner, toggleable)
- Per-location exploration tracking, persisted across sessions
- Exploration progress kept across death/respawn, reset on New Game

---

# v0.1.7

### Added

- Mana system: base pool + level growth + bonuses from the "Arcane Knowledge" skill and equipment
- Mana cost on all skills except the base Strike; insufficient-mana feedback in the skill bar
- Mana regeneration (5 MP/sec) during combat
- Mana potions (regular + greater) sold by the Village Merchant
- Mana bonus rolls on Mage Hood and Arcane Staff
- Mana bar in the combat HUD and character panel

---

# v0.1.6

### Changed

- Major internal refactor: `App.tsx` reduced from 2091 to 811 lines (−61%)
- Combat, equipment, economy, and reset logic extracted into dedicated hooks
- UI split into standalone presentational components (character/inventory/map/HUD/etc.)
- Removed 87 unused files left over from earlier incomplete refactor attempts
- Fixed XP calculation being duplicated in three places (single source of truth now)

### Fixed

- Stale save files could show incorrect XP after a formula/balance change

---

# v0.1.5

### Added

- Random item affixes
- Equipment comparison
- Improved equipment system
- Better item generation
- Improved modular architecture

---

# v0.1.4

### Added

- Talent window
- Character progression improvements
- Better project structure

---

# v0.1.3

### Added

- Character stats
- Equipment bonuses
- Save/Load improvements
- Persistent world progress

---

# v0.1.2

### Added

- Merchant
- Quest system
- Multiple locations
- Zone transitions

---

# v0.1.1

### Added

- Inventory
- Equipment
- Loot system
- Save/Load

---

# v0.1.0

### Added

- Initial project
- First playable prototype
