import React, { useRef, useState, useEffect } from 'react';
import Engine from './game/Engine';
import { GameState, ResourceType } from './types';
import { getInitialState, saveGame, calculateUpgradeCost, applyUpgradesToStats } from './game/gameState';
import { RESOURCES, UPGRADE_DEFS } from './constants';
import { HeartIcon, CubeIcon, ZapIcon, CrosshairIcon, SaveIcon } from './components/Icons';

function App() {
    const gameStateRef = useRef<GameState>(getInitialState());
    
    // UI State
    const [stats, setStats] = useState<GameState>(getInitialState());
    const [inDock, setInDock] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>("Initialize System... Aether Drifter Online.");

    // Sync stats helper (throttle this in a real high-perf scenario, but ok for now)
    const updateStats = (newStats: GameState) => {
        setStats({ ...newStats });
    };

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleSell = () => {
        let totalValue = 0;
        Object.entries(gameStateRef.current.inventory.resources).forEach(([key, amount]) => {
            const type = key as ResourceType;
            totalValue += amount * RESOURCES[type].baseValue;
            gameStateRef.current.inventory.resources[type] = 0;
        });

        if (totalValue > 0) {
            gameStateRef.current.inventory.credits += totalValue;
            saveGame(gameStateRef.current);
            updateStats(gameStateRef.current);
            setMessage(`Sold resources for ${totalValue} credits.`);
        } else {
            setMessage("Cargo empty. Nothing to sell.");
        }
    };

    const handleUpgrade = (id: string) => {
        const currentLevel = gameStateRef.current.upgrades[id];
        const cost = calculateUpgradeCost(id, currentLevel);

        if (gameStateRef.current.inventory.credits >= cost) {
            gameStateRef.current.inventory.credits -= cost;
            gameStateRef.current.upgrades[id]++;
            
            // Re-calculate derived player stats
            const newStats = applyUpgradesToStats(getInitialState().player, gameStateRef.current.upgrades);
            gameStateRef.current.player = {
                ...newStats,
                currentHull: newStats.maxHull // Heal on upgrade
            };

            saveGame(gameStateRef.current);
            updateStats(gameStateRef.current);
            setMessage(`Upgraded ${UPGRADE_DEFS[id].name} to Level ${currentLevel + 1}.`);
        } else {
            setMessage("Insufficient Credits.");
        }
    };

    const handleUndock = () => {
        setInDock(false);
        setMessage("Undocking... Good luck out there, Drifter.");
    };

    const totalCargo = Object.values(stats.inventory.resources).reduce((a,b) => a+b, 0);

    return (
        <div className="relative w-full h-full crt select-none overflow-hidden flex flex-col">
            {/* Background Game Layer */}
            <div className="absolute inset-0 z-0">
                <Engine 
                    onStatsUpdate={updateStats} 
                    setInDock={setInDock}
                    gameStateRef={gameStateRef}
                />
            </div>

            {/* HUD Overlay */}
            {!inDock && (
                <div className="absolute inset-0 pointer-events-none p-4 z-10 flex flex-col">
                    {/* Top Bar: Stats */}
                    <div className="flex flex-wrap justify-between items-start gap-4 flex-shrink-0">
                        {/* Top Left: Hull & Shield */}
                        <div className="bg-black/80 border border-lime-900 p-3 rounded text-lime-400 min-w-[200px] backdrop-blur-sm shadow-lg shadow-black/50">
                            <div className="flex items-center gap-2 mb-2">
                                <HeartIcon className="w-4 h-4" />
                                <span className="font-bold text-sm">HULL INTEGRITY</span>
                            </div>
                            <div className="w-full bg-lime-900/30 h-3 border border-lime-800">
                                <div 
                                    className="bg-lime-500 h-full transition-all duration-300" 
                                    style={{ width: `${(stats.player.currentHull / stats.player.maxHull) * 100}%` }}
                                ></div>
                            </div>
                            <div className="text-right text-xs mt-1">{Math.floor(stats.player.currentHull)} / {Math.floor(stats.player.maxHull)}</div>
                        </div>

                        {/* Top Right: Credits & Cargo */}
                        <div className="bg-black/80 border border-lime-900 p-3 rounded text-lime-400 backdrop-blur-sm text-right min-w-[150px] shadow-lg shadow-black/50">
                            <div className="text-xl font-bold tracking-widest mb-1">{stats.inventory.credits.toLocaleString()} CR</div>
                            <div className="flex items-center justify-end gap-2 text-xs text-lime-300">
                                <CubeIcon className="w-3 h-3" />
                                <span>CARGO: {totalCargo} / {Math.floor(stats.player.cargoSize)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Middle Spacer */}
                    <div className="flex-grow relative flex flex-col justify-end items-center pointer-events-none">
                         {/* Bottom Center: Message Log */}
                        {message && (
                            <div className="mb-8 w-full max-w-lg text-center bg-black/90 border border-lime-500 px-4 py-2 text-lime-400 font-bold animate-pulse text-sm md:text-base shadow-lg shadow-black/50">
                                {`> ${message}`}
                            </div>
                        )}
                    </div>

                    {/* Bottom Row: Controls */}
                    <div className="flex-shrink-0 flex justify-between items-end">
                        <div className="bg-black/60 p-2 rounded text-lime-800 text-[10px] md:text-xs backdrop-blur-sm border border-lime-900/30">
                            WASD: Thrust | CLICK: Laser | E: Dock
                        </div>
                    </div>
                </div>
            )}

            {/* Docking Menu Overlay */}
            {inDock && (
                <div className="absolute inset-0 z-20 bg-black/90 flex items-center justify-center p-4 md:p-8 backdrop-blur-sm">
                    <div className="w-full max-w-4xl h-full max-h-[90vh] border-2 border-lime-600 bg-black p-4 md:p-8 flex flex-col shadow-[0_0_50px_rgba(163,230,53,0.1)]">
                        <header className="border-b border-lime-800 pb-4 mb-4 md:mb-6 flex justify-between items-end flex-wrap gap-4">
                            <div>
                                <h1 className="text-2xl md:text-4xl text-cyan-400 font-bold tracking-tighter mb-1">HUB-01 TERMINAL</h1>
                                <p className="text-lime-600 text-xs md:text-sm">STATION STATUS: OPERATIONAL</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl md:text-3xl text-yellow-400 font-mono">{stats.inventory.credits.toLocaleString()} CR</h2>
                                <button 
                                    onClick={handleUndock}
                                    className="mt-2 md:mt-4 px-4 py-1 md:px-6 md:py-2 bg-lime-900 hover:bg-lime-700 text-lime-100 font-bold uppercase tracking-widest transition-colors border border-lime-500 text-sm md:text-base"
                                >
                                    UNDOCK SYSTEM
                                </button>
                            </div>
                        </header>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 overflow-hidden">
                            {/* Left: Inventory & Selling */}
                            <div className="border border-lime-900 p-3 md:p-4 overflow-y-auto">
                                <h3 className="text-lg md:text-xl text-lime-400 mb-4 flex items-center gap-2">
                                    <CubeIcon className="w-5 h-5" /> CARGO MANIFEST
                                </h3>
                                
                                <div className="space-y-2">
                                    {Object.entries(stats.inventory.resources).map(([key, amount]) => {
                                        const type = key as ResourceType;
                                        if (amount === 0) return null;
                                        return (
                                            <div key={key} className="flex justify-between items-center p-2 bg-lime-900/10 border border-lime-900/30 text-sm md:text-base">
                                                <span style={{ color: RESOURCES[type].color }} className="font-bold">{RESOURCES[type].name}</span>
                                                <span className="text-lime-500">x{amount}</span>
                                            </div>
                                        );
                                    })}
                                    {totalCargo === 0 && <div className="text-lime-800 italic p-4 text-center text-sm">Cargo Hold Empty</div>}
                                </div>

                                <button 
                                    onClick={handleSell}
                                    disabled={totalCargo === 0}
                                    className={`w-full mt-6 py-2 md:py-3 font-bold border text-sm md:text-base ${totalCargo > 0 ? 'border-yellow-600 text-yellow-400 hover:bg-yellow-900/20' : 'border-gray-800 text-gray-700 cursor-not-allowed'}`}
                                >
                                    SELL ALL RESOURCES
                                </button>
                            </div>

                            {/* Right: Upgrades */}
                            <div className="border border-lime-900 p-3 md:p-4 overflow-y-auto">
                                <h3 className="text-lg md:text-xl text-lime-400 mb-4 flex items-center gap-2">
                                    <ZapIcon className="w-5 h-5" /> ENGINEERING BAY
                                </h3>
                                
                                <div className="space-y-3 md:space-y-4">
                                    {Object.entries(UPGRADE_DEFS).map(([id, def]) => {
                                        const currentLvl = stats.upgrades[id];
                                        const cost = calculateUpgradeCost(id, currentLvl);
                                        const canAfford = stats.inventory.credits >= cost;

                                        return (
                                            <div key={id} className="p-3 md:p-4 border border-lime-800 bg-lime-950/30 hover:bg-lime-900/20 transition-colors">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-bold text-lime-300 text-sm md:text-base">{def.name} <span className="text-[10px] md:text-xs text-lime-600">LVL {currentLvl}</span></span>
                                                    <span className="text-yellow-500 font-mono text-sm md:text-base">{cost.toLocaleString()} CR</span>
                                                </div>
                                                <p className="text-[10px] md:text-xs text-lime-600 mb-2 md:mb-3">{def.description}</p>
                                                <button 
                                                    onClick={() => handleUpgrade(id)}
                                                    disabled={!canAfford}
                                                    className={`w-full py-1 text-xs md:text-sm font-bold uppercase tracking-wide ${canAfford ? 'bg-cyan-900/50 text-cyan-300 hover:bg-cyan-800 border-cyan-700' : 'bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed'} border`}
                                                >
                                                    {canAfford ? 'INSTALL UPGRADE' : 'INSUFFICIENT FUNDS'}
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;