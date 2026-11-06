import { useState } from 'react';

export function ResultModal({ result, onClose }) {
    const [showHint, setShowHint] = useState(false);

    const canShareFiles =
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [result.file] });

    // Se llama directo desde el toque, con el archivo ya generado
    const handleShare = async () => {
        try {
            await navigator.share({ files: [result.file] });
        } catch (err) {
            if (err.name !== 'AbortError') setShowHint(true);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center overflow-auto p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
            <img
                src={result.url}
                alt="Imagen final"
                className="max-h-[62dvh] w-auto rounded-lg border border-amber-500/30"
            />

            <div className="w-full max-w-sm mt-4 space-y-2">
                {canShareFiles && (
                    <button
                        onClick={handleShare}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl cursor-pointer"
                    >
                        Guardar / Compartir
                    </button>
                )}

                <a
                    href={result.url}
                    download={result.file.name}
                    className={`block w-full py-3 text-center font-bold rounded-xl cursor-pointer ${
                        canShareFiles
                            ? 'bg-zinc-800 text-amber-400 border border-amber-500/50'
                            : 'bg-amber-500 text-black'
                    }`}
                >
                    Descargar
                </a>

                <button
                    onClick={onClose}
                    className="w-full py-3 bg-zinc-900 text-amber-200 rounded-xl border border-amber-500/30 cursor-pointer"
                >
                    Seguir editando
                </button>

                {(showHint || !canShareFiles) && (
                    <p className="text-xs text-amber-200/70 text-center pt-1">
                        Si no se guarda, mantén presionada la imagen y elige Guardar en Fotos.
                    </p>
                )}
            </div>
        </div>
    );
}