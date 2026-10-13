"use client";

import { memo, useEffect, useRef, useState } from "react";
import { getBiomeColor, getBiomeName, hexToRgb, STRUCTURE_INFO } from "@/lib/biomes";

type Structure = { type: string; x: number; z: number };
type Tile = { canvas: HTMLCanvasElement; biomes: number[] };
type View = { x: number; z: number; zoom: number };
const RES = 128;
const palette = new Map<number, [number, number, number]>();
const clampZoom = (zoom: number) => Math.max(0.01, Math.min(2, zoom));

export default memo(function WorldMap({ seed, version, dimension, structureToggles }: {
    seed: bigint; version: string; dimension: string; structureToggles: Record<string, boolean>;
}) {
    const container = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const cache = useRef(new Map<string, Tile>());
    const icons = useRef(new Map<string, HTMLImageElement>());
    const [view, setView] = useState<View>({ x: 0, z: 0, zoom: 0.25 });
    const [size, setSize] = useState({ width: 800, height: 500 });
    const [revision, redraw] = useState(0);
    const [pending, setPending] = useState(0);
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);
    const [structures, setStructures] = useState<Structure[]>([]);
    const [loadingStructures, setLoadingStructures] = useState(false);
    const [selected, select] = useState<Structure | null>(null);
    const [hover, setHover] = useState<{ x: number; z: number; biome: string } | null>(null);
    const [completed, setCompleted] = useState<Record<string, boolean>>({});
    const [notice, setNotice] = useState("");
    const pointers = useRef(new Map<number, { x: number; y: number }>());
    const dragged = useRef(false);
    const world = `${seed}:${version}:${dimension}`;
    const storageKey = `minecraft_completed_structures:${world}`;
    // Coarser samples keep the tile count bounded even at the widest zoom.
    const scale = view.zoom >= 0.125 ? 4 : view.zoom >= 0.03125 ? 16 : 64;
    const tileBlocks = RES * scale;
    const minX = Math.floor((view.x - size.width / 2 / view.zoom) / tileBlocks);
    const maxX = Math.floor((view.x + size.width / 2 / view.zoom) / tileBlocks);
    const minZ = Math.floor((view.z - size.height / 2 / view.zoom) / tileBlocks);
    const maxZ = Math.floor((view.z + size.height / 2 / view.zoom) / tileBlocks);
    const biomesEnabled = structureToggles.biomes !== false;

    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => setSize({ width: Math.round(entry.contentRect.width), height: Math.round(entry.contentRect.height) }));
        if (container.current) observer.observe(container.current);
        const images = icons.current;
        Object.entries(STRUCTURE_INFO).forEach(([key, info]) => {
            const img = new Image();
            img.onload = () => redraw(n => n + 1);
            img.src = info.icon;
            images.set(key, img);
        });
        return () => { observer.disconnect(); images.forEach(img => { img.onload = null; }); };
    }, []);

    useEffect(() => {
        cache.current.clear();
        select(null);
        setHover(null);
        setError("");
        const query = new URLSearchParams(window.location.search);
        const sharedWorld = query.get("seed") === String(seed) && (query.get("v") || "120") === version && (query.get("dimension") || "overworld") === dimension;
        const x = sharedWorld ? Number(query.get("x")) : 0, z = sharedWorld ? Number(query.get("z")) : 0;
        setView({ x: Number.isFinite(x) ? x : 0, z: Number.isFinite(z) ? z : 0, zoom: 0.25 });
        try { const saved = JSON.parse(localStorage.getItem(storageKey) || "{}"); setCompleted(saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {}); } catch { setCompleted({}); }
    }, [world, storageKey, seed, version, dimension]);

    // A cancellable, bounded queue; stale worlds can never populate the current cache.
    useEffect(() => {
        const controller = new AbortController();
        if (!biomesEnabled) { setPending(0); return () => controller.abort(); }
        const jobs: { x: number; z: number; key: string }[] = [];
        for (let x = minX; x <= maxX; x++) for (let z = minZ; z <= maxZ; z++) {
            const key = `${scale}:${x}:${z}`;
            if (!cache.current.has(key)) jobs.push({ x, z, key });
        }
        jobs.sort((a, b) => Math.hypot(a.x - (minX + maxX) / 2, a.z - (minZ + maxZ) / 2) - Math.hypot(b.x - (minX + maxX) / 2, b.z - (minZ + maxZ) / 2));
        let remaining = jobs.length;
        setPending(remaining);
        async function worker() {
            while (jobs.length && !controller.signal.aborted) {
                const job = jobs.shift()!;
                try {
                    const response = await fetch(`/api/generate/biomes?seed=${seed}&version=${version}&dimension=${dimension}&x=${job.x * RES}&z=${job.z * RES}&sx=${RES}&sz=${RES}&scale=${scale}`, { signal: controller.signal });
                    if (!response.ok) throw new Error("generation failed");
                    const { biomes } = await response.json();
                    if (!Array.isArray(biomes) || biomes.length !== RES * RES) throw new Error("invalid tile");
                    if (controller.signal.aborted) return;
                    const tile = document.createElement("canvas"); tile.width = RES; tile.height = RES;
                    const ctx = tile.getContext("2d")!;
                    const pixels = ctx.createImageData(RES, RES);
                    biomes.forEach((id: number, i: number) => {
                        if (!palette.has(id)) palette.set(id, hexToRgb(getBiomeColor(id)));
                        pixels.data.set([...palette.get(id)!, 255], i * 4);
                    });
                    ctx.putImageData(pixels, 0, 0);
                    cache.current.set(job.key, { canvas: tile, biomes });
                    while (cache.current.size > 512) cache.current.delete(cache.current.keys().next().value!);
                    redraw(n => n + 1);
                } catch {
                    if (!controller.signal.aborted) setError("Some map tiles could not load. Try again.");
                } finally {
                    if (!controller.signal.aborted) setPending(--remaining);
                }
            }
        }
        for (let i = 0; i < 4; i++) void worker();
        return () => controller.abort();
    }, [seed, version, dimension, minX, maxX, minZ, maxZ, scale, retry, biomesEnabled]);

    // Fetch the visible region after movement settles instead of scanning a fixed 20,000² area.
    const regionX = Math.floor((view.x - size.width / 2 / view.zoom) / 1024) * 1024;
    const regionZ = Math.floor((view.z - size.height / 2 / view.zoom) / 1024) * 1024;
    const regionWidth = Math.ceil(size.width / view.zoom / 1024) * 1024 + 1024;
    const regionHeight = Math.ceil(size.height / view.zoom / 1024) * 1024 + 1024;
    const anyStructures = Object.entries(structureToggles).some(([key, on]) => key !== "biomes" && on && STRUCTURE_INFO[key]?.dimensions.includes(dimension));
    const tooWide = regionWidth > 20000 || regionHeight > 20000 || regionWidth * regionHeight > 400000000;
    useEffect(() => {
        const controller = new AbortController();
        setStructures([]);
        if (!anyStructures || tooWide) { setLoadingStructures(false); return; }
        setLoadingStructures(true);
        const timer = setTimeout(async () => {
            try {
                const response = await fetch(`/api/generate/structures?seed=${seed}&version=${version}&dimension=${dimension}&x=${regionX}&z=${regionZ}&sx=${regionWidth}&sz=${regionHeight}`, { signal: controller.signal });
                if (!response.ok) throw new Error("generation failed");
                const data = await response.json();
                if (!controller.signal.aborted) setStructures(data.structures);
            } catch {
                if (!controller.signal.aborted) setError("Structures could not load. Try again.");
            } finally { if (!controller.signal.aborted) setLoadingStructures(false); }
        }, 250);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [seed, version, dimension, regionX, regionZ, regionWidth, regionHeight, anyStructures, tooWide, retry]);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
            ctx.clearRect(0, 0, size.width, size.height);
            ctx.imageSmoothingEnabled = false;
            if (biomesEnabled) for (let x = minX; x <= maxX; x++) for (let z = minZ; z <= maxZ; z++) {
                const tile = cache.current.get(`${scale}:${x}:${z}`);
                if (tile) ctx.drawImage(tile.canvas, Math.floor(size.width / 2 + (x * tileBlocks - view.x) * view.zoom), Math.floor(size.height / 2 + (z * tileBlocks - view.z) * view.zoom), Math.ceil(tileBlocks * view.zoom) + 1, Math.ceil(tileBlocks * view.zoom) + 1);
            }
            for (const s of structures) {
                if (!structureToggles[s.type]) continue;
                const info = STRUCTURE_INFO[s.type]; if (!info) continue;
                const x = size.width / 2 + (s.x - view.x) * view.zoom, y = size.height / 2 + (s.z - view.z) * view.zoom;
                if (x < -20 || y < -20 || x > size.width + 20 || y > size.height + 20) continue;
                ctx.beginPath(); ctx.arc(x, y, selected === s ? 14 : 10, 0, Math.PI * 2);
                ctx.fillStyle = info.color; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = selected === s ? 3 : 1.5; ctx.stroke();
                const img = icons.current.get(s.type);
                if (img?.complete && img.naturalWidth) ctx.drawImage(img, x - 9, y - 9, 18, 18);
            }
        });
        return () => cancelAnimationFrame(frame);
    }, [view, size, revision, structures, structureToggles, selected, minX, maxX, minZ, maxZ, scale, tileBlocks, biomesEnabled]);

    useEffect(() => {
        const target = canvas.current; if (!target) return;
        const wheel = (event: WheelEvent) => {
            event.preventDefault();
            const rect = target.getBoundingClientRect();
            const dx = event.clientX - rect.left - rect.width / 2, dz = event.clientY - rect.top - rect.height / 2;
            setView(v => { const zoom = clampZoom(v.zoom * Math.exp(-event.deltaY * 0.001)); return { zoom, x: v.x + dx / v.zoom - dx / zoom, z: v.z + dz / v.zoom - dz / zoom }; });
        };
        target.addEventListener("wheel", wheel, { passive: false });
        return () => target.removeEventListener("wheel", wheel);
    }, []);

    async function copy(value: string) {
        try { await navigator.clipboard.writeText(value); setNotice("Copied to clipboard."); }
        catch { setNotice("Clipboard unavailable. Select and copy the coordinates below."); }
    }
    const selectedKey = selected ? `${selected.type}_${selected.x}_${selected.z}` : "";
    return <div ref={container} className="map-surface">
        <canvas ref={canvas} width={size.width} height={size.height} tabIndex={0} aria-label="Seed map. Arrow keys pan; plus and minus zoom; Home resets."
            onKeyDown={e => {
                if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "Home", "Escape"].includes(e.key)) return;
                e.preventDefault();
                if (e.key === "Escape") { select(null); return; }
                setView(v => e.key === "Home" ? { x: 0, z: 0, zoom: 0.25 } : { x: v.x + (e.key === "ArrowRight" ? 80 / v.zoom : e.key === "ArrowLeft" ? -80 / v.zoom : 0), z: v.z + (e.key === "ArrowDown" ? 80 / v.zoom : e.key === "ArrowUp" ? -80 / v.zoom : 0), zoom: clampZoom(v.zoom * (["+", "="].includes(e.key) ? 1.5 : e.key === "-" ? 1 / 1.5 : 1)) });
            }}
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragged.current = false; }}
            onPointerMove={e => {
                const previous = pointers.current.get(e.pointerId);
                if (previous) {
                    const others = [...pointers.current.entries()].filter(([id]) => id !== e.pointerId);
                    const dx = e.clientX - previous.x, dy = e.clientY - previous.y;
                    if (Math.abs(dx) + Math.abs(dy) > 2) dragged.current = true;
                    const other = others[0]?.[1];
                    const ratio = other ? Math.hypot(e.clientX - other.x, e.clientY - other.y) / Math.max(1, Math.hypot(previous.x - other.x, previous.y - other.y)) : 1;
                    setView(v => ({ x: v.x - dx / v.zoom / (other ? 2 : 1), z: v.z - dy / v.zoom / (other ? 2 : 1), zoom: clampZoom(v.zoom * ratio) }));
                    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
                }
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.floor(view.x + (e.clientX - rect.left - size.width / 2) / view.zoom), z = Math.floor(view.z + (e.clientY - rect.top - size.height / 2) / view.zoom);
                const tx = Math.floor(x / tileBlocks), tz = Math.floor(z / tileBlocks);
                const tile = cache.current.get(`${scale}:${tx}:${tz}`);
                const id = tile?.biomes[Math.floor((z - tz * tileBlocks) / scale) * RES + Math.floor((x - tx * tileBlocks) / scale)];
                setHover({ x, z, biome: !biomesEnabled ? "Biomes hidden" : id === undefined ? "Loading…" : getBiomeName(id) });
            }}
            onPointerUp={e => {
                if (!dragged.current && pointers.current.size === 1) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    select([...structures].reverse().find(s => structureToggles[s.type] && Math.hypot(size.width / 2 + (s.x - view.x) * view.zoom - e.clientX + rect.left, size.height / 2 + (s.z - view.z) * view.zoom - e.clientY + rect.top) < 18) || null);
                    setNotice("");
                }
                pointers.current.delete(e.pointerId);
            }}
            onPointerCancel={e => pointers.current.delete(e.pointerId)} onLostPointerCapture={e => pointers.current.delete(e.pointerId)} onPointerLeave={() => setHover(null)} />
        <div className="map-status" role="status">{pending || loadingStructures ? `Loading ${pending ? `${pending} map tiles` : "structures"}…` : tooWide && anyStructures ? "Zoom in to see structures" : "Map ready"}</div>
        {error && <div className="map-error" role="alert">{error} <button onClick={() => { setError(""); setRetry(n => n + 1); }}>Retry</button></div>}
        <div className="map-coordinates">{hover ? <><span>{hover.biome}</span><code>X {hover.x.toLocaleString()} · Z {hover.z.toLocaleString()}</code></> : <><span>{dimension === "end" ? "The End" : dimension === "nether" ? "Nether" : "Overworld"}</span><code>X {Math.round(view.x).toLocaleString()} · Z {Math.round(view.z).toLocaleString()}</code></>}</div>
        {selected && structureToggles[selected.type] && <section className="structure-detail" aria-label="Selected structure">
            <div className="panel-heading"><strong>{STRUCTURE_INFO[selected.type]?.name}</strong><button aria-label="Close structure details" onClick={() => select(null)}>×</button></div>
            <code>X {selected.x} · Z {selected.z}</code>
            <div className="detail-actions"><button onClick={() => copy(`${selected.x} ${selected.z}`)}>Copy coordinates</button><button onClick={() => copy(`${location.origin}${location.pathname}?seed=${seed}&v=${version}&dimension=${dimension}&x=${selected.x}&z=${selected.z}`)}>Copy link</button></div>
            <label><input type="checkbox" checked={!!completed[selectedKey]} onChange={() => { const next = { ...completed, [selectedKey]: !completed[selectedKey] }; setCompleted(next); try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { setNotice("Progress could not be saved on this device."); } }} /> Mark as explored</label>
            <p role="status">{notice}</p>
        </section>}
        <div className="map-controls"><button aria-label="Zoom out" onClick={() => setView(v => ({ ...v, zoom: clampZoom(v.zoom / 1.5) }))}>−</button><button onClick={() => setView({ x: 0, z: 0, zoom: 0.25 })}>Reset view</button><button aria-label="Zoom in" onClick={() => setView(v => ({ ...v, zoom: clampZoom(v.zoom * 1.5) }))}>+</button></div>
    </div>;
});
