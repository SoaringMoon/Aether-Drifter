import React, { useEffect, useRef, useState } from 'react';
import { Entity, EntityType, GameState, Particle, ResourceType, Vector2 } from '../types';
import { distance, generateUUID } from './utils';
import { loadGame, saveGame } from './gameState';
import { renderGame } from './Renderer';
import { updateChunks } from './WorldGen';

interface EngineProps {
    onStatsUpdate: (stats: GameState) => void;
    setInDock: (inDock: boolean) => void;
    gameStateRef: React.MutableRefObject<GameState>;
}

const Engine: React.FC<EngineProps> = ({ onStatsUpdate, setInDock, gameStateRef }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    
    // Handle dynamic resizing
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    const dimensionsRef = useRef(dimensions);

    // Game Loop State
    const entities = useRef<Entity[]>([]);
    const particles = useRef<Particle[]>([]);
    const keys = useRef<Record<string, boolean>>({});
    const lastTime = useRef<number>(0);
    const camera = useRef<Vector2>({ x: 0, y: 0 });
    const laserActive = useRef<boolean>(false);

    // Initial Setup
    useEffect(() => {
        const loadedState = loadGame();
        gameStateRef.current = loadedState;
        
        // Initialize Player Entity
        entities.current.push({
            id: 'player',
            type: EntityType.PLAYER,
            pos: { x: loadedState.position.x, y: loadedState.position.y },
            vel: { x: 0, y: 0 },
            radius: 10,
            angle: -Math.PI / 2,
        });

        // Initialize Hub
        entities.current.push({
            id: 'hub',
            type: EntityType.HUB,
            pos: { x: 0, y: 0 },
            vel: { x: 0, y: 0 },
            radius: 60,
            angle: 0
        });

        // Handlers
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            setDimensions({ width, height });
            dimensionsRef.current = { width, height };
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            keys.current[e.code] = true;
            if (e.code === 'KeyE') {
                checkDocking();
            }
        };
    
        const handleKeyUp = (e: KeyboardEvent) => {
            keys.current[e.code] = false;
        };
    
        const handleMouseDown = (e: MouseEvent) => {
            // Ensure we are clicking on the canvas (game world) and not a UI overlay
            if (e.button === 0 && e.target === canvasRef.current) {
                laserActive.current = true;
            }
        };

        const handleMouseUp = () => {
            laserActive.current = false;
        };

        // Attach global listeners
        window.addEventListener('resize', handleResize);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        
        requestRef.current = requestAnimationFrame(animate);

        // Auto-save interval
        const saveInterval = setInterval(() => {
            const player = entities.current.find(e => e.type === EntityType.PLAYER);
            if (player) {
                gameStateRef.current.position = player.pos;
                saveGame(gameStateRef.current);
            }
        }, 5000);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
            clearInterval(saveInterval);
        };
    }, []);

    const checkDocking = () => {
        const player = entities.current.find(e => e.type === EntityType.PLAYER);
        const hub = entities.current.find(e => e.type === EntityType.HUB);
        if (player && hub) {
            if (distance(player.pos, hub.pos) < hub.radius + 50) {
                gameStateRef.current.player.currentHull = gameStateRef.current.player.maxHull;
                gameStateRef.current.position = { x: 0, y: 0 };
                player.vel = { x: 0, y: 0 };
                player.pos = { x: 0, y: -80 }; 
                player.angle = Math.PI / 2;
                
                saveGame(gameStateRef.current);
                onStatsUpdate({ ...gameStateRef.current }); 
                setInDock(true);
            }
        }
    };

    const animate = (time: number) => {
        const dt = (time - lastTime.current) / 1000;
        lastTime.current = time;
        const safeDt = Math.min(dt, 0.1);

        update(safeDt);
        render();

        requestRef.current = requestAnimationFrame(animate);
    };

    const update = (dt: number) => {
        const player = entities.current.find(e => e.type === EntityType.PLAYER);
        if (!player) return;

        const stats = gameStateRef.current.player;

        // Player Input Movement
        if (keys.current['KeyW'] || keys.current['ArrowUp']) {
            player.vel.x += Math.cos(player.angle) * stats.engineSpeed;
            player.vel.y += Math.sin(player.angle) * stats.engineSpeed;
        }
        if (keys.current['KeyS'] || keys.current['ArrowDown']) {
            player.vel.x -= Math.cos(player.angle) * stats.engineSpeed * 0.5;
            player.vel.y -= Math.sin(player.angle) * stats.engineSpeed * 0.5;
        }
        if (keys.current['KeyA'] || keys.current['ArrowLeft']) {
            player.angle -= stats.turnSpeed;
        }
        if (keys.current['KeyD'] || keys.current['ArrowRight']) {
            player.angle += stats.turnSpeed;
        }

        // Friction
        player.vel.x *= 0.98;
        player.vel.y *= 0.98;

        // Update Camera
        camera.current.x = player.pos.x - dimensionsRef.current.width / 2;
        camera.current.y = player.pos.y - dimensionsRef.current.height / 2;

        // Procedural Gen update
        entities.current = updateChunks(entities.current, player.pos);

        // Update Entities
        let cargoChanged = false;

        entities.current.forEach(e => {
            // Movement
            e.pos.x += e.vel.x;
            e.pos.y += e.vel.y;

            // Rotation
            if (e.type === EntityType.ASTEROID) {
                e.angle += 0.005;
            }

            // Resource Collection
            if (e.type === EntityType.RESOURCE && !e.toRemove) {
                const d = distance(player.pos, e.pos);
                // Magnetic pull
                if (d < 150) {
                    const angle = Math.atan2(player.pos.y - e.pos.y, player.pos.x - e.pos.x);
                    e.vel.x += Math.cos(angle) * 1;
                    e.vel.y += Math.sin(angle) * 1;
                }
                
                // Collection
                if (d < player.radius + e.radius) {
                    const currentCargo = Object.values(gameStateRef.current.inventory.resources).reduce((a, b) => a + b, 0);
                    if (currentCargo < stats.cargoSize) {
                        e.toRemove = true;
                        if (e.resourceType) {
                            gameStateRef.current.inventory.resources[e.resourceType]++;
                            cargoChanged = true;
                        }
                    }
                }
            }
        });

        // Laser Logic
        if (laserActive.current) {
            const range = stats.laserRange;
            let target: Entity | null = null;
            let minD = range;

            const pVec = { x: Math.cos(player.angle), y: Math.sin(player.angle) };

            entities.current.forEach(e => {
                if (e.type === EntityType.ASTEROID && !e.toRemove) {
                    const d = distance(player.pos, e.pos);
                    if (d < range) {
                        const dirToAsteroid = { x: (e.pos.x - player.pos.x)/d, y: (e.pos.y - player.pos.y)/d };
                        const dot = pVec.x * dirToAsteroid.x + pVec.y * dirToAsteroid.y;
                        
                        if (dot > 0.9) { 
                            if (d < minD) {
                                minD = d;
                                target = e;
                            }
                        }
                    }
                }
            });

            if (target && target.health !== undefined) {
                target.health -= stats.laserPower;
                
                // Spawn sparks
                for(let i=0; i<3; i++) {
                     particles.current.push({
                        x: target.pos.x + (Math.random() - 0.5) * target.radius,
                        y: target.pos.y + (Math.random() - 0.5) * target.radius,
                        vx: (Math.random() - 0.5) * 5,
                        vy: (Math.random() - 0.5) * 5,
                        life: 1.0,
                        maxLife: 1.0,
                        color: '#facc15',
                        size: 2
                    });
                }

                if (target.health <= 0) {
                    target.toRemove = true;
                    // Drop Resource
                    if (target.resourceType) {
                        const dropCount = 1 + Math.floor(Math.random() * 3);
                        for (let k=0; k<dropCount; k++) {
                            entities.current.push({
                                id: generateUUID(),
                                type: EntityType.RESOURCE,
                                pos: { ...target.pos },
                                vel: { x: (Math.random()-0.5)*2, y: (Math.random()-0.5)*2 },
                                radius: 5,
                                angle: 0,
                                resourceType: target.resourceType
                            });
                        }
                    }
                    // Explosion particles
                    for(let i=0; i<10; i++) {
                        particles.current.push({
                           x: target.pos.x,
                           y: target.pos.y,
                           vx: (Math.random() - 0.5) * 10,
                           vy: (Math.random() - 0.5) * 10,
                           life: 2.0,
                           maxLife: 2.0,
                           color: '#9ca3af',
                           size: 4
                       });
                   }
                }
            }
        }

        // Particle Update
        particles.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt * 2;
        });

        // Clean up
        entities.current = entities.current.filter(e => !e.toRemove);
        particles.current = particles.current.filter(p => p.life > 0);

        if (cargoChanged) {
            onStatsUpdate({ ...gameStateRef.current });
        }
    };

    const render = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        renderGame(
            ctx,
            dimensionsRef.current.width,
            dimensionsRef.current.height,
            camera.current,
            entities.current,
            particles.current,
            { active: laserActive.current, range: gameStateRef.current.player.laserRange },
            { thrust: keys.current['KeyW'] || keys.current['ArrowUp'] }
        );
    };

    return (
        <canvas 
            ref={canvasRef} 
            width={dimensions.width} 
            height={dimensions.height}
            className="block w-full h-full"
        />
    );
};

export default Engine;