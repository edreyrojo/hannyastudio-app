import { useEffect, useState } from 'react';
import { findHole } from '../utils/findHole';

const TEMPLATES = {
    cuadrada: '/templates/cuadrada.png',
    horizontal: '/templates/horizontal.png',
    vertical: '/templates/vertical.png',
    cartel: '/templates/cartel.png',
};

export function CanvasPreview({ image, template, text, motivationalText, cropSettings, previewRef }) {
    const [hole, setHole] = useState(null);
    const templateSrc = TEMPLATES[template] || TEMPLATES.cartel;

    useEffect(() => {
        if (template === 'cartel') { setHole(null); return; }
        let cancelled = false;
        findHole(templateSrc).then((h) => { if (!cancelled) setHole(h); });
        return () => { cancelled = true; };
    }, [template, templateSrc]);

    const getGroupTextStyle = () => {
        switch (template) {
            case 'horizontal':
                return '35%';
            case 'vertical':
                return '25%';
            case 'cuadrada':
            default:
                return '22%';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center bg-zinc-900 p-4 rounded-xl border border-amber-500/30 shadow-xl w-full">
            <span className="text-xs text-amber-200/70 mb-2">Vista previa (Formato Historia de Instagram)</span>

            <div
                ref={previewRef}
                className="relative w-full max-w-sm aspect-[9/16] overflow-hidden bg-black border border-amber-500/30 shadow-2xl"
            >
                {template !== 'cartel' && hole && (
                    <div
                        className="absolute overflow-hidden z-0 bg-black"
                        style={{
                            left: `${hole.left}%`,
                            top: `${hole.top}%`,
                            width: `${hole.width}%`,
                            height: `${hole.height}%`,
                        }}
                    >
                        {image ? (
                            <img 
                                src={image} 
                                crossOrigin="anonymous" 
                                alt="Base" 
                                className="w-full h-full object-cover object-center" 
                                style={{
                                    transform: `scale(${cropSettings?.zoom || 1}) translate(${cropSettings?.offsetX || 0}px, ${cropSettings?.offsetY || 0}px)`
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

                {template !== 'cartel' && (
                    <div 
                        className="absolute inset-x-0 px-6 z-20 text-center flex flex-col items-center space-y-1"
                        style={{ bottom: getGroupTextStyle() }}
                    >
                        <p className="text-white font-semibold text-sm md:text-base drop-shadow-md leading-snug">
                            {motivationalText}
                        </p>
                        <p className="text-amber-400 font-bold text-base md:text-lg tracking-wider drop-shadow-md">
                            JIU JITSU BRASILEÑO
                        </p>
                    </div>
                )}

                {template === 'cartel' && (
                    <div className="absolute inset-x-0 top-[45%] px-8 z-20 text-center">
                        <p className="text-amber-100 font-bold text-base md:text-lg drop-shadow-md whitespace-pre-line leading-relaxed">
                            {text || 'Escribe el texto del aviso...'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}