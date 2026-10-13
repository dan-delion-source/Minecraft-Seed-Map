"use client";
import { useState } from "react";
import { STRUCTURE_INFO, SUPPORTED_FEATURES } from "@/lib/biomes";

export default function FeaturePanel({ structureToggles, toggleStructure, onSelectAll, onDeselectAll, dimension }: {
    structureToggles: Record<string, boolean>; toggleStructure: (id: string) => void; onSelectAll: () => void; onDeselectAll: () => void; dimension: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const available = Object.entries(STRUCTURE_INFO).filter(([id, info]) => SUPPORTED_FEATURES.has(id) && info.dimensions.includes(dimension));
    const active = available.filter(([id]) => structureToggles[id]).length;
    return <section className="feature-panel" aria-label="Map layers">
        <div className="panel-heading"><div><h2>Map layers</h2><span>{active} active</span></div><div className="layer-actions"><button onClick={onSelectAll}>All</button><button onClick={onDeselectAll}>None</button>{available.length > 8 && <button aria-expanded={expanded} aria-controls="layer-list" onClick={() => setExpanded(v => !v)}>{expanded ? "Show less" : `More layers (${available.length - 8})`}</button>}</div></div>
        <div className="layer-list" id="layer-list">{(expanded ? available : available.slice(0, 8)).map(([id, info]) => <button key={id} className="layer-toggle" aria-pressed={!!structureToggles[id]} onClick={() => toggleStructure(id)}><span className="layer-icon-slot" aria-hidden="true"><img src={info.icon} width="32" height="32" alt="" /></span><span>{info.name}</span><span className="layer-check" aria-hidden="true">{structureToggles[id] ? "✓" : ""}</span></button>)}</div>
    </section>;
}
