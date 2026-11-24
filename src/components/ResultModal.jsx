import { useState } from 'react';
import { copyText } from '../utils/caption';

export function ResultModal({ result, onClose, onNext, busy, error, caption }) {
    const [showHint, setShowHint] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copyFailed, setCopyFailed] = useState(false);

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

    const handleCopy = async () => {
        const ok = await copyText(caption);
        if (ok) {
            setCopied(true);
            setCopyFailed(false);
            setTimeout(() => setCopied(false), 2000);
        } else {
            setCopyFailed(true);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center overflow-auto p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="relative">
                <img
                    src={result.url}
                    alt="Imagen final"
                    className="max-h-[62dvh] w-auto rounded-lg border border-amber-500/30"
                />
                {busy && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/70">
                        <span className="text-amber-300 text-sm font-semibold">Generando...</span>
                    </div>
                )}
            </div>

            <div className="w-full max-w-sm mt-4 space-y-2">
                {result.saved && (
                    <p className="text-[11px] text-amber-500/70 text-center">Guardada en el historial.</p>
                )}
                {error && (
                    <p className="text-[11px] text-red-400 text-center" role="alert">
                        {error}
                    </p>
                )}

                {canShareFiles && (
                    <button
                        onClick={handleShare}
                        disabled={busy}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold rounded-xl cursor-pointer"
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
                    } ${busy ? 'pointer-events-none opacity-50' : ''}`}
                >
                    Descargar
                </a>

                {onNext && (
                    <button
                        onClick={onNext}
                        disabled={busy}
                        className="w-full py-3 bg-zinc-900 text-amber-300 font-bold rounded-xl border border-amber-500/40 disabled:opacity-50 cursor-pointer"
                    >
                        Siguiente frase
                    </button>
                )}

                {caption && (
                    <button
                        onClick={handleCopy}
                        disabled={busy}
                        className="w-full py-2 text-amber-300/80 text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                    >
                        {copied ? 'Pie de foto copiado' : 'Copiar pie de foto'}
                    </button>
                )}
                {copyFailed && (
                    <div className="space-y-1">
                        <p className="text-[10px] text-amber-300/80 text-center">
                            No se pudo copiar solo. Selecciona el texto y cópialo:
                        </p>
                        <textarea
                            readOnly
                            rows={3}
                            value={caption}
                            onFocus={(event) => event.target.select()}
                            className="w-full p-2 bg-zinc-950 border border-amber-500/30 rounded-lg text-amber-100 text-[11px] outline-none resize-none"
                        />
                    </div>
                )}

                <button
                    onClick={onClose}
                    disabled={busy}
                    className="w-full py-3 bg-zinc-900 text-amber-200 rounded-xl border border-amber-500/30 cursor-pointer disabled:opacity-50"
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
