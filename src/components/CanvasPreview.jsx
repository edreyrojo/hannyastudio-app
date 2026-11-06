import { useEffect, useRef, useState } from 'react';
import { findHole } from '../utils/findHole';

export const MAX_ZOOM = 4;

export const TEMPLATES = {
    cuadrada: '/templates/cuadrada.png',
    horizontal: '/templates/horizontal.png',
    vertical: '/templates/vertical.png',
    cartel: '/templates/cartel.png',
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Tamaño y posición de la foto dentro del hueco (siempre cubre todo el hueco).
// x e y son desplazamientos como fracción del ancho/alto del hueco.
export function fitImage(box, hole, image, crop) {
    const hw = (box.w * hole.width) / 100;
    const hh = (box.h * hole.height) / 100;
    const base = Math.max(hw / image.width, hh / image.height);
    const zoom = clamp(crop.zoom, 1, MAX_ZOOM);
    const w = image.width * base * zoom;
    const h = image.height * base * zoom;
    const maxX = Math.max(0, w - hw) / 2 / hw;
    const maxY = Math.max(0, h - hh) / 2 / hh;
    return { hw, hh, w, h, zoom, x: clamp(crop.x, -maxX, maxX), y: clamp(crop.y, -maxY, maxY) };
}

export function CanvasPreview({
    image, template, text, motivationalText, layout, crop, onCropChange, previewRef,
}) {
    const [hole, setHole] = useState(null);
    const [box, setBox] = useState({ w: 0, h: 0 });
    const pointers = useRef(new Map());
    const gesture = useRef(null);
    const latest = useRef({});

    const templateSrc = TEMPLATES[template] || TEMPLATES.cartel;
    const isGroup = template !== 'cartel';

    useEffect(() => {
        if (!isGroup) { setHole(null); return; }
        let cancelled = false;
        findHole(templateSrc).then((h) => { if (!cancelled) setHole(h); });
        return () => { cancelled = true; };
    }, [isGroup, templateSrc]);

    // Tamaño real de la vista previa (para escalar texto y calcular el encuadre)
    useEffect(() => {
        const el = previewRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            setBox({ w: entry.contentRect.width, h: entry.contentRect.height });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [previewRef]);

    const ready = Boolean(isGroup && image && hole && box.w > 0);
    const fit = ready ? fitImage(box, hole, image, crop) : null;
    latest.current = { ready, box, hole, image, crop, onCropChange };

    // ---- Gestos: un dedo mueve, dos dedos hacen zoom ----
    const startGesture = () => {
        const { box, hole, image, crop } = latest.current;
        const start = fitImage(box, hole, image, crop);
        const [a, b] = [...pointers.current.values()];
        gesture.current = {
            crop: { zoom: start.zoom, x: start.x, y: start.y },
            dist: b ? Math.hypot(a.x - b.x, a.y - b.y) : 0,
            mid: b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : { x: a.x, y: a.y },
        };
    };

    const handlePointerDown = (e) => {
        if (!latest.current.ready) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        startGesture();
    };

    const handlePointerMove = (e) => {
        if (!pointers.current.has(e.pointerId) || !gesture.current) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        const { box, hole, image, onCropChange } = latest.current;
        const g = gesture.current;
        const [a, b] = [...pointers.current.values()];

        let zoom = g.crop.zoom;
        let mid = { x: a.x, y: a.y };
        if (b && g.dist > 0) {
            zoom = g.crop.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / g.dist);
            mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        }

        const { hw, hh } = fitImage(box, hole, image, { zoom, x: 0, y: 0 });
        const next = fitImage(box, hole, image, {
            zoom,
            x: g.crop.x + (mid.x - g.mid.x) / hw,
            y: g.crop.y + (mid.y - g.mid.y) / hh,
        });
        onCropChange({ zoom: next.zoom, x: next.x, y: next.y });
    };

    const handlePointerEnd = (e) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size > 0 && latest.current.ready) startGesture();
        else gesture.current = null;
    };

    // Tamaño de letra relativo al ancho de la imagen
    const fontPx = (box.w * layout.size) / 1000;

    return (
        <div className="flex flex-col items-center w-full">
            <div className="p-2 bg-zinc-900 rounded-xl border border-amber-500/30 shadow-xl">
                {/* Este nodo es el que se exporta: sin bordes ni sombras */}
                <div
                    ref={previewRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerEnd}
                    onPointerCancel={handlePointerEnd}
                    className="relative aspect-[9/16] h-[46dvh] md:h-auto md:w-[24rem] overflow-hidden bg-black select-none"
                    style={{ touchAction: ready ? 'none' : 'auto', cursor: ready ? 'grab' : 'default' }}
                >
                    {isGroup && hole && (
                        <div
                            className="absolute overflow-hidden z-0 bg-black"
                            style={{
                                left: `${hole.left}%`,
                                top: `${hole.top}%`,
                                width: `${hole.width}%`,
                                height: `${hole.height}%`,
                            }}
                        >
                            {fit ? (
                                <img
                                    src={image.url}
                                    crossOrigin="anonymous"
                                    alt="Foto"
                                    draggable={false}
                                    style={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: '50%',
                                        width: fit.w,
                                        height: fit.h,
                                        maxWidth: 'none',
                                        transform: `translate(-50%, -50%) translate(${fit.x * fit.hw}px, ${fit.y * fit.hh}px)`,
                                        pointerEvents: 'none',
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-amber-500/50 text-xs text-center px-2">Sube tu foto aquí</span>
                                </div>
                            )}
                        </div>
                    )}

                    <img
                        key={template}
                        src={templateSrc}
                        crossOrigin="anonymous"
                        alt="Frame de Academia"
                        className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
                    />

                    {isGroup && (
                        <div
                            className="absolute inset-x-0 px-[6%] z-20 text-center flex flex-col items-center pointer-events-none"
                            style={{ bottom: `${layout.y}%`, gap: fontPx * 0.3 }}
                        >
                            <p className="text-white font-semibold font-strong drop-shadow-md leading-snug" style={{ fontSize: fontPx }}>
                                {motivationalText}
                            </p>
                            <p className="text-amber-400 font-bold font-strong tracking-wider drop-shadow-md" style={{ fontSize: fontPx * 1.15 }}>
                                JIU JITSU BRASILEÑO
                            </p>
                        </div>
                    )}

                    {!isGroup && (
                        <div
                            className="absolute inset-x-0 px-[8%] z-20 text-center pointer-events-none"
                            style={{ top: `${layout.y}%` }}
                        >
                            <p
                                className="text-amber-100 font-bold font-strong drop-shadow-md whitespace-pre-line leading-relaxed"
                                style={{ fontSize: fontPx }}
                            >
                                {text || 'Escribe el texto del aviso...'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {ready && (
                <p className="mt-1 text-[11px] text-amber-200/60 text-center">
                    Arrastra para mover la foto, pellizca para acercar
                </p>
            )}
        </div>
    );
}