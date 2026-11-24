// Genera los iconos de la app y el logo del encabezado a partir de
// public/logo.png. Uso: npm run icons

import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const LOGO = 'brand/logo.png';
const OUT = 'public/icons';

await mkdir(OUT, { recursive: true });

async function icon(size, ratio, name) {
    const inner = Math.round(size * ratio);
    const pad = Math.round((size - inner) / 2);

    await sharp(LOGO)
        .resize(inner, inner, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .flatten({ background: '#000000' })
        .extend({
            top: pad,
            bottom: size - inner - pad,
            left: pad,
            right: size - inner - pad,
            background: '#000000',
        })
        .png({ compressionLevel: 9 })
        .toFile(`${OUT}/${name}`);

    console.log(`${OUT}/${name}`);
}

await icon(192, 0.9, 'pwa-192.png');
await icon(512, 0.9, 'pwa-512.png');
await icon(512, 0.7, 'maskable-512.png');
await icon(180, 0.88, 'apple-touch-icon-180.png');

// Logo del encabezado, mucho más liviano que el PNG original.
await sharp(LOGO)
    .resize(256, 256, { fit: 'contain' })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile('public/logo-256.webp');

console.log('public/logo-256.webp');
