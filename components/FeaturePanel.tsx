"use client";

import { useState } from "react";
import { STRUCTURE_INFO } from "@/lib/biomes";

interface FeaturePanelProps {
    structureToggles: Record<string, boolean>;
    toggleStructure: (id: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    dimension: string;
}

export default function FeaturePanel({
    structureToggles,
    toggleStructure,
    onSelectAll,
    onDeselectAll,
    dimension
}: FeaturePanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Filter structures based on the current dimension
    const availableStructures = Object.entries(STRUCTURE_INFO).filter(([_, info]) =>
        info.dimensions.includes(dimension)
    );

    const visibleStructures = isExpanded ? availableStructures : availableStructures.slice(0, 8);

    return (
        <div className="w-full flex flex-col gap-3 bg-zinc-900/50 rounded-xl border border-white/10 p-4 transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">
                    Features ({availableStructures.length})
                </h3>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-[10px] font-bold uppercase text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                    {isExpanded ? "Show Less" : "Show More"}
                </button>
            </div>

            {/* Grid Container */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {visibleStructures.map(([id, info]) => {
                    const isActive = structureToggles[id];
                    return (
                        <button
                            key={id}
                            onClick={() => toggleStructure(id)}
                            className={`
                                group flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-200
                                hover:scale-[1.02] active:scale-95 text-left
                                ${isActive
                                    ? "bg-indigo-600/20 border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.15)]"
                                    : "bg-zinc-800/40 border-white/5 hover:bg-zinc-800/80 hover:border-white/10"
                                }
                            `}
                            title={info.name}
                        >
                            <span className="text-xl filter drop-shadow-md pb-0.5">
                                {info.icon}
                            </span>
                            <span className={`
                                text-[10px] sm:text-xs font-bold uppercase tracking-tight leading-none
                                ${isActive ? "text-indigo-200" : "text-zinc-500 group-hover:text-zinc-300"}
                            `}>
                                {info.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Footer Actions - Only show when expanded to reduce clutter */}
            {isExpanded && (
                <div className="flex gap-2 pt-2 border-t border-white/5 shrink-0 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                        onClick={onSelectAll}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-[10px] font-bold uppercase py-1.5 rounded-lg transition-colors"
                    >
                        Select All
                    </button>
                    <button
                        onClick={onDeselectAll}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-[10px] font-bold uppercase py-1.5 rounded-lg transition-colors"
                    >
                        Deselect All
                    </button>
                </div>
            )}
        </div>
    );
}
