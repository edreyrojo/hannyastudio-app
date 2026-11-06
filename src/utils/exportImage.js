import { TEMPLATES, fitImage } from '../components/CanvasPreview';
import { findHole } from './findHole';

const W = 1080;
const H = 1920;
const FONT = '"Anton", sans-serif';

async function loadImage(src) {
    const img = new Image();
    img.src = src;
    await img.decode();
    return img;
}

function wrapLines(ctx, text, maxWidth) {
    if (!text) return [];
    const lines = [];
    for (const paragraph of text.split('\n')) {
        let line = '';
        for (const word of paragraph.split(' ')) {
            const test = line ? `${line} ${word}` : word;
            if (line && ctx.measureText(test).width > maxWidth) {
                lines.push(line);
                line = word;
            } else {
                line = test;
            }
        }
        lines.push(line);
    }
    return lines;
}

export async function renderToBlob({ template, image, crop, text, motivationalText, layout }) {
    const isGroup = template !== 'cartel';
    const templateSrc = TEMPLATES[template] || TEMPLATES.cartel;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    const frame = await loadImage(templateSrc);

    // 1. Foto dentro del hueco, con el mismo encuadre de la vista previa
    if (isGroup && image) {
        const hole = await findHole(templateSrc);
        if (hole) {
            const photo = await loadImage(image.url);
            const hx = (hole.left / 100) * W;
            const hy = (hole.top / 100) * H;
            const hw = (hole.width / 100) * W;
            const hh = (hole.height / 100) * H;
            const fit = fitImage({ w: W, h: H }, hole, image, crop);

            ctx.save();
            ctx.beginPath();
            ctx.rect(hx, hy, hw, hh);
            ctx.clip();
            ctx.drawImage(
                photo,
                hx + hw / 2 + fit.x * hw - fit.w / 2,
                hy + hh / 2 + fit.y * hh - fit.h / 2,
                fit.w,
                fit.h
            );
            ctx.restore();
        }
    }

    // 2. Marco encima
    ctx.drawImage(frame, 0, 0, W, H);

    // 3. Texto
    const fontPx = (W * layout.size) / 1000;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = fontPx * 0.15;
    ctx.shadowOffsetY = fontPx * 0.1;

    if (isGroup) {
        const subPx = fontPx * 1.15;
        const subH = subPx * 1.5;
        const gap = fontPx * 0.3;
        let y = H * (1 - layout.y / 100); // borde inferior del bloque

        ctx.font = `700 ${subPx}px ${FONT}`;
        ctx.fillStyle = '#fbbf24';
        if ('letterSpacing' in ctx) ctx.letterSpacing = `${subPx * 0.05}px`;
        ctx.fillText('JIU JITSU BRASILEÑO', W / 2, y - subH / 2);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
        y -= subH + gap;

        ctx.font = `600 ${fontPx}px ${FONT}`;
        ctx.fillStyle = '#ffffff';
        const lineH = fontPx * 1.375;
        const lines = wrapLines(ctx, motivationalText, W * 0.88);
        for (let i = lines.length - 1; i >= 0; i--) {
            ctx.fillText(lines[i], W / 2, y - lineH / 2);
            y -= lineH;
        }
    } else {
        ctx.font = `700 ${fontPx}px ${FONT}`;
        ctx.fillStyle = '#fef3c7';
        const lineH = fontPx * 1.625;
        const lines = wrapLines(ctx, text, W * 0.84);
        let y = (H * layout.y) / 100; // borde superior del bloque
        for (const line of lines) {
            ctx.fillText(line, W / 2, y + lineH / 2);
            y += lineH;
        }
    }

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('El navegador no pudo crear la imagen');
    return blob;
}