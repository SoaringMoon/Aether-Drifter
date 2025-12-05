import { CHUNK_SIZE } from '../constants';
import { Entity, EntityType, ResourceType, Vector2 } from '../types';
import { seededRandom, generateUUID } from './utils';

export const updateChunks = (currentEntities: Entity[], playerPos: Vector2): Entity[] => {
    const currentChunkX = Math.floor(playerPos.x / CHUNK_SIZE);
    const currentChunkY = Math.floor(playerPos.y / CHUNK_SIZE);

    // Define a range of chunks to keep loaded (3x3 grid around player)
    const visibleChunks = new Set<string>();
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            visibleChunks.add(`${currentChunkX + x},${currentChunkY + y}`);
        }
    }

    // Filter entities: Keep Player, Hub, and visible entities
    let newEntities = currentEntities.filter(e => {
        if (e.type === EntityType.PLAYER || e.type === EntityType.HUB) return true;
        if (e.type === EntityType.RESOURCE) return true; 
        
        const chunkX = Math.floor(e.pos.x / CHUNK_SIZE);
        const chunkY = Math.floor(e.pos.y / CHUNK_SIZE);
        return visibleChunks.has(`${chunkX},${chunkY}`);
    });

    // Generate entities for new chunks
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            const cx = currentChunkX + x;
            const cy = currentChunkY + y;
            
            // Check if we already have entities here (rough check)
            const hasEntities = newEntities.some(e => 
                e.type === EntityType.ASTEROID && 
                Math.floor(e.pos.x / CHUNK_SIZE) === cx && 
                Math.floor(e.pos.y / CHUNK_SIZE) === cy
            );

            if (!hasEntities) {
                const chunkEntities = generateChunk(cx, cy);
                newEntities = [...newEntities, ...chunkEntities];
            }
        }
    }

    return newEntities;
};

const generateChunk = (cx: number, cy: number): Entity[] => {
    const created: Entity[] = [];

    // Skip (0,0) chunk for the Hub, make it clear
    if (cx === 0 && cy === 0) return created;

    // Seed based on coordinates
    const seed = cx * 73856093 ^ cy * 19349663;
    const count = 5 + Math.floor(seededRandom(seed) * 10); // 5-15 asteroids per chunk

    for (let i = 0; i < count; i++) {
        const asteroidSeed = seed + i * 1337;
        const rx = seededRandom(asteroidSeed);
        const ry = seededRandom(asteroidSeed + 1);
        
        const x = cx * CHUNK_SIZE + rx * CHUNK_SIZE;
        const y = cy * CHUNK_SIZE + ry * CHUNK_SIZE;

        // Distance from center difficulty scaling
        const dist = Math.sqrt(x*x + y*y);
        const tier = Math.min(3, Math.floor(dist / 10000)); // Every 10k units, potential for better resources

        let resourceType = ResourceType.IRON;
        const rRoll = seededRandom(asteroidSeed + 2);
        
        if (tier >= 1 && rRoll > 0.7) resourceType = ResourceType.TITANIUM;
        if (tier >= 2 && rRoll > 0.85) resourceType = ResourceType.GOLD;
        if (tier >= 3 && rRoll > 0.95) resourceType = ResourceType.AETHERIUM;

        created.push({
            id: generateUUID(),
            type: EntityType.ASTEROID,
            pos: { x, y },
            vel: { x: (seededRandom(asteroidSeed+3)-0.5)*0.5, y: (seededRandom(asteroidSeed+4)-0.5)*0.5 },
            radius: 20 + seededRandom(asteroidSeed+5) * 30,
            angle: seededRandom(asteroidSeed+6) * Math.PI * 2,
            maxHealth: 50 + tier * 50,
            health: 50 + tier * 50,
            resourceType: resourceType,
            value: 10 // score value
        });
    }

    return created;
};