
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
    const [tileCache] = useState<Map<string, Tile>>(new Map());
    const [structures, setStructures] = useState<Structure[]>([]);

    const [mousePos, setMousePos] = useState({ x: 0, z: 0 });
    const [currentBiome, setCurrentBiome] = useState<string>("Unknown");
    const [showHoverInfo, setShowHoverInfo] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 800, height: 450 });

    // Reset cache on seed, version, or dimension change
    useEffect(() => {
        tileCache.clear();
        setStructures([]);
        fetchStructures();
    }, [seed, version, dimension]);

    // Handle resize
    useEffect(() => {
        if (!containerRef.current) return;
        const updateSize = () => {
            setDimensions({
                width: containerRef.current!.clientWidth,
                height: containerRef.current!.clientHeight
            });
        };
        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

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
                    } else if (tile.loaded) {
                        // Draw tile with transform
                        const drawX = centerX + (tx * TILE_SIZE_BLOCKS - viewport.x) * viewport.zoom;
                        const drawZ = centerY + (tz * TILE_SIZE_BLOCKS - viewport.z) * viewport.zoom;
                        const drawSize = TILE_SIZE_BLOCKS * viewport.zoom;

                        ctx.drawImage(tile.canvas, drawX, drawZ, drawSize, drawSize);
                    }
                }
            }

            // 2. Draw Structure Markers
            structures.forEach(s => {
                if (!structureToggles[s.type]) return;

                const info = STRUCTURE_INFO[s.type];
                if (!info) return;

                // Clip to viewport
                if (s.x < visibleLeft || s.x > visibleRight || s.z < visibleTop || s.z > visibleBottom) return;

                const drawX = centerX + (s.x - viewport.x) * viewport.zoom;
                const drawZ = centerY + (s.z - viewport.z) * viewport.zoom;

                // Draw pin/icon
                ctx.fillStyle = info.color;

                const size = Math.max(6, 12 * Math.min(1, viewport.zoom * 2));

                ctx.beginPath();
                ctx.arc(drawX, drawZ, size, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "white";
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Icon text (only if zoomed in enough)
                if (viewport.zoom > 0.05) {
                    ctx.font = `${size}px sans-serif`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(info.icon, drawX, drawZ);
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [viewport, tileCache, structures, structureToggles, dimensions, fetchTile]);

    // Input Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localZ = e.clientY - rect.top;

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
        setShowHoverInfo(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        const zoomSpeed = 0.001;
        const delta = -e.deltaY;
        const zoomFactor = Math.pow(1.1, delta / 100);

        setViewport(v => ({
            ...v,
            zoom: Math.max(0.01, Math.min(2, v.zoom * zoomFactor))
        }));
    };

    const resetView = () => setViewport({ x: 0, z: 0, zoom: 0.25 });

    return (
        <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
            <canvas
                ref={canvasRef}
                width={dimensions.width}
                height={dimensions.height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onWheel={handleWheel}
                className="w-full h-full cursor-grab active:cursor-grabbing"
                style={{ imageRendering: "pixelated" }}
            />

            {/* Hover Info Panel - Bottom Left */}
            <div className={`absolute bottom-4 left-4 p-3 bg-zinc-900/90 backdrop-blur-md rounded-lg border border-white/10 text-xs font-mono space-y-1.5 select-none transition-opacity duration-200 ${showHoverInfo ? "opacity-100" : "opacity-0"
                }`}>
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
                <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold">Dim:</span>
                    <span className="text-zinc-100 capitalize">{dimension}</span>
                </div>
            </div>

            {/* Control Bar - Bottom Center */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-zinc-900/90 backdrop-blur-xl rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                    onClick={() => setViewport(v => ({ ...v, zoom: Math.min(2, v.zoom * 1.5) }))}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
                >
                    ➕
                </button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button
                    onClick={resetView}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                >
                    Reset View
                </button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button
                    onClick={() => setViewport(v => ({ ...v, zoom: Math.max(0.01, v.zoom / 1.5) }))}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
                >
                    ➖
                </button>
            </div>
        </div>
    );
}
