
import {
    NoiseGeneratorSettings,
    RandomState,
    NoiseChunkGenerator,
    FixedBiomeSource,
    DensityFunction,
    WorldgenRegistries
} from 'deepslate/worldgen';
import { Identifier, BlockState, Holder } from 'deepslate/core';
import { NoiseParameters } from 'deepslate/math';

export async function loadGenerator(seed: bigint) {
    // Register some basic noise parameters so we can use DensityFunction.Noise
    const noiseId = Identifier.create('minecraft:offset');
    let offsetNoise: Holder<NoiseParameters>;
    if (!WorldgenRegistries.NOISE.has(noiseId)) {
        offsetNoise = WorldgenRegistries.NOISE.register(
            noiseId,
            NoiseParameters.create(-3, [1, 1, 1])
        );
    } else {
        offsetNoise = Holder.reference(WorldgenRegistries.NOISE, noiseId);
    }

    const settings: any = {
        defaultBlock: new BlockState("minecraft:stone"),
        defaultFluid: new BlockState("minecraft:water", { level: "0" }),
        seaLevel: 63,
        legacyRandomSource: false,
        disableMobGeneration: true,
        aquifersEnabled: false,
        oreVeinsEnabled: false,
        noise: {
            minY: -64,
            height: 384,
            sizeHorizontal: 1,
            sizeVertical: 2,
        },
        surfaceRule: {
            type: "minecraft:sequence",
            sequence: [
                {
                    type: "minecraft:condition",
                    if_true: {
                        type: "minecraft:vertical_gradient",
                        random_name: "minecraft:bedrock_floor",
                        true_at_and_below: { above_bottom: 0 },
                        false_at_and_above: { above_bottom: 5 }
                    },
                    then_run: {
                        type: "minecraft:block",
                        result_state: new BlockState("minecraft:bedrock")
                    }
                },
                {
                    type: "minecraft:condition",
                    if_true: {
                        type: "minecraft:water",
                        surface_depth_multiplier: 0,
                        add_stone_depth: false,
                        offset: 0
                    },
                    then_run: {
                        type: "minecraft:block",
                        result_state: new BlockState("minecraft:grass_block")
                    }
                }
            ]
        },
        // Improved noise router using actual noise
        noiseRouter: {
            barrier: new DensityFunction.Constant(0),
            continents: new DensityFunction.Constant(0),
            depth: new DensityFunction.Constant(0),
            erosion: new DensityFunction.Constant(0),

            // Combine Y gradient with noise for terrain
            finalDensity: new DensityFunction.Ap2(
                "add",
                new DensityFunction.YClampedGradient(-64, 320, 1, -1),
                new DensityFunction.Noise(0.25, 0.25, offsetNoise)
            ),

            fluidLevelFloodedness: new DensityFunction.Constant(0),
            fluidLevelSpread: new DensityFunction.Constant(0),
            lava: new DensityFunction.Constant(0),
            preliminarySurfaceLevel: new DensityFunction.Constant(0),
            ridges: new DensityFunction.Constant(0),
            temperature: new DensityFunction.Constant(0),
            vegetation: new DensityFunction.Constant(0),
            veinGap: new DensityFunction.Constant(0),
            veinRidged: new DensityFunction.Constant(0),
            veinToggle: new DensityFunction.Constant(0)
        }
    };

    const biomeSource = new FixedBiomeSource(Identifier.create('minecraft:plains'));
    const randomState = new RandomState(settings, seed);
    const generator = new NoiseChunkGenerator(biomeSource, settings);

    return { generator, randomState };
}

export function getHeight(generator: NoiseChunkGenerator, randomState: RandomState, x: number, z: number) {
    return generator.getBaseHeight(x, z, 'WORLD_SURFACE_WG', randomState);
}
