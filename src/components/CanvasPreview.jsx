import { useEffect, useState } from 'react';
import { findHole } from '../utils/findHole';

const TEMPLATES = {
    cuadrada: '/templates/cuadrada.png',
    horizontal: '/templates/horizontal.png',
    vertical: '/templates/vertical.png',
    cartel: '/templates/cartel.png',
};

export function CanvasPreview({ image, template, text, previewRef }) {
    const [hole, setHole] = useState(null);
    const templateSrc = TEMPLATES[template] || TEMPLATES.cartel;

    useEffect(() => {
        if (template === 'cartel') { setHole(null); return; }
        let cancelled = false;
        findHole(templateSrc).then((h) => { if (!cancelled) setHole(h); });
        return () => { cancelled = true; };
    }, [template, templateSrc]);

    return (
        <div className="flex flex-col items-center justify-center bg-black-900 p-4 rounded-xl border border-amber-800 shadow-xl w-full">
            <span className="text-xs text-slate-400 mb-2">Vista previa (Formato Historia de Instagram)</span>

            <div
                ref={previewRef}
                className="relative w-full max-w-sm aspect-[9/16] overflow-hidden bg-black-950 border border-amber-700 shadow-2xl"
            >
                {/* Foto debajo del marco, ajustada al hueco detectado */}
                {template !== 'cartel' && hole && (
                    <div
                        className="absolute overflow-hidden z-0 bg-black-900"
                        style={{
                            left: `${hole.left}%`,
                            top: `${hole.top}%`,
                            width: `${hole.width}%`,
                            height: `${hole.height}%`,
                        }}
                    >
                        {image ? (
                            <img src={image} alt="Base" className="w-full h-full object-cover object-center" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-slate-500 text-xs text-center px-2">Sube tu foto aquí</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Marco PNG */}
                <img
                    key={template}
                    src={templateSrc}
                    alt="Frame de Academia"
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
                />

                {template === 'cartel' && (
                    <div className="absolute inset-x-0 top-[45%] px-8 z-20 text-center">
                        <p className="text-white font-bold text-base md:text-lg drop-shadow-md whitespace-pre-line leading-relaxed">
                            {text || 'Escribe el texto del aviso...'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}