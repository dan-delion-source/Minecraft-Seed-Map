import assert from 'node:assert/strict';
import { test } from 'node:test';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

test('biome generation is deterministic and cacheable', async () => {
    const url = `${base}/api/generate/biomes?seed=-9223372036854775808&version=120&sx=8&sz=8&scale=4`;
    const first = await fetch(url);
    assert.equal(first.status, 200);
    assert.match(first.headers.get('cache-control'), /max-age/);
    const data = await first.json();
    assert.equal(data.biomes.length, 64);
    assert.ok(data.biomes.every(Number.isInteger));
    assert.deepEqual(await (await fetch(url)).json(), data);
});

test('both generators reject malformed or unbounded input', async () => {
    for (const route of ['biomes', 'structures']) {
        for (const query of ['sx=-1&sz=-1', 'sx=0', 'sx=NaN', 'sx=2x', 'sx=20001', 'sx=10000&sz=50000', 'seed=9223372036854775808', 'seed=', 'seed=abc', 'version=999', 'dimension=invalid', 'x=Infinity']) {
            const response = await fetch(`${base}/api/generate/${route}?${query}`);
            assert.equal(response.status, 400, `${route}: ${query}`);
        }
    }
    assert.equal((await fetch(`${base}/api/generate/biomes?scale=3`)).status, 400);
});

test('all dimensions generate biomes and structures', async () => {
    for (const dimension of ['overworld', 'nether', 'end']) {
        const biomes = await fetch(`${base}/api/generate/biomes?seed=12345&dimension=${dimension}&sx=8&sz=8`);
        assert.equal(biomes.status, 200);
        assert.equal((await biomes.json()).biomes.length, 64);
        const structures = await fetch(`${base}/api/generate/structures?seed=12345&dimension=${dimension}&sx=2048&sz=2048`);
        assert.equal(structures.status, 200);
        const data = await structures.json();
        assert.ok(Array.isArray(data.structures));
        assert.ok(data.structures.every(s => typeof s.type === 'string' && Number.isInteger(s.x) && Number.isInteger(s.z)));
    }
});
