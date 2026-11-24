import { useEffect, useRef } from 'react';

// Contenedor común de las ventanas emergentes: hoja inferior en el teléfono,
// cuadro centrado en escritorio, con Escape, foco y bloqueo del scroll.
export function Modal({ title, subtitle, onClose, children, footer }) {
    const panelRef = useRef(null);
    const closeRef = useRef(onClose);

    useEffect(() => {
        closeRef.current = onClose;
    });

    useEffect(() => {
        panelRef.current?.focus();
        const handleKey = (event) => {
            if (event.key === 'Escape') closeRef.current?.();
        };
        document.addEventListener('keydown', handleKey);

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = previous;
        };
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => closeRef.current?.()}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
                onClick={(event) => event.stopPropagation()}
                className="w-full sm:max-w-lg max-h-[92dvh] bg-zinc-950 border border-amber-500/30 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col outline-none pb-[env(safe-area-inset-bottom)]"
            >
                <header className="flex items-start justify-between gap-3 px-4 py-3 border-b border-amber-500/20">
                    <div>
                        <h2 className="text-sm font-semibold text-amber-200">{title}</h2>
                        {subtitle && <p className="text-[11px] text-amber-500/70 mt-0.5">{subtitle}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={() => closeRef.current?.()}
                        aria-label="Cerrar"
                        className="shrink-0 w-9 h-9 rounded-lg bg-zinc-900 text-amber-300 border border-amber-500/30 text-lg leading-none cursor-pointer active:bg-zinc-800"
                    >
                        ×
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>

                {footer && <div className="px-4 py-3 border-t border-amber-500/20">{footer}</div>}
            </div>
        </div>
    );
}
