
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'https://raw.githubusercontent.com/misode/mcmeta/data/data/minecraft';
const TARGET_DIR = './public/data';


const FILES_TO_DOWNLOAD = [
    { path: 'worldgen/noise_settings/overworld.json', name: 'overworld_noise_settings.json' },
    { path: 'dimension_type/overworld.json', name: 'overworld_dimension_type.json' }
];

async function downloadFile(fileConfig) {
    const url = `${BASE_URL}/${fileConfig.path}`;
    const targetPath = path.join(TARGET_DIR, fileConfig.name);

    if (!url) return;

    console.log(`Downloading ${url}...`);
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
        const buffer = await res.arrayBuffer();
        await fs.writeFile(targetPath, Buffer.from(buffer));
        console.log(`Saved to ${targetPath}`);
    } catch (error) {
        console.error(`Error downloading ${fileConfig.path}:`, error);
    }
}

async function main() {
    await fs.mkdir(TARGET_DIR, { recursive: true });
    for (const fileConfig of FILES_TO_DOWNLOAD) {
        await downloadFile(fileConfig);
    }
}

main();
