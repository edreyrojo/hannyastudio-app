import { useEffect, useState } from 'react';
import { findHole } from '../utils/findHole';

const TEMPLATES = {
    cuadrada: '/templates/cuadrada.png',
    horizontal: '/templates/horizontal.png',
    vertical: '/templates/vertical.png',
    cartel: '/templates/cartel.png',
};

export function CanvasPreview({ image, template, text, motivationalText, previewRef }) {
    const [hole, setHole] = useState(null);
    const templateSrc = TEMPLATES[template] || TEMPLATES.cartel;

    useEffect(() => {
        if (template === 'cartel') { setHole(null); return; }
        let cancelled = false;
        findHole(templateSrc).then((h) => { if (!cancelled) setHole(h); });
        return () => { cancelled = true; };
    }, [template, templateSrc]);

    // Función para definir la altura (bottom) independiente de los textos según la plantilla grupal
    const getGroupTextStyle = () => {
        switch (template) {
            case 'horizontal':
                return 'bottom-[25%];'; // Ajuste específico para horizontal
            case 'vertical':
                return 'bottom-[25%];'; // Ajuste específico para vertical
            case 'cuadrada':
            default:
                return 'bottom-[25%];'; // Ajuste específico para cuadrada
        }
    };

    return (
        <div className="flex flex-col items-center justify-center bg-zinc-900 p-4 rounded-xl border border-amber-500/30 shadow-xl w-full">
            <span className="text-xs text-amber-200/70 mb-2">Vista previa (Formato Historia de Instagram)</span>

            <div
                ref={previewRef}
                className="relative w-full max-w-sm aspect-[9/16] overflow-hidden bg-black border border-amber-500/30 shadow-2xl"
            >
                {/* Foto debajo del marco, ajustada al hueco detectado */}
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
                            <img src={image} alt="Base" className="w-full h-full object-cover object-center scale-105" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-amber-500/50 text-xs text-center px-2">Sube tu foto aquí</span>
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

                {/* Textos para Fotos Grupales con altura independiente por template */}
                {template !== 'cartel' && (
                    <div 
                        className="absolute inset-x-0 px-6 z-20 text-center flex flex-col items-center space-y-1"
                        style={{ bottom: template === 'horizontal' ? '35%' : template === 'vertical' ? '25%' : '22%' }}
                    >
                        <p className="text-white font-semibold text-sm md:text-base drop-shadow-md leading-snug">
                            {motivationalText}
                        </p>
                        <p className="text-amber-400 font-bold text-base md:text-lg tracking-wider drop-shadow-md">
                            JIU JITSU BRASILEÑO
                        </p>
                    </div>
                )}

                {/* Texto para Carteles de Aviso */}
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