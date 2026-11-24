// Convierte las plantillas PNG en WebP (completa y versión de vista previa)
// y calcula el hueco de la foto. Uso: npm run templates
//
// Las fuentes viven en templates-source/. Los archivos que usa la app se
// escriben en public/templates/.

import sharp from 'sharp';
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const SOURCE = 'templates-source';
const OUT = 'public/templates';
const PREVIEW_WIDTH = 540;
const ALPHA_THRESHOLD = 20;

const round = (value) => Math.round(value * 1000) / 1000;
const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

async function findHole(input) {
    const { data, info } = await sharp(input)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    let minX = info.width;
    let minY = info.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            if (data[(y * info.width + x) * 4 + 3] < ALPHA_THRESHOLD) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (maxX < 0) return null;

    // 2 px de margen para que la foto cubra hasta el borde rasgado.
    const left = Math.max(0, minX - 2);
    const top = Math.max(0, minY - 2);
    const right = Math.min(info.width, maxX + 3);
    const bottom = Math.min(info.height, maxY + 3);

    return {
        left: round((left / info.width) * 100),
        top: round((top / info.height) * 100),
        width: round(((right - left) / info.width) * 100),
        height: round(((bottom - top) / info.height) * 100),
    };
}

await mkdir(OUT, { recursive: true });

const files = (await readdir(SOURCE))
    .filter((file) => /\.png$/i.test(file))
    .sort();

if (!files.length) {
    console.log(`No hay PNG en ${SOURCE}/.`);
    process.exit(0);
}

const entries = [];

for (const file of files) {
    const name = path.basename(file, path.extname(file));
    const input = path.join(SOURCE, file);
    const full = path.join(OUT, `${name}.webp`);
    const preview = path.join(OUT, `${name}-preview.webp`);

    await sharp(input).webp({ quality: 84, alphaQuality: 100, effort: 6 }).toFile(full);
    await sharp(input)
        .resize({ width: PREVIEW_WIDTH })
        .webp({ quality: 80, alphaQuality: 100, effort: 6 })
        .toFile(preview);

    const hole = await findHole(input);
    const fullSize = (await stat(full)).size;
    const previewSize = (await stat(preview)).size;

    entries.push({ name, hole });
    console.log(`${name}: ${kb(fullSize)} + ${kb(previewSize)} de previa`);
}

console.log('\nCopia esto en TEMPLATES dentro de src/utils/templates.js:\n');
for (const { name, hole } of entries) {
    const holeText = hole ? JSON.stringify(hole) : 'null';
    console.log(
        `  ${name}: { src: '/templates/${name}.webp', preview: '/templates/${name}-preview.webp', hole: ${holeText} },`
    );
}
