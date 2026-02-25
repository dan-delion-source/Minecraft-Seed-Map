
export const BIOME_COLORS: Record<number, { name: string, color: string }> = {
    // 0–50: Classic biomes
    0: { name: "Ocean", color: "#000070" },
    1: { name: "Plains", color: "#8db360" },
    2: { name: "Desert", color: "#fa9418" },
    3: { name: "Windswept Hills", color: "#606060" },
    4: { name: "Forest", color: "#056621" },
    5: { name: "Taiga", color: "#0b6659" },
    6: { name: "Swamp", color: "#07f9b2" },
    7: { name: "River", color: "#0000ff" },
    8: { name: "Nether Wastes", color: "#572526" },
    9: { name: "The End", color: "#808040" },
    10: { name: "Frozen Ocean", color: "#7070d6" },
    11: { name: "Frozen River", color: "#a0a0ff" },
    12: { name: "Snowy Plains", color: "#ffffff" },
    13: { name: "Snowy Mountains", color: "#a0a0a0" },
    14: { name: "Mushroom Fields", color: "#ff00ff" },
    15: { name: "Mushroom Field Shore", color: "#a400a4" },
    16: { name: "Beach", color: "#fade55" },
    17: { name: "Desert Hills", color: "#d25f12" },
    18: { name: "Wooded Hills", color: "#22551c" },
    19: { name: "Taiga Hills", color: "#163933" },
    20: { name: "Mountain Edge", color: "#727272" },
    21: { name: "Jungle", color: "#537b09" },
    22: { name: "Jungle Hills", color: "#2c4205" },
    23: { name: "Sparse Jungle", color: "#628b17" },
    24: { name: "Deep Ocean", color: "#000030" },
    25: { name: "Stony Shore", color: "#a2a284" },
    26: { name: "Snowy Beach", color: "#faf0c0" },
    27: { name: "Birch Forest", color: "#307444" },
    28: { name: "Old Growth Birch Forest", color: "#589c6c" },
    29: { name: "Dark Forest", color: "#40511a" },
    30: { name: "Snowy Taiga", color: "#31554a" },
    31: { name: "Snowy Taiga Hills", color: "#243a34" },
    32: { name: "Old Growth Pine Taiga", color: "#596651" },
    33: { name: "Old Growth Spruce Taiga", color: "#818e79" },
    34: { name: "Windswept Forest", color: "#507050" },
    35: { name: "Savanna", color: "#bdb25f" },
    36: { name: "Savanna Plateau", color: "#a79d64" },
    37: { name: "Badlands", color: "#d94515" },
    38: { name: "Wooded Badlands", color: "#b09765" },
    39: { name: "Badlands Plateau", color: "#ca8c65" },
    40: { name: "Small End Islands", color: "#404020" },
    41: { name: "End Midlands", color: "#808040" },
    42: { name: "End Highlands", color: "#c0c080" },
    43: { name: "End Barrens", color: "#808040" },
    44: { name: "Warm Ocean", color: "#0000a0" },
    45: { name: "Lukewarm Ocean", color: "#000090" },
    46: { name: "Cold Ocean", color: "#202070" },
    47: { name: "Deep Warm Ocean", color: "#000050" },
    48: { name: "Deep Lukewarm Ocean", color: "#000040" },
    49: { name: "Deep Cold Ocean", color: "#20203a" },
    50: { name: "Deep Frozen Ocean", color: "#404090" },
    // Mutated variants (id = base + 128)
    129: { name: "Sunflower Plains", color: "#b5d46a" },
    130: { name: "Desert Lakes", color: "#ffb347" },
    131: { name: "Gravelly Mountains", color: "#888888" },
    132: { name: "Flower Forest", color: "#2d8a2d" },
    133: { name: "Taiga Mountains", color: "#1a7a6e" },
    134: { name: "Swamp Hills", color: "#2eedc2" },
    140: { name: "Ice Spikes", color: "#b0f0f0" },
    149: { name: "Modified Jungle", color: "#3d5e09" },
    151: { name: "Modified Jungle Edge", color: "#4a6b1c" },
    155: { name: "Old Growth Birch Forest", color: "#589c6c" },
    156: { name: "Tall Birch Hills", color: "#4a8a72" },
    157: { name: "Dark Forest Hills", color: "#2a3a12" },
    158: { name: "Snowy Taiga Mountains", color: "#1a4030" },
    160: { name: "Giant Spruce Taiga", color: "#6a7a61" },
    161: { name: "Giant Spruce Taiga Hills", color: "#717e69" },
    162: { name: "Modified Gravelly Mountains", color: "#607060" },
    163: { name: "Shattered Savanna", color: "#e5c27a" },
    164: { name: "Shattered Savanna Plateau", color: "#c7ad7a" },
    165: { name: "Eroded Badlands", color: "#ff6d3a" },
    166: { name: "Modified Wooded Badlands", color: "#c8a87a" },
    167: { name: "Modified Badlands Plateau", color: "#e09a75" },
    // 1.14
    168: { name: "Bamboo Jungle", color: "#3d6b08" },
    169: { name: "Bamboo Jungle Hills", color: "#294809" },
    // 1.16 Nether biomes
    170: { name: "Soul Sand Valley", color: "#5a4530" },
    171: { name: "Crimson Forest", color: "#dd0808" },
    172: { name: "Warped Forest", color: "#1a8f80" },
    173: { name: "Basalt Deltas", color: "#403636" },
    // 1.17 Caves
    174: { name: "Dripstone Caves", color: "#382210" },
    175: { name: "Lush Caves", color: "#3b8a07" },
    // 1.18 Peaks & Meadows
    177: { name: "Meadow", color: "#60a060" },
    178: { name: "Grove", color: "#305030" },
    179: { name: "Snowy Slopes", color: "#d0d0d0" },
    180: { name: "Jagged Peaks", color: "#f0f0f0" },
    181: { name: "Frozen Peaks", color: "#e0e0e0" },
    182: { name: "Stony Peaks", color: "#909090" },
    // 1.19
    183: { name: "Deep Dark", color: "#081010" },
    184: { name: "Mangrove Swamp", color: "#2c6e49" },
    // 1.20
    185: { name: "Cherry Grove", color: "#eb91b5" },
    // 1.21
    186: { name: "Pale Garden", color: "#d8d8d8" },
};

