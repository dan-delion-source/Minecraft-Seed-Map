
#include "../lib/cubiomes/generator.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <inttypes.h>

int main(int argc, char *argv[])
{
    if (argc < 9) {
        fprintf(stderr, "Usage: %s <seed> <version_id> <scale> <x> <z> <sx> <sz> <dimension>\n", argv[0]);
        return 1;
    }

    uint64_t seed = strtoull(argv[1], NULL, 10);
    int version = atoi(argv[2]); // e.g. 120 for MC_1_20
    int scale = atoi(argv[3]);
    int x = atoi(argv[4]);
    int z = atoi(argv[5]);
    int sx = atoi(argv[6]);
    int sz = atoi(argv[7]);
    const char *dimStr = argv[8];

    // Map user version to Cubiomes version
    // MC_1_18 = 118, MC_1_19 = 119, MC_1_20 = 120, etc.
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

    Range r;
    r.scale = scale;
    r.x = x; r.z = z;
    r.sx = sx; r.sz = sz;
    r.y = 63; r.sy = 1; // Sea level

    int *biomeIds = allocCache(&g, r);
    genBiomes(&g, biomeIds, r);

    // Output JSON
    printf("[");
    for (int i = 0; i < sx * sz; i++) {
        printf("%d%s", biomeIds[i], (i == sx * sz - 1) ? "" : ",");
    }
    printf("]\n");

    free(biomeIds);
    return 0;
}
