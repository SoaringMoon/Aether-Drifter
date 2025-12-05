import { ResourceType, UpgradeConfig } from './types';

export const CHUNK_SIZE = 2000;

export const INITIAL_STATS = {
    maxHull: 100,
    cargoSize: 20,
    laserPower: 10,
    laserRange: 300,
    engineSpeed: 0.15,
    turnSpeed: 0.05
};

export const RESOURCES: Record<ResourceType, { name: string; baseValue: number; color: string; rarity: number }> = {
    [ResourceType.IRON]: { name: "Ferrite", baseValue: 5, color: "#9ca3af", rarity: 0.8 },
    [ResourceType.TITANIUM]: { name: "Titanium", baseValue: 15, color: "#60a5fa", rarity: 0.15 },
    [ResourceType.GOLD]: { name: "Aurum", baseValue: 40, color: "#facc15", rarity: 0.04 },
    [ResourceType.AETHERIUM]: { name: "Aetherium", baseValue: 100, color: "#d946ef", rarity: 0.01 },
};

export const UPGRADE_DEFS: Record<string, Omit<UpgradeConfig, 'level'>> = {
    'hull': {
        id: 'hull',
        name: 'Hull Reinforcement',
        description: 'Increases maximum hull integrity.',
        baseCost: 50,
        costMultiplier: 1.5,
        valueMultiplier: 25
    },
    'cargo': {
        id: 'cargo',
        name: 'Cargo Bay Expansion',
        description: 'Increases resource storage capacity.',
        baseCost: 100,
        costMultiplier: 1.6,
        valueMultiplier: 10
    },
    'laser_p': {
        id: 'laser_p',
        name: 'Laser Intensity',
        description: 'Increases mining speed.',
        baseCost: 75,
        costMultiplier: 1.7,
        valueMultiplier: 5
    },
    'engine': {
        id: 'engine',
        name: 'Thruster Output',
        description: 'Increases max speed and acceleration.',
        baseCost: 80,
        costMultiplier: 1.4,
        valueMultiplier: 0.02
    }
};