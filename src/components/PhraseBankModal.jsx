import { useRef, useState } from 'react';
import { Modal } from './Modal';
import { ALL_TAGS, TAGS, deaccent, normalizeBank, tagLabel } from '../utils/phraseBank';
import { downloadBlob } from '../utils/storage';

function Chip({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                active
                    ? 'bg-amber-500 text-black border-amber-500'
                    : 'bg-zinc-900 text-amber-200/80 border-amber-500/30'
            }`}
        >
            {children}
        </button>
    );
}

function PhraseRow({ item, onUse, onToggleFavorite, onUpdate, onRemove }) {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(item.text);
    const [tag, setTag] = useState(item.tag);
    const [confirming, setConfirming] = useState(false);

    const startEdit = () => {
        setText(item.text);
        setTag(item.tag);
        setEditing(true);
    };

    const save = () => {
        if (!text.trim()) return;
        onUpdate(item.id, { text, tag });
        setEditing(false);
    };

    if (editing) {
        return (
            <div className="rounded-lg border border-amber-500/30 bg-zinc-900/70 p-2 space-y-2">
                <textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    rows={2}
                    className="w-full p-2 bg-zinc-950 border border-amber-500/30 rounded-lg text-amber-100 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                />
                <div className="flex items-center gap-2">
                    <select
                        value={tag}
                        onChange={(event) => setTag(event.target.value)}
                        className="flex-1 min-w-0 p-2 bg-zinc-950 border border-amber-500/30 rounded-lg text-amber-100 text-[11px] outline-none"
                    >
                        {TAGS.map((entry) => (
                            <option key={entry.id} value={entry.id}>
                                {entry.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={save}
                        disabled={!text.trim()}
                        className="px-3 py-2 rounded-lg bg-amber-500 text-black text-[11px] font-bold disabled:opacity-50 cursor-pointer"
                    >
                        Guardar
                    </button>
                    <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="px-3 py-2 rounded-lg bg-zinc-800 text-amber-200 text-[11px] border border-amber-500/20 cursor-pointer"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-amber-500/15 bg-zinc-900/60 p-2">
            <div className="flex items-start gap-2">
                <button
                    type="button"
                    onClick={() => onToggleFavorite(item.id)}
                    aria-label={item.favorite ? 'Quitar de favoritas' : 'Marcar como favorita'}
                    aria-pressed={item.favorite}
                    className={`shrink-0 w-8 h-8 rounded-lg text-base leading-none cursor-pointer ${
                        item.favorite
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-amber-500/40 bg-zinc-950'
                    }`}
                >
                    {item.favorite ? '★' : '☆'}
                </button>

                <button
                    type="button"
                    onClick={() => onUse(item)}
                    className="flex-1 text-left text-[11px] leading-snug text-amber-100/90 cursor-pointer"
                >
                    {item.text}
                </button>

                <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="text-[9px] uppercase tracking-wide text-amber-500/60">
                        {tagLabel(item.tag)}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={startEdit}
                            className="text-[10px] text-amber-300/80 cursor-pointer"
                        >
                            Editar
                        </button>
                        {confirming ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onRemove(item.id)}
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
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setConfirming(true)}
                                className="text-[10px] text-amber-500/60 cursor-pointer"
                            >
                                Borrar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function PhraseBankModal({ api, onUse, onClose }) {
    const { bank, add, update, remove, toggleFavorite, reset, replace, exportBank } = api;

    const [query, setQuery] = useState('');
    const [tag, setTag] = useState(ALL_TAGS);
    const [onlyFavorites, setOnlyFavorites] = useState(false);
    const [newText, setNewText] = useState('');
    const [newTag, setNewTag] = useState('general');
    const [pendingImport, setPendingImport] = useState(null);
    const [confirmReset, setConfirmReset] = useState(false);
    const [message, setMessage] = useState('');
    const fileRef = useRef(null);

    const term = deaccent(query.trim());
    const favorites = bank.items.filter((item) => item.favorite).length;
    const filtered = bank.items.filter((item) => {
        if (tag !== ALL_TAGS && item.tag !== tag) return false;
        if (onlyFavorites && !item.favorite) return false;
        if (term && !deaccent(item.text).includes(term)) return false;
        return true;
    });

    const handleAdd = () => {
        const item = add(newText, newTag);
        if (!item) return;
        setNewText('');
        setMessage('Frase agregada.');
    };

    const handleFile = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        try {
            const raw = JSON.parse(await file.text());
            const clean = normalizeBank(raw);
            if (!clean) {
                setMessage('El archivo no tiene frases válidas.');
                setPendingImport(null);
                return;
            }
            setMessage('');
            setPendingImport({ raw, count: clean.items.length });
        } catch {
            setPendingImport(null);
            setMessage('No se pudo leer el archivo.');
        }
    };

    const confirmImport = () => {
        if (!pendingImport) return;
        const ok = replace(pendingImport.raw);
        setMessage(ok ? `Se importaron ${pendingImport.count} frases.` : 'No se pudo importar.');
        setPendingImport(null);
    };

    const handleExport = () => {
        const blob = new Blob([exportBank()], { type: 'application/json' });
        const date = new Date().toISOString().slice(0, 10);
        downloadBlob(blob, `hannya-frases-${date}.json`);
    };

    const handleReset = () => {
        reset();
        setConfirmReset(false);
        setMessage('Banco restablecido a las frases originales.');
    };

    return (
        <Modal
            title="Banco de frases"
            subtitle={`${bank.items.length} frases, ${favorites} ${favorites === 1 ? 'favorita' : 'favoritas'}`}
            onClose={onClose}
            footer={
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="py-2.5 rounded-lg bg-zinc-900 text-amber-200 text-[11px] font-semibold border border-amber-500/30 cursor-pointer"
                    >
                        Importar JSON
                    </button>
                    <button
                        type="button"
                        onClick={handleExport}
                        className="py-2.5 rounded-lg bg-zinc-900 text-amber-200 text-[11px] font-semibold border border-amber-500/30 cursor-pointer"
                    >
                        Exportar JSON
                    </button>
                </div>
            }
        >
            <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFile}
                className="hidden"
            />

            <div className="space-y-3">
                <div className="rounded-lg border border-amber-500/20 bg-zinc-900/40 p-2 space-y-2">
                    <textarea
                        value={newText}
                        onChange={(event) => setNewText(event.target.value)}
                        rows={2}
                        placeholder="Nueva frase..."
                        className="w-full p-2 bg-zinc-950 border border-amber-500/30 rounded-lg text-amber-100 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <div className="flex items-center gap-2">
                        <select
                            value={newTag}
                            onChange={(event) => setNewTag(event.target.value)}
                            className="flex-1 min-w-0 p-2 bg-zinc-950 border border-amber-500/30 rounded-lg text-amber-100 text-[11px] outline-none"
                        >
                            {TAGS.map((entry) => (
                                <option key={entry.id} value={entry.id}>
                                    {entry.label}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={!newText.trim()}
                            className="px-4 py-2 rounded-lg bg-amber-500 text-black text-[11px] font-bold disabled:opacity-50 cursor-pointer"
                        >
                            Agregar
                        </button>
                    </div>
                </div>

                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar frase..."
                    className="w-full p-2.5 bg-zinc-950 border border-amber-500/30 rounded-lg text-amber-100 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                />

                <div className="flex flex-wrap gap-2">
                    <Chip active={tag === ALL_TAGS} onClick={() => setTag(ALL_TAGS)}>
                        Todas
                    </Chip>
                    {TAGS.map((entry) => (
                        <Chip
                            key={entry.id}
                            active={tag === entry.id}
                            onClick={() => setTag(entry.id)}
                        >
                            {entry.label}
                        </Chip>
                    ))}
                    <Chip active={onlyFavorites} onClick={() => setOnlyFavorites((value) => !value)}>
                        ★ Favoritas
                    </Chip>
                </div>

                {pendingImport && (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                        <p className="text-[11px] text-amber-100">
                            El archivo tiene {pendingImport.count} frases. Se reemplazará el banco actual.
                        </p>
                        <div className="flex gap-2 mt-2">
                            <button
                                type="button"
                                onClick={confirmImport}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 text-black text-[11px] font-bold cursor-pointer"
                            >
                                Reemplazar
                            </button>
                            <button
                                type="button"
                                onClick={() => setPendingImport(null)}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-amber-200 text-[11px] border border-amber-500/20 cursor-pointer"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {message && <p className="text-[11px] text-amber-300/80">{message}</p>}

                <div className="flex items-center justify-between text-[10px] text-amber-500/60">
                    <span>
                        {filtered.length} de {bank.items.length}
                    </span>
                    <span>Ciclo actual: {bank.cycle + 1}</span>
                </div>

                <div className="space-y-1.5">
                    {filtered.length === 0 && (
                        <p className="text-center text-[11px] text-amber-200/50 py-6">
                            No hay frases con este filtro.
                        </p>
                    )}
                    {filtered.map((item) => (
                        <PhraseRow
                            key={item.id}
                            item={item}
                            onUse={onUse}
                            onToggleFavorite={toggleFavorite}
                            onUpdate={update}
                            onRemove={remove}
                        />
                    ))}
                </div>

                <div className="pt-2 border-t border-amber-500/10">
                    {confirmReset ? (
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-amber-200/80 flex-1">
                                Se perderán las frases editadas. ¿Continuar?
                            </span>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-3 py-2 rounded-lg bg-red-500/90 text-black text-[11px] font-bold cursor-pointer"
                            >
                                Sí
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmReset(false)}
                                className="px-3 py-2 rounded-lg bg-zinc-800 text-amber-200 text-[11px] border border-amber-500/20 cursor-pointer"
                            >
                                No
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setConfirmReset(true)}
                            className="w-full py-2 rounded-lg bg-zinc-900 text-amber-500/70 text-[10px] border border-amber-500/15 cursor-pointer"
                        >
                            Restablecer a las frases originales
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
