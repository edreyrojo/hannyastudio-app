import { useEffect, useRef, useState } from 'react';
import { usePhraseBank } from '../hooks/usePhraseBank';
import { ALL_TAGS, TAGS, remainingCount } from '../utils/phraseBank';
import { PhraseBankModal } from './PhraseBankModal';

export function PhraseController({ value, onChange, ready }) {
    const bankApi = usePhraseBank();
    const { bank, next, markUsed, add } = bankApi;

    const [tag, setTag] = useState(ALL_TAGS);
    const [bankOpen, setBankOpen] = useState(false);
    const didInit = useRef(false);

    // Primera frase solo al montar y cuando el borrador ya cargó.
    useEffect(() => {
        if (!ready || didInit.current) return;
        didInit.current = true;
        if (value.trim()) return;

        const picked = next(ALL_TAGS);
        if (picked) onChange(picked.text);
    });

    const poolSize =
        tag === ALL_TAGS
            ? bank.items.length
            : bank.items.filter((item) => item.tag === tag).length;
    const remaining = remainingCount(bank, tag);
    const cleanValue = value.trim();
    const inBank = bank.items.some((item) => item.text === cleanValue);

    const handleNext = () => {
        const picked = next(tag);
        if (picked) onChange(picked.text);
    };

    const handleSaveToBank = () => {
        add(cleanValue, tag === ALL_TAGS ? 'general' : tag);
    };

    const handleUseFromBank = (item) => {
        onChange(item.text);
        markUsed(item.id);
        setBankOpen(false);
    };

    return (
        <div className="space-y-3">
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                rows={2}
                placeholder="Escribe la frase motivadora..."
                className="w-full p-2.5 bg-zinc-950 border border-amber-500/30 rounded-lg text-amber-100 text-xs leading-snug outline-none focus:ring-1 focus:ring-amber-500 resize-none"
            />

            <div className="flex items-center gap-2">
                <label htmlFor="phrase-tag" className="text-[11px] text-amber-200/70 shrink-0">
                    Tema
                </label>
                <select
                    id="phrase-tag"
                    value={tag}
                    onChange={(event) => setTag(event.target.value)}
                    className="flex-1 min-w-0 p-2 bg-zinc-950 border border-amber-500/30 rounded-lg text-amber-100 text-[11px] outline-none"
                >
                    <option value={ALL_TAGS}>Todas</option>
                    {TAGS.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                            {entry.label}
                        </option>
                    ))}
                </select>
                <span className="text-[10px] text-amber-500/70 shrink-0">
                    {remaining} de {poolSize}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={handleNext}
                    disabled={poolSize === 0}
                    className="py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-amber-400 font-semibold border border-amber-500/50 transition-colors text-xs cursor-pointer"
                >
                    Otra frase
                </button>
                <button
                    type="button"
                    onClick={() => setBankOpen(true)}
                    className="py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-200 font-semibold border border-amber-500/30 transition-colors text-xs cursor-pointer"
                >
                    Banco ({bank.items.length})
                </button>
            </div>

            {cleanValue && !inBank && (
                <button
                    type="button"
                    onClick={handleSaveToBank}
                    className="w-full py-2 rounded-lg bg-zinc-900 text-amber-300/80 text-[11px] border border-amber-500/20 cursor-pointer"
                >
                    Guardar esta frase en el banco
                </button>
            )}

            <p className="text-[10px] text-amber-200/40 text-center">
                Puedes editar la frase directamente para una versión de hoy.
            </p>

            {bankOpen && (
                <PhraseBankModal
                    api={bankApi}
                    onUse={handleUseFromBank}
                    onClose={() => setBankOpen(false)}
                />
            )}
        </div>
    );
}
