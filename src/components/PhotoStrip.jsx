import { useMemo, useState } from 'react';

function Thumb({ photo, active, confirming, onSelect, onDelete }) {
    // Miniatura pequeña: se crea una sola vez por foto.
    const url = useMemo(
        () => (photo.thumb ? URL.createObjectURL(photo.thumb) : ''),
        [photo.thumb]
    );

    return (
        <div className="relative shrink-0">
            <button
                type="button"
                onClick={() => onSelect(photo.id)}
                aria-label="Usar esta foto"
                aria-pressed={active}
                className={`block w-14 h-[4.7rem] rounded-lg overflow-hidden border-2 bg-black cursor-pointer ${
                    active ? 'border-amber-400' : 'border-amber-500/20'
                }`}
            >
                {url ? (
                    <img src={url} alt="" className="w-full h-full object-cover" />
                ) : (
                    <span className="w-full h-full block bg-zinc-800" />
                )}
            </button>

            <button
                type="button"
                onClick={() => onDelete(photo.id)}
                aria-label={confirming ? 'Confirmar borrado' : 'Borrar foto'}
                className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full text-[11px] font-bold leading-none cursor-pointer ${
                    confirming
                        ? 'bg-red-500 text-black'
                        : 'bg-zinc-800 text-amber-300 border border-amber-500/30'
                }`}
            >
                {confirming ? '!' : '×'}
            </button>
        </div>
    );
}

export function PhotoStrip({ photos, currentId, onSelect, onDelete }) {
    const [confirmId, setConfirmId] = useState(null);

    if (!photos.length) return null;

    const handleDelete = (id) => {
        if (confirmId === id) {
            onDelete(id);
            setConfirmId(null);
            return;
        }
        setConfirmId(id);
    };

    const handleSelect = (id) => {
        setConfirmId(null);
        onSelect(id);
    };

    return (
        <div className="mt-4">
            <p className="text-[11px] text-amber-200/70 mb-2">
                Fotos guardadas <span className="text-amber-500/60">({photos.length})</span>
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map((photo) => (
                    <Thumb
                        key={photo.id}
                        photo={photo}
                        active={photo.id === currentId}
                        confirming={confirmId === photo.id}
                        onSelect={handleSelect}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
        </div>
    );
}
