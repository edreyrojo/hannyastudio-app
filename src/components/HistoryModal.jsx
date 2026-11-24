import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from './Modal';
import {
    MAX_HISTORY,
    clearHistory,
    deleteHistory,
    downloadBlob,
    getHistoryBlob,
    listHistory,
} from '../utils/storage';

function formatDate(timestamp) {
    try {
        return new Date(timestamp).toLocaleString('es-MX', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '';
    }
}

function HistoryCard({ item, busy, onShare, onDownload, onDelete }) {
    // La miniatura es pequeña; se crea una sola vez por elemento.
    const thumbUrl = useMemo(
        () => (item.thumb ? URL.createObjectURL(item.thumb) : ''),
        [item.thumb]
    );
    const [confirming, setConfirming] = useState(false);

    return (
        <div className="rounded-lg overflow-hidden border border-amber-500/20 bg-zinc-900/60">
            {thumbUrl ? (
                <img src={thumbUrl} alt="" className="w-full aspect-[9/16] object-cover bg-black" />
            ) : (
                <div className="w-full aspect-[9/16] bg-black" />
            )}

            <div className="p-2 space-y-1">
                <p className="text-[10px] text-amber-500/70">{formatDate(item.createdAt)}</p>
                <p className="text-[11px] text-amber-100/80 leading-snug line-clamp-2 min-h-[2.2em]">
                    {item.phrase || 'Sin texto'}
                </p>

                <div className="flex items-center justify-between pt-1">
                    <button
                        type="button"
                        onClick={() => onShare(item)}
                        disabled={busy}
                        className="text-[10px] font-semibold text-amber-300 disabled:opacity-50 cursor-pointer"
                    >
                        Compartir
                    </button>
                    <button
                        type="button"
                        onClick={() => onDownload(item)}
                        disabled={busy}
                        className="text-[10px] text-amber-200/70 disabled:opacity-50 cursor-pointer"
                    >
                        Bajar
                    </button>
                    {confirming ? (
                        <span className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => onDelete(item.id)}
                                className="text-[10px] text-red-400 font-bold cursor-pointer"
                            >
                                Sí
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirming(false)}
                                className="text-[10px] text-amber-200/70 cursor-pointer"
                            >
                                No
                            </button>
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setConfirming(true)}
                            className="text-[10px] text-amber-500/50 cursor-pointer"
                        >
                            Borrar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export function HistoryModal({ onClose, onCountChange }) {
    const [items, setItems] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [confirmClear, setConfirmClear] = useState(false);
    const [error, setError] = useState('');
    const countRef = useRef(onCountChange);

    useEffect(() => {
        countRef.current = onCountChange;
    });

    useEffect(() => {
        const flag = { cancelled: false };

        listHistory()
            .then((list) => {
                if (flag.cancelled) return;
                const sorted = [...list].sort((a, b) => b.createdAt - a.createdAt);
                setItems(sorted);
                countRef.current?.(sorted.length);
            })
            .catch(() => {
                if (flag.cancelled) return;
                setItems([]);
                setError('No se pudo abrir el historial.');
            });

        return () => {
            flag.cancelled = true;
        };
    }, []);

    const getFile = async (item) => {
        const blob = await getHistoryBlob(item.id);
        if (!blob) throw new Error('La imagen ya no está disponible.');
        return new File([blob], `hannyastudio-${item.createdAt}.png`, { type: 'image/png' });
    };

    const handleShare = async (item) => {
        setBusyId(item.id);
        setError('');
        try {
            const file = await getFile(item);
            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({ files: [file] });
            } else {
                downloadBlob(file, file.name);
            }
        } catch (err) {
            if (err?.name !== 'AbortError') setError(err?.message || 'No se pudo compartir.');
        } finally {
            setBusyId(null);
        }
    };

    const handleDownload = async (item) => {
        setBusyId(item.id);
        setError('');
        try {
            const file = await getFile(item);
            downloadBlob(file, file.name);
        } catch (err) {
            setError(err?.message || 'No se pudo descargar.');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteHistory(id);
            const next = (items ?? []).filter((item) => item.id !== id);
            setItems(next);
            countRef.current?.(next.length);
        } catch {
            setError('No se pudo borrar la imagen.');
        }
    };

    const handleClear = async () => {
        try {
            await clearHistory();
            setItems([]);
            setConfirmClear(false);
            countRef.current?.(0);
        } catch {
            setError('No se pudo borrar el historial.');
        }
    };

    return (
        <Modal
            title="Historial"
            subtitle={`Se guardan las últimas ${MAX_HISTORY} imágenes en este teléfono`}
            onClose={onClose}
            footer={
                items && items.length > 0 ? (
                    confirmClear ? (
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-amber-200/80 flex-1">
                                Se borrarán todas las imágenes.
                            </span>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-3 py-2 rounded-lg bg-red-500/90 text-black text-[11px] font-bold cursor-pointer"
                            >
                                Sí, borrar
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmClear(false)}
                                className="px-3 py-2 rounded-lg bg-zinc-800 text-amber-200 text-[11px] border border-amber-500/20 cursor-pointer"
                            >
                                No
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setConfirmClear(true)}
                            className="w-full py-2 rounded-lg bg-zinc-900 text-amber-500/70 text-[10px] border border-amber-500/15 cursor-pointer"
                        >
                            Borrar todo el historial
                        </button>
                    )
                ) : null
            }
        >
            {error && <p className="text-[11px] text-red-400 mb-3">{error}</p>}

            {items === null && (
                <p className="text-center text-[11px] text-amber-200/50 py-10">Abriendo historial...</p>
            )}

            {items?.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-[12px] text-amber-100/80">Todavía no hay imágenes.</p>
                    <p className="text-[11px] text-amber-200/50 mt-1">
                        Cada imagen que generes se guarda aquí automáticamente.
                    </p>
                </div>
            )}

            {items && items.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                    {items.map((item) => (
                        <HistoryCard
                            key={item.id}
                            item={item}
                            busy={busyId === item.id}
                            onShare={handleShare}
                            onDownload={handleDownload}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </Modal>
    );
}
