
import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const seed = searchParams.get('seed') || '0';
    const version = searchParams.get('version') || '120';
    const scale = searchParams.get('scale') || '1';
    const x = searchParams.get('x') || '0';
    const z = searchParams.get('z') || '0';
    const dimension = searchParams.get('dimension') || 'overworld';
    const sx = parseInt(searchParams.get('sx') || '256');
    const sz = parseInt(searchParams.get('sz') || '256');

    // Limit request size to prevent server overload
    if (sx * sz > 250000) {
        return NextResponse.json({ error: 'Request area too large' }, { status: 400 });
    }

    const binPath = path.join(process.cwd(), 'cubiomes_cli', 'biomes_json');

    try {
        const { stdout, stderr } = await execFileAsync(binPath, [
            seed, version, scale, x, z, sx.toString(), sz.toString(), dimension
        ]);

        if (stderr) {
            console.error('Cubiomes Error:', stderr);
        }

        const data = JSON.parse(stdout);
        return NextResponse.json({ biomes: data });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to generate biomes' }, { status: 500 });
    }
}
