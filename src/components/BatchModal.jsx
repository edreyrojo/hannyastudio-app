import { useState } from 'react';
import { Modal } from './Modal';
import { copyText } from '../utils/caption';
import { downloadBlob } from '../utils/storage';

export function BatchModal({ items, captionFor, onClose }) {
    const [busy, setBusy] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [notice, setNotice] = useState('');

    const canShareFiles =
        typeof navigator !== 'undefined' && typeof navigator.canShare === 'function';

    const shareOne = async (item) => {
        setBusy(true);
        setNotice('');
        try {
            if (canShareFiles && navigator.canShare({ files: [item.file] })) {
                await navigator.share({ files: [item.file] });
            } else {
                downloadBlob(item.blob, item.file.name);
            }
        } catch (err) {
            if (err?.name !== 'AbortError') setNotice('No se pudo compartir la imagen.');
        } finally {
            setBusy(false);
        }
    };

    const shareAll = async () => {
        setBusy(true);
        setNotice('');
        try {
            const files = items.map((item) => item.file);
            if (canShareFiles && navigator.canShare({ files })) {
                await navigator.share({ files });
            } else {
                setNotice('Este navegador no puede compartir varias imágenes a la vez.');
            }
        } catch (err) {
            if (err?.name !== 'AbortError') setNotice('No se pudieron compartir las imágenes.');
        } finally {
            setBusy(false);
        }
    };

    const copyCaption = async (item) => {
        const ok = await copyText(captionFor(item.phrase));
        if (!ok) {
            setNotice('No se pudo copiar el pie de foto.');
            return;
        }
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <Modal
            title="Lote generado"
            subtitle={`${items.length} imágenes guardadas en el historial`}
            onClose={onClose}
            footer={
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={shareAll}
                        disabled={busy || items.length < 2}
                        className="py-2.5 rounded-lg bg-amber-500 text-black text-[11px] font-bold disabled:opacity-50 cursor-pointer"
                    >
                        Compartir todas
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2.5 rounded-lg bg-zinc-900 text-amber-200 text-[11px] font-semibold border border-amber-500/30 cursor-pointer"
                    >
                        Cerrar
                    </button>
                </div>
            }
        >
            {notice && <p className="text-[11px] text-red-400 mb-3">{notice}</p>}

            <div className="grid grid-cols-2 gap-3">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="rounded-lg overflow-hidden border border-amber-500/20 bg-zinc-900/60"
                    >
                        <img
                            src={item.url}
                            alt=""
                            className="w-full aspect-[9/16] object-cover bg-black"
                        />
                        <div className="p-2 space-y-1">
                            <p className="text-[10px] text-amber-100/80 leading-snug line-clamp-2 min-h-[2.2em]">
                                {item.phrase}
                            </p>
                            <div className="flex items-center justify-between pt-1">
                                <button
                                    type="button"
                                    onClick={() => shareOne(item)}
                                    disabled={busy}
                                    className="text-[10px] font-semibold text-amber-300 disabled:opacity-50 cursor-pointer"
                                >
                                    Compartir
                                </button>
                                <button
                                    type="button"
                                    onClick={() => downloadBlob(item.blob, item.file.name)}
                                    className="text-[10px] text-amber-200/70 cursor-pointer"
                                >
                                    Bajar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => copyCaption(item)}
                                    className="text-[10px] text-amber-200/70 cursor-pointer"
                                >
                                    {copiedId === item.id ? 'Copiado' : 'Pie'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Modal>
    );
}
