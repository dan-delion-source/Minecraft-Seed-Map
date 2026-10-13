"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import WorldMap from "@/components/WorldMap";
import FeaturePanel from "@/components/FeaturePanel";
import { STRUCTURE_INFO, SUPPORTED_FEATURES } from "@/lib/biomes";

export default function Home() {
    const [seedInput, setSeedInput] = useState("12345");
    const [seed, setSeed] = useState(12345n);
    const [version, setVersion] = useState("120");
    const [dimension, setDimension] = useState("overworld");
    const [error, setError] = useState("");
    const [structureToggles, setStructureToggles] = useState<Record<string, boolean>>({ biomes: true, spawn: true, village: true });
    useEffect(() => {
        const query = new URLSearchParams(location.search);
        try { const value = query.get("seed"); if (value && /^-?\d+$/.test(value) && BigInt(value) >= -(1n << 63n) && BigInt(value) < (1n << 63n)) { setSeed(BigInt(value)); setSeedInput(value); } } catch { /* Keep the default for invalid shared seeds. */ }
        const v = query.get("v"), d = query.get("dimension");
        if (v && ["118", "119", "120", "121"].includes(v)) setVersion(v);
        if (d && ["overworld", "nether", "end"].includes(d)) setDimension(d);
    }, []);
    function generate() {
        try {
            if (!/^-?\d+$/.test(seedInput.trim())) throw new Error();
            const value = BigInt(seedInput.trim());
            if (value < -(1n << 63n) || value >= (1n << 63n)) throw new Error();
            setSeed(value); setError("");
        } catch { setError("Enter a whole number between −9223372036854775808 and 9223372036854775807."); }
    }
    function randomize() {
        const values = crypto.getRandomValues(new Uint32Array(2));
        const value = BigInt.asIntN(64, (BigInt(values[0]) << 32n) | BigInt(values[1]));
        setSeed(value); setSeedInput(String(value)); setError("");
    }
    function setAll(enabled: boolean) {
        setStructureToggles(previous => ({ ...previous, ...Object.fromEntries(Object.entries(STRUCTURE_INFO).filter(([id, info]) => SUPPORTED_FEATURES.has(id) && info.dimensions.includes(dimension)).map(([id]) => [id, enabled])) }));
    }
    return <main className="explorer">
        <header className="app-header"><Link className="brand" href="/" aria-label="Cubiomes Explorer home"><img src="/icons/biome.png" width="36" height="36" alt="" /><span>Cubiomes <strong>Explorer</strong></span></Link><span className="edition">Minecraft Java · 1.{version.slice(1)}</span></header>
        <section className="workspace" aria-label="Seed explorer">
            <div className="workspace-heading"><div><h1>Find your next adventure.</h1><p>Explore biomes, find structures, and plan where to go next.</p></div></div>
            <form className="world-toolbar" onSubmit={e => { e.preventDefault(); generate(); }}>
                <div className="seed-field"><label htmlFor="seed">World seed</label><input id="seed" value={seedInput} onChange={e => setSeedInput(e.target.value)} spellCheck={false} aria-invalid={!!error} aria-describedby={error ? "seed-error" : undefined} /></div>
                <button type="button" className="secondary-button" onClick={randomize} aria-label="Generate a random seed" title="Generate a random seed"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 3-2 4-4m4-4c1-2 2-4 4-4h3m-4-4 4 4-4 4" /></svg></button>
                <button className="primary-button" type="submit">Explore seed <span aria-hidden="true">→</span></button>
                <div className="select-field"><label htmlFor="version">Version</label><select id="version" value={version} onChange={e => setVersion(e.target.value)}>{["118", "119", "120", "121"].map(v => <option key={v} value={v}>Java 1.{v.slice(1)}</option>)}</select></div>
                <div className="select-field"><label htmlFor="dimension">Dimension</label><select id="dimension" value={dimension} onChange={e => setDimension(e.target.value)}><option value="overworld">Overworld</option><option value="nether">Nether</option><option value="end">The End</option></select></div>
            </form>
            {error && <p className="input-error" id="seed-error" role="alert">{error}</p>}
            <FeaturePanel structureToggles={structureToggles} toggleStructure={id => setStructureToggles(p => ({ ...p, [id]: !p[id] }))} onSelectAll={() => setAll(true)} onDeselectAll={() => setAll(false)} dimension={dimension} />
            <div className="map-frame"><WorldMap seed={seed} version={version} dimension={dimension} structureToggles={structureToggles} /></div>
            <div className="map-caption"><span>Drag to explore · Scroll or pinch to zoom · Select a marker for details</span><span>Seed <code>{seed.toString()}</code></span></div>
        </section>
        <footer className="app-footer"><span>Powered by Cubiomes</span><span>Arrow keys to pan · + / − to zoom · Home to reset</span></footer>
    </main>;
}
