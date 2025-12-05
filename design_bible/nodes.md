# Technical Notes

## Coordinate System
The game world uses a true Cartesian coordinate system.
- Player starts at `(0,0)`.
- **Chunking:** The world is divided into grid cells (Chunks) of size `2000x2000`.
- **Generation:** When the player enters a chunk, we hash the chunk's `(x, y)` coordinates to seed a random number generator. This ensures that returning to a location always yields the same terrain layout.

## Data Structures

### Save Data
```typescript
interface SaveData {
    credits: number;
    resources: { iron: number; titanium: number; ... };
    shipStats: {
        maxHull: number;
        cargoSize: number;
        laserPower: number;
        enginePower: number;
    };
    position: { x: number; y: number };
}
```

### Canvas Rendering
To maintain the "Vector" aesthetic:
- `ctx.strokeStyle` is used heavily.
- `ctx.shadowBlur` creates the "glow" effect.
- No external sprites. Everything is `ctx.beginPath()`, `ctx.moveTo()`, `ctx.lineTo()`.

## Progression Math
Cost formula for upgrades:
`Cost = BaseCost * (GrowthFactor ^ CurrentLevel)`

This ensures that while the numbers get massive, they never "break" the game, they just require venturing further into the void to find richer resources.