export const STRUCTURE_INFO: Record<string, { name: string, icon: string, color: string, dimensions: string[] }> = {
    "biomes": { name: "Biomes", icon: "/icons/biome.png", color: "#8db360", dimensions: ["overworld", "nether", "end"] },
    "spawn": { name: "Spawn Point", icon: "/icons/spawn.png", color: "#ef4444", dimensions: ["overworld"] },
    "slime": { name: "Slime Chunk", icon: "/icons/slime.png", color: "#84cc16", dimensions: ["overworld"] },
    "village": { name: "Village", icon: "/icons/village.png", color: "#facc15", dimensions: ["overworld"] },
    "ancient_city": { name: "Ancient City", icon: "/icons/ancient_city.png", color: "#0f172a", dimensions: ["overworld"] },
    "dungeon": { name: "Dungeon", icon: "/icons/dungeon.png", color: "#71717a", dimensions: ["overworld"] },
    "stronghold": { name: "Stronghold", icon: "/icons/stronghold.png", color: "#a855f7", dimensions: ["overworld"] },
    "mansion": { name: "Mansion", icon: "/icons/mansion.png", color: "#78350f", dimensions: ["overworld"] },
    "monument": { name: "Monument", icon: "/icons/monument.png", color: "#22d3ee", dimensions: ["overworld"] },
    "outpost": { name: "Outpost", icon: "/icons/outpost.png", color: "#b91c1c", dimensions: ["overworld"] },
    "mineshaft": { name: "Mineshaft", icon: "/icons/mineshaft.png", color: "#fbbf24", dimensions: ["overworld"] },
    "ruined_portal": { name: "Ruined Portal", icon: "/icons/ruined_portal.png", color: "#c026d3", dimensions: ["overworld", "nether"] },
    "jungle_temple": { name: "Jungle Temple", icon: "/icons/jungle_temple.png", color: "#4ade80", dimensions: ["overworld"] },
    "desert_temple": { name: "Desert Temple", icon: "/icons/desert_temple.png", color: "#fb923c", dimensions: ["overworld"] },
    "witch_hut": { name: "Witch Hut", icon: "/icons/witch_hut.png", color: "#2dd4bf", dimensions: ["overworld"] },
    "treasure": { name: "Treasure", icon: "/icons/treasure.png", color: "#38bdf8", dimensions: ["overworld"] },
    "shipwreck": { name: "Shipwreck", icon: "/icons/shipwreck.png", color: "#94a3b8", dimensions: ["overworld"] },
    "igloo": { name: "Igloo", icon: "/icons/igloo.png", color: "#e2e8f0", dimensions: ["overworld"] },
    "ocean_ruin": { name: "Ocean Ruins", icon: "/icons/ocean_ruin.png", color: "#38bdf8", dimensions: ["overworld"] },
    "fossil": { name: "Fossil", icon: "/icons/fossil.png", color: "#d4d4d8", dimensions: ["overworld", "nether"] },
    "cave": { name: "Cave", icon: "/icons/cave.png", color: "#18181b", dimensions: ["overworld"] },
    "ravine": { name: "Ravine", icon: "/icons/ravine.png", color: "#52525b", dimensions: ["overworld"] },
    "lava_pool": { name: "Lava Pool", icon: "/icons/lava_pool.png", color: "#f97316", dimensions: ["overworld"] },
    "geode": { name: "Geode", icon: "/icons/geode.png", color: "#a855f7", dimensions: ["overworld"] },
    "apple": { name: "Apple", icon: "/icons/apple.png", color: "#ef4444", dimensions: ["overworld"] },
    "ore_veins": { name: "Ore Veins", icon: "/icons/ore_veins.png", color: "#64748b", dimensions: ["overworld"] },
    "desert_well": { name: "Desert Well", icon: "/icons/desert_well.png", color: "#fed7aa", dimensions: ["overworld"] },
    "trail_ruins": { name: "Trail Ruins", icon: "/icons/trail_ruins.png", color: "#a16207", dimensions: ["overworld"] },
    "fortress": { name: "Nether Fortress", icon: "/icons/fortress.png", color: "#b91c1c", dimensions: ["nether"] },
    "bastion": { name: "Bastion", icon: "/icons/bastion.png", color: "#1e293b", dimensions: ["nether"] },
    "end_city": { name: "End City", icon: "/icons/end_city.png", color: "#d946ef", dimensions: ["end"] },
};

export function getBiomeColor(id: number): string {
    return BIOME_COLORS[id]?.color || "#000000";
}

export function getBiomeName(id: number): string {
    return BIOME_COLORS[id]?.name || "Unknown";
}

export function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}
