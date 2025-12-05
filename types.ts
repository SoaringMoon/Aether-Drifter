export interface Vector2 {
    x: number;
    y: number;
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

export enum EntityType {
    PLAYER = 'PLAYER',
    ASTEROID = 'ASTEROID',
    RESOURCE = 'RESOURCE',
    HUB = 'HUB'
}

export interface Entity {
    id: string;
    type: EntityType;
    pos: Vector2;
    vel: Vector2;
    radius: number;
    angle: number;
    health?: number;
    maxHealth?: number;
    resourceType?: ResourceType;
    value?: number;
    toRemove?: boolean;
}

export enum ResourceType {
    IRON = 'IRON',
    TITANIUM = 'TITANIUM',
    GOLD = 'GOLD',
    AETHERIUM = 'AETHERIUM'
}

export interface PlayerStats {
    maxHull: number;
    currentHull: number;
    cargoSize: number;
    laserPower: number;
    laserRange: number;
    engineSpeed: number;
    turnSpeed: number;
}

export interface Inventory {
    credits: number;
    resources: Record<ResourceType, number>;
}

export interface UpgradeConfig {
    id: string;
    name: string;
    description: string;
    baseCost: number;
    costMultiplier: number;
    level: number;
    valueMultiplier: number; // How much the stat increases per level
}

export interface GameState {
    player: PlayerStats;
    inventory: Inventory;
    upgrades: Record<string, number>; // Upgrade ID -> Level
    position: Vector2; // Saved position
}