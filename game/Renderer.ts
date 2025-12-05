import { Entity, EntityType, Particle, Vector2 } from '../types';
import { RESOURCES } from '../constants';
import { seededRandom } from './utils';

export const drawShip = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, isThrusting: boolean) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Ship Body (Vector Style)
    ctx.strokeStyle = '#a3e635'; // Lime
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-10, 7);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, -7);
    ctx.closePath();
    ctx.stroke();

    // Cockpit
    ctx.fillStyle = '#000';
    ctx.fill();

    // Thruster flame
    if (isThrusting) {
        ctx.strokeStyle = '#ef4444'; // Red
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-15, 0);
        ctx.stroke();
    }

    ctx.restore();
};

export const drawAsteroid = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, seed: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#9ca3af'; // Gray
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Generate jagged shape based on seed
    const sides = 8;
    for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        // Deterministic variation
        const dist = radius * (0.8 + 0.4 * seededRandom(seed + i)); 
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.restore();
};

export const drawHub = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
    
    // Pulse effect
    const time = Date.now() / 1000;
    const pulse = 1 + Math.sin(time * 2) * 0.1;

    ctx.strokeStyle = '#22d3ee'; // Cyan
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 40 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(-15, -15, 30, 30);
    ctx.stroke();

    // Text Label
    ctx.fillStyle = '#22d3ee';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText("HUB-01", 0, -50);

    ctx.restore();
};

export const renderGame = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camera: Vector2,
    entities: Entity[],
    particles: Particle[],
    laser: { active: boolean; range: number },
    inputs: { thrust: boolean }
) => {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid (Illusion of movement)
    const gridSize = 100;
    const offX = -camera.x % gridSize;
    const offY = -camera.y % gridSize;
    
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = offX; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    for (let y = offY; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Render Entities relative to Camera
    entities.forEach(e => {
        const rx = e.pos.x - camera.x;
        const ry = e.pos.y - camera.y;

        // Cull off-screen
        if (rx < -100 || rx > width + 100 || ry < -100 || ry > height + 100) return;

        if (e.type === EntityType.PLAYER) {
            drawShip(ctx, rx, ry, e.angle, inputs.thrust);
        } else if (e.type === EntityType.ASTEROID) {
            drawAsteroid(ctx, rx, ry, e.radius, parseInt(e.id.substring(0, 8), 16) || 0);
        } else if (e.type === EntityType.HUB) {
            drawHub(ctx, rx, ry);
        } else if (e.type === EntityType.RESOURCE) {
            ctx.save();
            ctx.translate(rx, ry);
            ctx.fillStyle = RESOURCES[e.resourceType!].color;
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    });

    // Laser Beam
    if (laser.active) {
        const player = entities.find(e => e.type === EntityType.PLAYER);
        if (player) {
            const rx = player.pos.x - camera.x;
            const ry = player.pos.y - camera.y;
            
            ctx.save();
            ctx.translate(rx, ry);
            ctx.rotate(player.angle);
            
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.5 + Math.random() * 0.5})`; // Cyan flicker
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(laser.range, 0);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Particles
    particles.forEach(p => {
        const rx = p.x - camera.x;
        const ry = p.y - camera.y;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.rect(rx, ry, p.size, p.size);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    // Coordinates Debug
    const player = entities.find(e => e.type === EntityType.PLAYER);
    if (player) {
        ctx.fillStyle = '#3f6212';
        ctx.font = '14px Courier New';
        ctx.textAlign = 'right';
        ctx.fillText(`POS: ${Math.floor(player.pos.x)}, ${Math.floor(player.pos.y)}`, width - 20, height - 20);
        ctx.textAlign = 'left';
    }
};