# Game Design Document: Aether Drifter

## 1. Overview
**Aether Drifter** is an infinite, open-world 2D space exploration and survival game. The player controls a "Dredge Unit," a specialized spacecraft designed to harvest matter from a heat-death universe.

## 2. Worldbuilding & Lore
The universe has reached a state of near-maximum entropy. Stars have gone cold, and planets have crumbled into dust fields. The player is an AI consciousness housed in a self-repairing Dredge Unit.
*   **The Hub:** A pocket dimension singularity where entropy is reversed. This is the "safe zone" where the player starts.
*   **The Aether:** The infinite void outside the Hub. It gets colder, darker, and more hostile the further you travel.
*   **The Goal:** There is no ultimate end. The goal is to sustain existence, expand the Hub's influence, and survive the deepening dark.

## 3. Gameplay Mechanics

### 3.1 Core Loop
1.  **Undock:** Leave the Hub.
2.  **Traverse:** Navigate using Newtonian physics (thrust, drift).
3.  **Harvest:** Use mining lasers to break down asteroids and derelicts.
4.  **Combat:** Defend against "Entropy Echoes" (rogue automated defenses).
5.  **Return:** Travel back to coordinates (0,0) to dock.
6.  **Upgrade:** Convert matter into upgrades to survive deeper runs.

### 3.2 Infinite Progression
The game does not use "Prestige" or "Reset" mechanics. Instead, it uses coordinate-based scaling.
*   **Distance Factor:** The further from (0,0), the tougher the rocks, the higher the resource yield, and the more dangerous the enemies.
*   **Upgrades:** Upgrades (Hull, Laser, Engine, Cargo) have no level cap. Their costs scale exponentially, as do their benefits.

### 3.3 Controls
*   **W/Up:** Thrusters (Forward).
*   **A/D/Left/Right:** Rotate.
*   **S/Down:** Reverse Thrusters (Brake).
*   **Space:** Fire Mining Laser.
*   **E:** Interact / Dock.
*   **M:** Toggle Map/Stats.

## 4. Art Style
*   **Vector/Wireframe:** High-contrast lines against a deep black background.
*   **No Bitmaps/Emojis:** All visuals are procedurally drawn shapes or SVGs.
*   **CRT Aesthetic:** Subtle chromatic aberration and scanlines to mimic an old terminal interface.

## 5. Technical Constraints
*   **No AI Generation:** Hand-coded logic.
*   **State Persistence:** LocalStorage saves position, inventory, and upgrades.
*   **Performance:** Canvas API for the game loop to handle hundreds of particles/entities.
