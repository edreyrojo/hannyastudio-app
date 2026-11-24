import { useEffect, useMemo, useRef, useState } from 'react';
import { fitImage } from '../utils/fitImage';
import { TEMPLATES, W } from '../utils/templates';
import { TEXT, blockStyle, computeTextLayout, fontString, FONT_SAMPLE } from '../utils/textLayout';

export function CanvasPreview({
    image, template, text, motivationalText, layout, crop, accent, onCropChange, previewRef,
}) {
    const [box, setBox] = useState({ w: 0, h: 0 });
    const [fontsReady, setFontsReady] = useState(false);
    const pointers = useRef(new Map());
    const gesture = useRef(null);
    const latest = useRef({});

    const tpl = TEMPLATES[template] || TEMPLATES.cartel;
    const isGroup = template !== 'cartel';
    const hole = isGroup ? tpl.hole : null;

    // El texto se mide con la fuente real; medir antes de que cargue da saltos
    // de línea distintos a los del archivo exportado.
    useEffect(() => {
        let cancelled = false;
        const ready = document.fonts
            ? document.fonts
                .load(fontString(64), FONT_SAMPLE)
                .catch(() => {})
                .then(() => document.fonts.ready)
            : Promise.resolve();

        ready.then(() => {
            if (!cancelled) setFontsReady(true);
        });

        return () => {
            cancelled = true;
        };
    }, []);

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

    const scale = box.w > 0 ? box.w / W : 0;
    const ready = Boolean(isGroup && image && hole && box.w > 0);
    const fit = ready ? fitImage(box, hole, image, crop) : null;

    const plan = useMemo(() => {
        if (box.w <= 0 || !fontsReady) return null;
        return computeTextLayout({
            template,
            text,
            phrase: motivationalText,
            layout,
            hole,
            accent,
        });
    }, [box.w, fontsReady, template, text, motivationalText, layout, hole, accent]);

    // El manejador de gestos necesita siempre el último estado sin provocar renders.
    useEffect(() => {
        latest.current = { ready, box, hole, image, crop, onCropChange };
    });

    // ---- Gestos: un dedo mueve, dos dedos hacen zoom ----
    const startGesture = () => {
        const current = latest.current;
        if (!current.ready) return;

        const start = fitImage(current.box, current.hole, current.image, current.crop);
        const [a, b] = [...pointers.current.values()];
        if (!a) return;

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
        if (!hw || !hh) return;

        const next = fitImage(box, hole, image, {
            zoom,
            x: g.crop.x + (mid.x - g.mid.x) / hw,
            y: g.crop.y + (mid.y - g.mid.y) / hh,
        });
        onCropChange({ zoom: next.zoom, x: next.x, y: next.y });
    };

    const handlePointerEnd = (e) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size > 0) startGesture();
        else gesture.current = null;
    };

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
                        src={tpl.preview}
                        alt="Frame de Academia"
                        className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
                    />

                    {plan && (
                        <div className="absolute inset-0 z-20 pointer-events-none">
                            {plan.accent && (
                                <p style={blockStyle(plan.accent, scale)}>{plan.accent.lines.join('\n')}</p>
                            )}
                            {plan.phrase.lines.length > 0 ? (
                                <p style={blockStyle(plan.phrase, scale)}>{plan.phrase.lines.join('\n')}</p>
                            ) : (
                                !isGroup && (
                                    <p
                                        style={{
                                            ...blockStyle(plan.phrase, scale),
                                            color: 'rgba(254, 243, 199, 0.35)',
                                        }}
                                    >
                                        ESCRIBE EL TEXTO DEL AVISO
                                    </p>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {ready && (
                <p className="mt-1 text-[11px] text-amber-200/60 text-center">
                    Arrastra para mover la foto, pellizca para acercar
                </p>
            )}

            {ready && plan?.overlap > TEXT.overlapWarning && (
                <p className="mt-1 text-[11px] text-amber-300/80 text-center">
                    El texto tapa buena parte de la foto. Baja la altura o reduce la letra.
                </p>
            )}
        </div>
    );
}
