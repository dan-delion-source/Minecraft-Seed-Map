import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";

const execute = promisify(execFile);

export async function generate(request: NextRequest, kind: "biomes" | "structures") {
    const params = request.nextUrl.searchParams;
    const seed = params.get("seed") ?? "0";
    const version = params.get("version") ?? "120";
    const dimension = params.get("dimension") ?? "overworld";
    const readInt = (name: string, fallback: number) => {
        const raw = params.get(name) ?? String(fallback);
        return /^-?\d+$/.test(raw) ? Number(raw) : NaN;
    };
    const x = readInt("x", 0), z = readInt("z", 0);
    const sx = readInt("sx", kind === "biomes" ? 256 : 1024), sz = readInt("sz", kind === "biomes" ? 256 : 1024);
    const scale = readInt("scale", 4);
    let validSeed = false;
    try { validSeed = /^-?\d{1,20}$/.test(seed) && BigInt(seed) >= -(1n << 63n) && BigInt(seed) < (1n << 63n); } catch { /* Invalid seed. */ }
    if (!validSeed || !["118", "119", "120", "121"].includes(version) || !["overworld", "nether", "end"].includes(dimension)
        || ![x, z, sx, sz].every(Number.isSafeInteger) || Math.abs(x) > 30000000 || Math.abs(z) > 30000000
        || sx <= 0 || sz <= 0 || sx > 20000 || sz > 20000
        || sx * sz > (kind === "biomes" ? 250000 : 400000000)
        || (kind === "biomes" && ![1, 4, 16, 64, 256].includes(scale))) {
        return NextResponse.json({ error: "Invalid seed, version, dimension, coordinates, scale, or request size." }, { status: 400 });
    }
    const args = kind === "biomes" ? [seed, version, String(scale), String(x), String(z), String(sx), String(sz), dimension] : [seed, version, String(x), String(z), String(sx), String(sz), dimension];
    try {
        const { stdout } = await execute(path.join(process.cwd(), "cubiomes_cli", `${kind}_json`), args, {
            timeout: 20000, maxBuffer: 8 * 1024 * 1024, signal: request.signal,
        });
        return NextResponse.json({ [kind]: JSON.parse(stdout) }, { headers: { "Cache-Control": "public, max-age=86400, immutable" } });
    } catch (error) {
        if (!request.signal.aborted) console.error(`Failed to generate ${kind}`, error);
        return NextResponse.json({ error: `Failed to generate ${kind}. Please try again.` }, { status: 500 });
    }
}
