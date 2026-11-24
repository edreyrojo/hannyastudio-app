import { H, W } from './templates';

// Único lugar donde vive el estilo del texto que se dibuja sobre la plantilla.
// La vista previa y la exportación lo consumen por igual, así que lo que se ve
// en pantalla es exactamente lo que sale en el archivo.
export const TEXT = {
  family: '"Anton", sans-serif',
  weight: 400,
  uppercase: true,
  tracking: 0.05,
  lineHeight: 1.375,
  accentText: 'JIU JITSU BRASILEÑO',
  accentScale: 1.15,
  accentLineHeight: 1.5,
  gap: 0.3,
  minScale: 0.6,
  groupWidth: 0.88,
  cartelWidth: 0.84,
  // El bloque de aviso no puede bajar de aquí: abajo están los datos de contacto.
  cartelBottom: 0.84,
  // Tope de seguridad: el bloque nunca ocupa más de la mitad de la imagen.
  groupMaxHeight: 0.5,
  // A partir de este porcentaje del hueco, el texto ya tapa demasiado la foto.
  overlapWarning: 0.35,
  colors: {
    phrase: '#ffffff',
    accent: '#fbbf24',
    cartel: '#fef3c7',
  },
  shadow: { color: 'rgba(0, 0, 0, 0.55)', blur: 0.15, offsetY: 0.1 },
};

export function fontString(px) {
  return `${TEXT.weight} ${px}px ${TEXT.family}`;
}

let measureCtx;
function getMeasure() {
  if (!measureCtx) {
    measureCtx = document.createElement('canvas').getContext('2d');
    if (measureCtx && 'fontKerning' in measureCtx) measureCtx.fontKerning = 'none';
  }
  return measureCtx;
}

// Ancho real del texto incluyendo el espaciado entre letras.
export function measureLine(text, fontPx) {
  const ctx = getMeasure();
  if (!ctx) return 0;
  ctx.font = fontString(fontPx);
  return ctx.measureText(text).width + TEXT.tracking * fontPx * text.length;
}

function splitWord(word, maxWidth, fontPx) {
  const chunks = [];
  let chunk = '';
  for (const char of word) {
    const test = chunk + char;
    if (chunk && measureLine(test, fontPx) > maxWidth) {
      chunks.push(chunk);
      chunk = char;
    } else {
      chunk = test;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks.length ? chunks : [word];
}

// Parte el texto en líneas respetando los saltos de párrafo y sin dejar que
// una palabra larguísima se salga del ancho permitido.
export function wrapText(text, maxWidth, fontPx) {
  if (!text) return [];
  const lines = [];

  for (const paragraph of text.split('\n')) {
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }

    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (measureLine(word, fontPx) > maxWidth) {
        if (line) {
          lines.push(line);
          line = '';
        }
        const chunks = splitWord(word, maxWidth, fontPx);
        lines.push(...chunks.slice(0, -1));
        line = chunks[chunks.length - 1] || '';
        continue;
      }

      const test = line ? `${line} ${word}` : word;
      if (line && measureLine(test, fontPx) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }

  return lines;
}

// Busca el tamaño de letra más grande que quepa en el alto disponible.
function fitText({ text, maxWidth, maxHeight, basePx }) {
  const limit = Math.max(1, maxHeight);
  let scale = 1;
  let fontPx = basePx;
  let lines = wrapText(text, maxWidth, fontPx);
  let height = lines.length * fontPx * TEXT.lineHeight;

  while (height > limit && scale > TEXT.minScale) {
    scale = Math.max(TEXT.minScale, Math.round((scale - 0.02) * 100) / 100);
    fontPx = basePx * scale;
    lines = wrapText(text, maxWidth, fontPx);
    height = lines.length * fontPx * TEXT.lineHeight;
  }

  return { scale, fontPx, lines, height, lineH: fontPx * TEXT.lineHeight };
}

function normalize(value) {
  const text = String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .trim();
  return TEXT.uppercase ? text.toUpperCase() : text;
}

// Calcula, en coordenadas de 1080 x 1920, dónde va cada línea de texto.
// De aquí salen tanto la vista previa como el canvas de exportación.
export function computeTextLayout({ template, text, phrase, layout, hole }) {
  const isGroup = template !== 'cartel';
  const content = normalize(isGroup ? phrase : text);
  const maxWidth = W * (isGroup ? TEXT.groupWidth : TEXT.cartelWidth);
  const basePx = (W * layout.size) / 1000;

  let bottomPx = 0;
  let topPx = 0;
  let maxHeight = 0;

  if (isGroup) {
    bottomPx = H * (1 - layout.y / 100);
    const topLimit = Math.max(0, bottomPx - H * TEXT.groupMaxHeight);
    maxHeight = bottomPx - topLimit;
  } else {
    topPx = (H * layout.y) / 100;
    maxHeight = Math.max(0, H * TEXT.cartelBottom - topPx);
  }

  const accentPx = isGroup ? basePx * TEXT.accentScale : 0;
  const accentLineH = accentPx * TEXT.accentLineHeight;
  const gap = basePx * TEXT.gap;
  const available = Math.max(0, maxHeight - accentLineH - gap);

  const fitted = fitText({ text: content, maxWidth, maxHeight: available, basePx });
  const phraseTop = isGroup ? bottomPx - accentLineH - gap - fitted.height : topPx;

  const photoBottom = isGroup && hole ? (H * (hole.top + hole.height)) / 100 : 0;
  const photoHeight = isGroup && hole ? (H * hole.height) / 100 : 0;
  const overlap = photoHeight > 0 ? Math.max(0, photoBottom - phraseTop) / photoHeight : 0;

  return {
    isGroup,
    phrase: {
      lines: fitted.lines,
      fontPx: fitted.fontPx,
      lineH: fitted.lineH,
      trackingPx: TEXT.tracking * fitted.fontPx,
      top: phraseTop,
      color: isGroup ? TEXT.colors.phrase : TEXT.colors.cartel,
    },
    accent: isGroup
      ? {
          lines: [TEXT.accentText],
          fontPx: accentPx,
          lineH: accentLineH,
          trackingPx: TEXT.tracking * accentPx,
          top: bottomPx - accentLineH,
          color: TEXT.colors.accent,
        }
      : null,
    shrunk: fitted.scale < 1,
    overlap,
  };
}

// Estilos de un bloque de texto para la vista previa, escalados al tamaño real
// que tiene la previa en pantalla (scale = anchoVisible / 1080).
export function blockStyle(block, scale) {
  return {
    position: 'absolute',
    left: 0,
    right: 0,
    top: `${block.top * scale}px`,
    margin: 0,
    padding: 0,
    fontFamily: TEXT.family,
    fontWeight: TEXT.weight,
    fontKerning: 'none',
    fontSize: `${block.fontPx * scale}px`,
    lineHeight: `${block.lineH * scale}px`,
    letterSpacing: `${block.trackingPx * scale}px`,
    color: block.color,
    textAlign: 'center',
    whiteSpace: 'pre',
    textShadow: `0 ${TEXT.shadow.offsetY * block.fontPx * scale}px ${
      TEXT.shadow.blur * block.fontPx * scale
    }px ${TEXT.shadow.color}`,
  };
}
