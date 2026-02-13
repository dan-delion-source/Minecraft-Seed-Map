
"use client";

import { useState, useEffect } from "react";
import WorldMap from "@/components/WorldMap";
import { STRUCTURE_INFO } from "@/lib/biomes";

export default function Home() {
    const [seedInput, setSeedInput] = useState<string>("12345");
    const [seed, setSeed] = useState<bigint>(12345n);
    const [version, setVersion] = useState<string>("120");
    const [dimension, setDimension] = useState<string>("overworld");
    const [structureToggles, setStructureToggles] = useState<Record<string, boolean>>({
        village: true,
        stronghold: true,
        mansion: true,
        monument: true,
        outpost: true,
        desert_pyramid: true,
        jungle_temple: true,
        ancient_city: true,
        treasure: false,
        ruined_portal: true,
        fortress: true,
        bastion: true,
        end_city: true,
        trail_ruins: true
    });
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleSeedChange = () => {
        try {
            const parsedSeed = BigInt(seedInput);
            setSeed(parsedSeed);
        } catch {
            alert("Invalid seed. Please enter a 64-bit integer.");
        }
    };

    const randomizeSeed = () => {
        const randomSeed = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
        setSeedInput(randomSeed.toString());
        setSeed(randomSeed);
    };

    const toggleStructure = (type: string) => {
        setStructureToggles(prev => ({ ...prev, [type]: !prev[type] }));
    };

    if (!isClient) return null;

    return (
        <main className="flex h-[100dvh] flex-col items-center bg-[#0a0a0a] text-zinc-100 selection:bg-indigo-500/30 overflow-hidden touch-none">
            {/* Background Ambient Glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[150px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[150px] rounded-full"></div>
            </div>

            <div className="relative z-10 w-full h-full flex flex-col">
                {/* Navigation Bar */}
                <header className="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 md:px-8 md:py-4 bg-zinc-950/50 backdrop-blur-xl border-b border-white/5 shrink-0 gap-3 md:gap-0">
                    <div className="flex items-center justify-between w-full md:w-auto">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="min-w-10 w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">
                                C
                            </div>
                            <div>
                                <h1 className="text-base md:text-lg font-black tracking-tight leading-none uppercase">
                                    Cubiomes<span className="text-zinc-500 font-medium lowercase">Explorer</span>
                                </h1>
                                <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5">
                                    Precision Map Engine <span className="text-zinc-700 mx-1 hidden sm:inline">•</span> <span className="hidden sm:inline">v{version === "120" ? "1.20" : version === "119" ? "1.19" : "1.18"}</span>
                                </p>
                            </div>
                        </div>

                        {/* Mobile specific controls could go here if needed, but keeping simple for now */}
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 bg-zinc-900/50 p-1.5 rounded-xl border border-white/5 w-full md:w-auto">
                        <div className="flex items-center gap-2 pl-3 flex-1 md:flex-none">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Seed</span>
                            <input
                                type="text"
                                value={seedInput}
                                onChange={(e) => setSeedInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSeedChange()}
                                className="bg-transparent text-sm font-mono focus:outline-none w-full md:w-40 text-indigo-300 min-w-0"
                            />
                        </div>
                        <div className="flex gap-1 shrink-0">
                            <button
                                onClick={handleSeedChange}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 md:px-4 py-1.5 rounded-lg font-bold text-xs transition-all active:scale-95 whitespace-nowrap"
                            >
                                Generate
                            </button>
                            <button
                                onClick={randomizeSeed}
                                className="bg-zinc-800 hover:bg-zinc-700 text-sm p-1.5 rounded-lg transition-all active:scale-95 aspect-square flex items-center justify-center min-w-[32px]"
                                title="Randomize"
                            >
                                🎲
                            </button>
                        </div>
                    </div>
                </header>

                {/* Map Container with Controls */}
                <section className="flex-1 relative flex flex-col md:items-center md:justify-center p-2 md:p-8 overflow-hidden">
                    <div className="w-full h-full md:max-w-[95%] md:max-h-[90%] flex flex-col gap-2 md:gap-4">
                        {/* Version Selector & Structure Toggles */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 md:gap-4 shrink-0">
                            {/* Version & Dimension Dropdowns */}
                            <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-1 xl:pb-0 no-scrollbar">
                                <div className="flex items-center gap-2 md:gap-3 bg-zinc-900/80 backdrop-blur-md px-3 md:px-4 py-2 md:py-2.5 rounded-xl border border-white/10 shrink-0">
                                    <span className="text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-wider">Version</span>
                                    <select
                                        value={version}
                                        onChange={(e) => setVersion(e.target.value)}
                                        className="bg-zinc-800 text-zinc-100 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-semibold border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                    >
                                        <option value="118">1.18</option>
                                        <option value="119">1.19</option>
                                        <option value="120">1.20</option>
                                        <option value="121">1.21</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 md:gap-3 bg-zinc-900/80 backdrop-blur-md px-3 md:px-4 py-2 md:py-2.5 rounded-xl border border-white/10 shrink-0">
                                    <span className="text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-wider">Dim</span>
                                    <select
                                        value={dimension}
                                        onChange={(e) => setDimension(e.target.value)}
                                        className="bg-zinc-800 text-zinc-100 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-semibold border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                    >
                                        <option value="overworld">Overworld</option>
                                        <option value="nether">Nether</option>
                                        <option value="end">End</option>
                                    </select>
                                </div>
                            </div>

                            {/* Structure Toggle Bar */}
                            <div className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 overflow-x-auto no-scrollbar w-full xl:w-auto">
                                <span className="text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-wider mr-2 shrink-0 sticky left-0 z-10">Structures</span>
                                <div className="flex gap-2 min-w-min">
                                    {Object.entries(STRUCTURE_INFO).filter(([id, info]) =>
                                        info.dimensions.includes(dimension)
                                    ).map(([id, info]) => (
                                        <button
                                            key={id}
                                            onClick={() => toggleStructure(id)}
                                            className={`
                                                w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-lg border transition-all shrink-0
                                                ${structureToggles[id]
                                                    ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30 scale-105"
                                                    : "bg-zinc-800/60 border-zinc-700 text-zinc-500 hover:bg-zinc-700/80"}
                                            `}
                                            title={info.name}
                                        >
                                            <span className="text-xl md:text-lg">{info.icon}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Map Container */}
                        <div className="flex-1 relative bg-zinc-950/50 rounded-xl md:rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/5 overflow-hidden w-full min-h-0">
                            <WorldMap seed={seed} version={version} dimension={dimension} structureToggles={structureToggles} />
                        </div>
                    </div>
                </section>

                {/* Footer info bar */}
                <footer className="px-4 py-2 md:px-8 md:py-3 bg-zinc-950/80 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest shrink-0 safe-area-pb">
                    <div className="flex gap-4 md:gap-6">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="hidden sm:inline">ENGINE: Cubiomes v2.3.1 (Stable)</span>
                            <span className="sm:hidden">v2.3.1</span>
                        </div>
                        <div className="hidden sm:block">RENDER: Canvas 2D</div>
                    </div>
                    <div className="flex gap-4">
                        <span className="hover:text-zinc-300 cursor-help hidden sm:inline">Keyboard Shortcuts</span>
                        <span className="hover:text-zinc-300 cursor-help">Docs</span>
                    </div>
                </footer>
            </div>
        </main>
    );
}
