
import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const seed = searchParams.get('seed') || '0';
    const version = searchParams.get('version') || '120';
    const x = searchParams.get('x') || '0';
    const z = searchParams.get('z') || '0';
    const dimension = searchParams.get('dimension') || 'overworld';
    const sx = parseInt(searchParams.get('sx') || '1024');
    const sz = parseInt(searchParams.get('sz') || '1024');

    // Limit request size (400 million blocks max area)
    if (sx * sz > 400000001) {
        return NextResponse.json({ error: 'Request area too large' }, { status: 400 });
    }

    const binPath = path.join(process.cwd(), 'cubiomes_cli', 'structures_json');

    try {
        const { stdout } = await execFileAsync(binPath, [
            seed, version, x, z, sx.toString(), sz.toString(), dimension
        ]);

        const data = JSON.parse(stdout);
        return NextResponse.json({ structures: data });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to generate structures' }, { status: 500 });
    }
}
