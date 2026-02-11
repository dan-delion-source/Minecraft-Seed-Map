
#include "../lib/cubiomes/finders.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <inttypes.h>

const char* get_structure_name(int type) {
    switch(type) {
        case Desert_Pyramid: return "desert_pyramid";
        case Jungle_Temple: return "jungle_temple";
        case Swamp_Hut: return "swamp_hut";
        case Igloo: return "igloo";
        case Village: return "village";
        case Ocean_Ruin: return "ocean_ruin";
        case Shipwreck: return "shipwreck";
        case Monument: return "monument";
        case Mansion: return "mansion";
        case Outpost: return "outpost";
        case Ruined_Portal: return "ruined_portal";
        case Ancient_City: return "ancient_city";
        case Treasure: return "treasure";
        case Mineshaft: return "mineshaft";
        case Fortress: return "fortress";
        case Bastion: return "bastion";
        case End_City: return "end_city";
        case Trail_Ruins: return "trail_ruins";
        case Trial_Chambers: return "trial_chambers";
        default: return "unknown";
    }
}

int main(int argc, char *argv[])
{
    if (argc < 8) {
        fprintf(stderr, "Usage: %s <seed> <version_id> <x> <z> <sx> <sz> <dimension>\n", argv[0]);
        return 1;
    }

    uint64_t seed = strtoull(argv[1], NULL, 10);
    int version = atoi(argv[2]);
    int x0 = atoi(argv[3]);
    int z0 = atoi(argv[4]);
    int sx = atoi(argv[5]);
    int sz = atoi(argv[6]);
    const char *dimStr = argv[7];
    int x1 = x0 + sx;
    int z1 = z0 + sz;

    enum MCVersion mc;
    switch(version) {
        case 118: mc = MC_1_18; break;
        case 119: mc = MC_1_19; break;
        case 120: mc = MC_1_20; break;
        case 121: mc = MC_1_21; break;
        default: mc = MC_1_20; break;
    }

    int dim = DIM_OVERWORLD;
    if (strcmp(dimStr, "nether") == 0) dim = DIM_NETHER;
    else if (strcmp(dimStr, "end") == 0) dim = DIM_END;

    Generator g;
    setupGenerator(&g, mc, 0);
    applySeed(&g, dim, seed);

    printf("[");
    int first = 1;

    // List of structures to check
    int structures[32];
    int num_structures = 0;

    if (dim == DIM_OVERWORLD) {
        int ow_structs[] = {
            Desert_Pyramid, Jungle_Temple, Swamp_Hut, Igloo, Village,
            Ocean_Ruin, Shipwreck, Monument, Mansion, Outpost,
            Ruined_Portal, Ancient_City, Treasure, Trail_Ruins, Trial_Chambers
        };
        num_structures = sizeof(ow_structs) / sizeof(ow_structs[0]);
        memcpy(structures, ow_structs, sizeof(ow_structs));
    } else if (dim == DIM_NETHER) {
        int ne_structs[] = { Fortress, Bastion, Ruined_Portal };
        num_structures = sizeof(ne_structs) / sizeof(ne_structs[0]);
        memcpy(structures, ne_structs, sizeof(ne_structs));
    } else if (dim == DIM_END) {
        int en_structs[] = { End_City };
        num_structures = sizeof(en_structs) / sizeof(en_structs[0]);
        memcpy(structures, en_structs, sizeof(en_structs));
    }

    for (int i = 0; i < num_structures; i++) {
        int stype = structures[i];
        StructureConfig sconf;
        if (!getStructureConfig(stype, mc, &sconf)) continue;

        // Determine region range
        int rx0 = (x0 >> 4) / sconf.regionSize - 1;
        int rz0 = (z0 >> 4) / sconf.regionSize - 1;
        int rx1 = (x1 >> 4) / sconf.regionSize + 1;
        int rz1 = (z1 >> 4) / sconf.regionSize + 1;

        for (int rx = rx0; rx <= rx1; rx++) {
            for (int rz = rz0; rz <= rz1; rz++) {
                Pos p;
                if (getStructurePos(stype, mc, seed, rx, rz, &p)) {
                    if (p.x >= x0 && p.x < x1 && p.z >= z0 && p.z < z1) {
                        if (isViableStructurePos(stype, &g, p.x, p.z, 0)) {
                            if (!first) printf(",");
                            printf("{\"type\":\"%s\",\"x\":%d,\"z\":%d}", get_structure_name(stype), p.x, p.z);
                            first = 0;
                        }
                    }
                }
            }
        }
    }

    printf("]\n");

    return 0;
}
