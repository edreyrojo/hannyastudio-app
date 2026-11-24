import { fitImage } from './fitImage';
import { getTemplate, H, W } from './templates';
import { TEXT, computeTextLayout, fontString, FONT_SAMPLE } from './textLayout';

async function loadImage(src) {
    const img = new Image();
    img.src = src;
    await img.decode();
    return img;
}

// Sin esto, el primer export puede salir con la fuente de respaldo.
async function ensureFonts() {
    if (!document.fonts) return;
    try {
        await Promise.all([
            document.fonts.load(fontString(64), FONT_SAMPLE),
            document.fonts.load(fontString(24), FONT_SAMPLE),
        ]);
        await document.fonts.ready;
    } catch {
        // Si la fuente no está disponible, se exporta con la de respaldo.
    }
}

// Dibuja una línea con el mismo espaciado entre letras que la vista previa.
function drawTrackedLine(ctx, text, centerX, y, trackingPx) {
    if (!trackingPx) {
        ctx.fillText(text, centerX, y);
        return;
    }

    if ('letterSpacing' in ctx) {
        ctx.letterSpacing = `${trackingPx}px`;
        ctx.fillText(text, centerX, y);
        ctx.letterSpacing = '0px';
        return;
    }

    // Safari viejo: se dibuja letra por letra para no perder el espaciado.
    ctx.textAlign = 'left';
    const chars = [...text];
    let width = 0;
    for (const char of chars) width += ctx.measureText(char).width + trackingPx;

    let x = centerX - width / 2;
    for (const char of chars) {
        ctx.fillText(char, x, y);
        x += ctx.measureText(char).width + trackingPx;
    }
    ctx.textAlign = 'center';
}

// Coloca cada línea igual que un bloque CSS: el interlineado se reparte
// arriba y abajo del texto, así que la previa y el PNG coinciden.
function drawBlock(ctx, block) {
    if (!block || !block.lines.length) return;

    const { fontPx, lineH, trackingPx } = block;
    ctx.font = fontString(fontPx);
    ctx.fillStyle = block.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = TEXT.shadow.color;
    ctx.shadowBlur = fontPx * TEXT.shadow.blur;
    ctx.shadowOffsetY = fontPx * TEXT.shadow.offsetY;

    const metrics = ctx.measureText('Hg');
    const ascent = metrics.fontBoundingBoxAscent || fontPx * 0.8;
    const descent = metrics.fontBoundingBoxDescent || fontPx * 0.2;
    const halfLeading = (lineH - (ascent + descent)) / 2;

    block.lines.forEach((line, index) => {
        if (!line) return;
        const baseline = block.top + index * lineH + halfLeading + ascent;
        drawTrackedLine(ctx, line, W / 2, baseline, trackingPx);
    });

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
}

export async function renderToBlob({ template, image, crop, text, motivationalText, layout, accent }) {
    await ensureFonts();

    const isGroup = template !== 'cartel';
    const tpl = getTemplate(template);

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    const frame = await loadImage(tpl.src);

    // 1. Foto dentro del hueco, con el mismo encuadre de la vista previa
    if (isGroup && image) {
        if (!tpl.hole) throw new Error('Esta plantilla no tiene zona para la foto.');

        const photo = await loadImage(image.url);
        const hx = (tpl.hole.left / 100) * W;
        const hy = (tpl.hole.top / 100) * H;
        const hw = (tpl.hole.width / 100) * W;
        const hh = (tpl.hole.height / 100) * H;
        const fit = fitImage({ w: W, h: H }, tpl.hole, image, crop);

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

    // 2. Marco encima
    ctx.drawImage(frame, 0, 0, W, H);

    // 3. Texto
    const plan = computeTextLayout({
        template,
        text,
        phrase: motivationalText,
        layout,
        hole: tpl.hole,
        accent,
    });
    drawBlock(ctx, plan.phrase);
    drawBlock(ctx, plan.accent);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('El navegador no pudo crear la imagen');
    return blob;
}
