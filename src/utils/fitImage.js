import { MAX_ZOOM } from './templates';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Tamaño y posición de la foto dentro del hueco (siempre cubre todo el hueco).
// x e y son desplazamientos como fracción del ancho/alto del hueco.
export function fitImage(box, hole, image, crop) {
    const hw = (box.w * hole.width) / 100;
    const hh = (box.h * hole.height) / 100;

    if (!hw || !hh || !image?.width || !image?.height) {
        return { hw, hh, w: 0, h: 0, zoom: 1, x: 0, y: 0 };
    }

    const base = Math.max(hw / image.width, hh / image.height);
    const zoom = clamp(crop?.zoom ?? 1, 1, MAX_ZOOM);
    const w = image.width * base * zoom;
    const h = image.height * base * zoom;
    const maxX = Math.max(0, w - hw) / 2 / hw;
    const maxY = Math.max(0, h - hh) / 2 / hh;

    return {
        hw,
        hh,
        w,
        h,
        zoom,
        x: clamp(crop?.x ?? 0, -maxX, maxX),
        y: clamp(crop?.y ?? 0, -maxY, maxY),
    };
}
