import { GameState, Inventory, PlayerStats, ResourceType, UpgradeConfig } from "../types";
import { INITIAL_STATS, RESOURCES, UPGRADE_DEFS } from "../constants";

const SAVE_KEY = "aether_drifter_save_v1";

export const getInitialState = (): GameState => ({
    player: { ...INITIAL_STATS, currentHull: INITIAL_STATS.maxHull },
    inventory: {
        credits: 0,
        resources: {
            [ResourceType.IRON]: 0,
            [ResourceType.TITANIUM]: 0,
            [ResourceType.GOLD]: 0,
            [ResourceType.AETHERIUM]: 0,
        }
    },
    upgrades: {
        'hull': 0,
        'cargo': 0,
        'laser_p': 0,
        'engine': 0,
    },
    position: { x: 0, y: 0 }
});

export const loadGame = (): GameState => {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge with initial state to handle schema updates
            return {
                ...getInitialState(),
                ...parsed,
                player: { ...getInitialState().player, ...parsed.player },
                inventory: { ...getInitialState().inventory, ...parsed.inventory },
                upgrades: { ...getInitialState().upgrades, ...parsed.upgrades }
            };
        }
    } catch (e) {
        console.error("Failed to load save", e);
    }
    return getInitialState();
};

export const saveGame = (state: GameState) => {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Failed to save", e);
    }
};

export const calculateUpgradeCost = (id: string, currentLevel: number): number => {
    const def = UPGRADE_DEFS[id];
    return Math.floor(def.baseCost * Math.pow(def.costMultiplier, currentLevel));
};

export const applyUpgradesToStats = (baseStats: PlayerStats, upgrades: Record<string, number>): PlayerStats => {
    const newStats = { ...baseStats };
    
    // Hull
    newStats.maxHull += upgrades['hull'] * UPGRADE_DEFS['hull'].valueMultiplier;
    
    // Cargo
    newStats.cargoSize += upgrades['cargo'] * UPGRADE_DEFS['cargo'].valueMultiplier;
    
    // Laser
    newStats.laserPower += upgrades['laser_p'] * UPGRADE_DEFS['laser_p'].valueMultiplier;
    
    // Engine
    newStats.engineSpeed += upgrades['engine'] * UPGRADE_DEFS['engine'].valueMultiplier;
    
    return newStats;
};
