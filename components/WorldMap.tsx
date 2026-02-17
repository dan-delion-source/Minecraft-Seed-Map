
"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { getBiomeColor, getBiomeName, hexToRgb, STRUCTURE_INFO } from "@/lib/biomes";

interface WorldMapProps {
    seed: bigint;
    version: string;
    dimension: string;
    structureToggles: Record<string, boolean>;
}

interface Viewport {
    x: number; // World X
    z: number; // World Z
    zoom: number; // Level of zoom (1 = 1:1 scale)
}

interface Tile {
    canvas: HTMLCanvasElement;
    loaded: boolean;
    biomes?: number[]; // Store biome data for hover lookups
}

interface Structure {
    type: string;
    x: number;
    z: number;
}

// Configuration
const TILE_SIZE_BLOCKS = 512;
const BIOME_FETCH_SCALE = 4; // Fetch 1:4 biome data
const TILE_RES = TILE_SIZE_BLOCKS / BIOME_FETCH_SCALE; // 128x128 pixels per tile

export default function WorldMap({ seed, version, dimension, structureToggles }: WorldMapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // State
    const [viewport, setViewport] = useState<Viewport>({ x: 0, z: 0, zoom: 0.25 });
    const viewRef = useRef(viewport); // Track previous viewport to distinguish movement vs selection
    const [tileCache] = useState<Map<string, Tile>>(new Map());
    const [structures, setStructures] = useState<Structure[]>([]);

    const [mousePos, setMousePos] = useState({ x: 0, z: 0 });
    const [currentBiome, setCurrentBiome] = useState<string>("Unknown");
    const [showHoverInfo, setShowHoverInfo] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 800, height: 450 });

    const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);
    const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });
    const [completedStructures, setCompletedStructures] = useState<Record<string, boolean>>({});

    // Load completed structures from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("minecraft_completed_structures");
        if (saved) {
            try {
                setCompletedStructures(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse completed structures", e);
            }
        }
    }, []);

    const toggleCompleted = (s: Structure) => {
        const key = `${s.type}_${s.x}_${s.z}`;
        const next = { ...completedStructures, [key]: !completedStructures[key] };
        setCompletedStructures(next);
        localStorage.setItem("minecraft_completed_structures", JSON.stringify(next));
    };

    const isCompleted = (s: Structure) => {
        return !!completedStructures[`${s.type}_${s.x}_${s.z}`];
    };

    const fetchStructures = useCallback(async () => {
        try {
            // Fetch structures for a large initial area (e.g., +/- 10000)
            const res = await fetch(`/api/generate/structures?seed=${seed}&version=${version}&dimension=${dimension}&x=-10000&z=-10000&sx=20000&sz=20000`);
            const data = await res.json();
            if (data.structures) {
                setStructures(data.structures);
            }
        } catch (e) {
            console.error("Failed to fetch structures", e);
        }
    }, [seed, version, dimension]);

    // Reset cache on seed, version, or dimension change
    useEffect(() => {
        tileCache.clear();
        setStructures([]);
        setSelectedStructure(null);
        setViewport({ x: 0, z: 0, zoom: 0.25 }); // Reset view to spawn/center
        fetchStructures();
    }, [seed, version, dimension, fetchStructures, tileCache]);

    // Handle resize with ResizeObserver
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const fetchTile = useCallback(async (tx: number, tz: number) => {
        const key = `${tx},${tz}`;
        if (tileCache.has(key)) return;

        // Create a placeholder tile
        const tileCanvas = document.createElement("canvas");
        tileCanvas.width = TILE_RES;
        tileCanvas.height = TILE_RES;
        tileCache.set(key, { canvas: tileCanvas, loaded: false });

        // Fetch biomes
        const x0 = tx * TILE_SIZE_BLOCKS;
        const z0 = tz * TILE_SIZE_BLOCKS;

        try {
            const response = await fetch(
                `/api/generate/biomes?seed=${seed}&version=${version}&dimension=${dimension}&x=${x0 / BIOME_FETCH_SCALE}&z=${z0 / BIOME_FETCH_SCALE}&sx=${TILE_RES}&sz=${TILE_RES}&scale=${BIOME_FETCH_SCALE}`
            );
            const data = await response.json();
            const biomes = data.biomes;

            const ctx = tileCanvas.getContext("2d");
            if (!ctx || !biomes) return;

            const imageData = ctx.createImageData(TILE_RES, TILE_RES);
            const pixels = imageData.data;

            for (let i = 0; i < biomes.length; i++) {
                const color = hexToRgb(getBiomeColor(biomes[i]));
                const idx = i * 4;
                pixels[idx] = color[0];
                pixels[idx + 1] = color[1];
                pixels[idx + 2] = color[2];
                pixels[idx + 3] = 255;
            }
            ctx.putImageData(imageData, 0, 0);
            const tile = tileCache.get(key);
            if (tile) {
                tile.loaded = true;
                tile.biomes = biomes; // Cache biome data for hover lookups
            }
        } catch (err) {
            console.error(`Failed to load tile ${key}`, err);
        }
    }, [seed, version, dimension, tileCache]);

    // Render Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            const { width, height } = dimensions;
            ctx.clearRect(0, 0, width, height);

            // Coordinate Mapping
            const centerX = width / 2;
            const centerY = height / 2;

            // 1. Draw Biome Tiles
            const visibleLeft = viewport.x - (centerX / viewport.zoom);
            const visibleRight = viewport.x + (centerX / viewport.zoom);
            const visibleTop = viewport.z - (centerY / viewport.zoom);
            const visibleBottom = viewport.z + (centerY / viewport.zoom);

            const minTx = Math.floor(visibleLeft / TILE_SIZE_BLOCKS);
            const maxTx = Math.ceil(visibleRight / TILE_SIZE_BLOCKS);
            const minTz = Math.floor(visibleTop / TILE_SIZE_BLOCKS);
            const maxTz = Math.ceil(visibleBottom / TILE_SIZE_BLOCKS);

            for (let tx = minTx; tx <= maxTx; tx++) {
                for (let tz = minTz; tz <= maxTz; tz++) {
                    const key = `${tx},${tz}`;
                    const tile = tileCache.get(key);

                    if (!tile) {
                        fetchTile(tx, tz);
                    } else if (tile.loaded && structureToggles['biomes'] !== false) {
                        // Draw tile with transform
                        const drawX = centerX + (tx * TILE_SIZE_BLOCKS - viewport.x) * viewport.zoom;
                        const drawZ = centerY + (tz * TILE_SIZE_BLOCKS - viewport.z) * viewport.zoom;
                        const drawSize = TILE_SIZE_BLOCKS * viewport.zoom;

                        ctx.drawImage(tile.canvas, drawX, drawZ, drawSize, drawSize);
                    }
                }
            }

            // 2. Draw Structure Markers
            // First pass: Draw unselected structures
            // Second pass: Draw selected structure on top
            const structuresToDraw = [...structures].sort((a, b) => {
                if (a === selectedStructure) return 1;
                if (b === selectedStructure) return -1;
                return 0;
            });

            const visibleThreshold = 100 / viewport.zoom;
            structuresToDraw.forEach(s => {
                if (!structureToggles[s.type]) return;

                const info = STRUCTURE_INFO[s.type];
                if (!info) return;

                // Clip to viewport (loosely)
                if (s.x < visibleLeft - visibleThreshold || s.x > visibleRight + visibleThreshold || s.z < visibleTop - visibleThreshold || s.z > visibleBottom + visibleThreshold) return;

                const drawX = centerX + (s.x - viewport.x) * viewport.zoom;
                const drawZ = centerY + (s.z - viewport.z) * viewport.zoom;

                const isSelected = selectedStructure === s;
                let size = Math.max(6, 12 * Math.min(1, viewport.zoom * 2));

                if (isSelected) {
                    size *= 1.5;
                    // Draw selection ring/pulse
                    ctx.beginPath();
                    ctx.arc(drawX, drawZ, size * 1.3, 0, Math.PI * 2);
                    ctx.strokeStyle = "white";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
                    ctx.fill();
                }

                // Draw pin/icon background
                ctx.beginPath();
                ctx.arc(drawX, drawZ, size, 0, Math.PI * 2);
                ctx.fillStyle = info.color;
                ctx.fill();
                ctx.strokeStyle = "white";
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Icon text (only if zoomed in enough or selected)
                if (viewport.zoom > 0.05 || isSelected) {
                    ctx.font = `${size}px sans-serif`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = "white";
                    ctx.fillText(info.icon, drawX, drawZ);
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [viewport, tileCache, structures, structureToggles, dimensions, fetchTile, selectedStructure]);

    // Auto-deselect structure 1s after interaction (pan/zoom)
    useEffect(() => {
        // Only trigger if we have a selection AND the viewport has changed (user moved map)
        if (selectedStructure && viewRef.current !== viewport) {
            // No longer auto-deselecting on movement to keep popover visible while zooming/panning
        }
        viewRef.current = viewport;
    }, [viewport, selectedStructure]);

    // Touch Handling State
    const lastTouchRef = useRef<{ x: number; y: number; dist: number } | null>(null);

    // Input Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const { width, height } = dimensions;
        const centerX = width / 2;
        const centerY = height / 2;

        // Check for structure click
        let clickedStructure: Structure | null = null;
        // Iterate in reverse to catch top-most (though they are sorted in render, raw list is fine)
        for (let i = structures.length - 1; i >= 0; i--) {
            const s = structures[i];
            if (!structureToggles[s.type]) continue;

            const drawX = centerX + (s.x - viewport.x) * viewport.zoom;
            const drawZ = centerY + (s.z - viewport.z) * viewport.zoom;
            const size = Math.max(6, 12 * Math.min(1, viewport.zoom * 2)) * 1.5; // Hitbox slightly larger

            const dx = clickX - drawX;
            const dy = clickY - drawZ;
            if (dx * dx + dy * dy <= size * size) {
                clickedStructure = s;
                break;
            }
        }

        if (clickedStructure) {
            setSelectedStructure(clickedStructure);

            // Calculate popover position
            const drawX = centerX + (clickedStructure.x - viewport.x) * viewport.zoom;
            const drawZ = centerY + (clickedStructure.z - viewport.z) * viewport.zoom;
            setPopoverPos({ x: drawX, y: drawZ });

        } else {
            setSelectedStructure(null);
            setIsDragging(true);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        updateHoverInfo(e.clientX, e.clientY);

        if (isDragging) {
            setViewport(v => ({
                ...v,
                x: v.x - e.movementX / v.zoom,
                z: v.z - e.movementY / v.zoom
            }));
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleMouseLeave = () => {
        setIsDragging(false);
        // Don't hide info immediately on mobile/touch, but for mouse it's fine
        if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
            setShowHoverInfo(false);
        }
    };

    const updateHoverInfo = (clientX: number, clientY: number) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const localX = clientX - rect.left;
        const localZ = clientY - rect.top;

        // Convert to world coords
        const worldX = viewport.x + (localX - dimensions.width / 2) / viewport.zoom;
        const worldZ = viewport.z + (localZ - dimensions.height / 2) / viewport.zoom;
        setMousePos({ x: Math.floor(worldX), z: Math.floor(worldZ) });
        setShowHoverInfo(true);

        // Get biome at cursor position from cached tile data
        const tx = Math.floor(worldX / TILE_SIZE_BLOCKS);
        const tz = Math.floor(worldZ / TILE_SIZE_BLOCKS);
        const key = `${tx},${tz}`;
        const tile = tileCache.get(key);

        if (tile?.biomes) {
            // Calculate position within tile
            const localTileX = Math.floor((worldX - tx * TILE_SIZE_BLOCKS) / BIOME_FETCH_SCALE);
            const localTileZ = Math.floor((worldZ - tz * TILE_SIZE_BLOCKS) / BIOME_FETCH_SCALE);
            const biomeIndex = localTileZ * TILE_RES + localTileX;

            if (biomeIndex >= 0 && biomeIndex < tile.biomes.length) {
                setCurrentBiome(getBiomeName(tile.biomes[biomeIndex]));
            } else {
                setCurrentBiome("Unknown");
            }
        } else {
            setCurrentBiome("Loading...");
        }
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            const t = e.touches[0];
            lastTouchRef.current = { x: t.clientX, y: t.clientY, dist: 0 };
            updateHoverInfo(t.clientX, t.clientY); // Tap to inspect
        } else if (e.touches.length === 2) {
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            lastTouchRef.current = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2, dist };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        // Prevent default only if we are interacting with the map to avoid scrolling page while panning
        if (e.cancelable) e.preventDefault();

        if (!lastTouchRef.current) return;

        if (e.touches.length === 1) {
            // Pan
            const t = e.touches[0];
            const dx = t.clientX - lastTouchRef.current.x;
            const dy = t.clientY - lastTouchRef.current.y;

            setViewport(v => ({
                ...v,
                x: v.x - dx / v.zoom,
                z: v.z - dy / v.zoom
            }));

            lastTouchRef.current = { x: t.clientX, y: t.clientY, dist: 0 };
            updateHoverInfo(t.clientX, t.clientY);

        } else if (e.touches.length === 2) {
            // Pinch Zoom & Pan
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            const cx = (t1.clientX + t2.clientX) / 2;
            const cy = (t1.clientY + t2.clientY) / 2;

            const oldDist = lastTouchRef.current.dist;

            if (oldDist > 0) {
                const zoomFactor = dist / oldDist;
                const nextZoom = Math.max(0.01, Math.min(2, viewport.zoom * zoomFactor));

                setViewport(v => ({
                    ...v,
                    zoom: nextZoom,
                    x: v.x - (cx - lastTouchRef.current!.x) / nextZoom,
                    z: v.z - (cy - lastTouchRef.current!.y) / nextZoom
                }));
            }

            lastTouchRef.current = { x: cx, y: cy, dist };
        }
    };

    const handleTouchEnd = () => {
        lastTouchRef.current = null;
    };

    const handleWheel = (e: React.WheelEvent) => {
        const delta = -e.deltaY;
        const zoomFactor = Math.pow(1.1, delta / 100);

        setViewport(v => ({
            ...v,
            zoom: Math.max(0.01, Math.min(2, v.zoom * zoomFactor))
        }));
    };

    const resetView = () => setViewport({ x: 0, z: 0, zoom: 0.25 });

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

    return (
        <div ref={containerRef} className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] group touch-none">
            <canvas
                ref={canvasRef}
                width={dimensions.width}
                height={dimensions.height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
                className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
                style={{ imageRendering: "pixelated" }}
            />

            {/* Hover Info Panel - Bottom Left (Desktop) / Top Center (Mobile) */}
            <div className={`absolute left-4 p-3 bg-zinc-900/95 backdrop-blur-xl rounded-xl border border-white/10 text-[10px] md:text-xs font-mono space-y-1 md:space-y-1.5 shadow-xl transition-all duration-200 pointer-events-none select-none z-20 
                ${isMobile ? 'top-4' : 'bottom-4'} 
                ${showHoverInfo ? "translate-y-0 opacity-100" : (isMobile ? "-translate-y-2 opacity-0" : "translate-y-2 opacity-0")}
                `}>
                <div className="flex items-center gap-2">
                    <span className="text-indigo-400 font-bold">X:</span>
                    <span className="text-zinc-100">{mousePos.x}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">Z:</span>
                    <span className="text-zinc-100">{mousePos.z}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">Biome:</span>
                    <span className="text-zinc-100">{currentBiome}</span>
                </div>
            </div>

            {/* Structure Popover */}
            {selectedStructure && (
                <div
                    className="absolute z-30 -translate-x-1/2 -translate-y-[calc(100%+12px)] pointer-events-auto transition-transform duration-75"
                    style={{
                        left: `${centerX + (selectedStructure.x - viewport.x) * viewport.zoom}px`,
                        top: `${centerY + (selectedStructure.z - viewport.z) * viewport.zoom}px`
                    }}
                >
                    <div className="bg-white text-zinc-900 rounded-lg shadow-2xl p-3 min-w-[180px] border border-zinc-200 flex flex-col gap-2 relative ring-4 ring-black/5 animate-in fade-in zoom-in duration-200">
                        {/* Little Triangle Pointer */}
                        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-zinc-200"></div>

                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{STRUCTURE_INFO[selectedStructure.type]?.icon}</span>
                                <div className="font-black text-sm uppercase tracking-tight">
                                    {STRUCTURE_INFO[selectedStructure.type]?.name}
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}${window.location.pathname}?seed=${seed}&v=${version}&x=${selectedStructure.x}&z=${selectedStructure.z}`;
                                        navigator.clipboard.writeText(url);
                                    }}
                                    className="p-1 hover:bg-zinc-100 rounded transition-colors text-indigo-600"
                                    title="Copy Link"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-[11px] font-bold font-mono">
                            <div className="flex items-center gap-3">
                                <span className="text-zinc-500">X: <span className="text-zinc-900">{selectedStructure.x.toLocaleString()}</span></span>
                                <span className="text-zinc-500">Z: <span className="text-zinc-900">{selectedStructure.z.toLocaleString()}</span></span>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${selectedStructure.x} ${selectedStructure.z}`);
                                }}
                                className="p-1 hover:bg-zinc-100 rounded transition-colors text-blue-600"
                                title="Copy Coordinates"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                            </button>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer select-none border-t border-zinc-100 pt-2 hover:opacity-80 transition-opacity">
                            <input
                                type="checkbox"
                                checked={isCompleted(selectedStructure)}
                                onChange={() => toggleCompleted(selectedStructure)}
                                className="w-3.5 h-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Completed</span>
                        </label>
                    </div>
                </div>
            )}

            {/* Control Bar - Bottom Center (Desktop) / Bottom Right (Mobile) */}
            <div className={`absolute flex items-center gap-1.5 p-1.5 bg-zinc-900/90 backdrop-blur-xl rounded-full border border-white/10 z-20 transition-all duration-300
                ${isMobile ? 'bottom-4 right-4 translate-x-0' : 'bottom-6 left-1/2 -translate-x-1/2 md:group-hover:opacity-100 md:opacity-0'}
            `}>
                <button
                    onClick={() => setViewport(v => ({ ...v, zoom: Math.min(2, v.zoom * 1.5) }))}
                    className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
                >
                    ➕
                </button>
                <div className="w-px h-4 bg-white/10"></div>
                <button
                    onClick={resetView}
                    className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                >
                    Reset
                </button>
                <div className="w-px h-4 bg-white/10"></div>
                <button
                    onClick={() => setViewport(v => ({ ...v, zoom: Math.max(0.01, v.zoom / 1.5) }))}
                    className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
                >
                    ➖
                </button>
            </div>
        </div>
    );
}
