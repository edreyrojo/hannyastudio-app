import { useEffect, useMemo, useState } from 'react';
import { loadJSON, saveJSON } from '../utils/storage';
import {
    ALL_TAGS,
    TAGS,
    createSeedBank,
    normalizeBank,
    pickPhrase,
    poolFor,
} from '../utils/phraseBank';

const KEY = 'phrases.v1';

function randomId() {
    return `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function usePhraseBank() {
    const [bank, setBank] = useState(
        () => normalizeBank(loadJSON(KEY, null)) ?? createSeedBank()
    );

    useEffect(() => {
        saveJSON(KEY, bank);
    }, [bank]);

    const api = useMemo(() => {
        const next = (tag = ALL_TAGS) => {
            const result = pickPhrase(bank, tag);
            if (result.phrase) setBank(result.bank);
            return result.phrase;
        };

        // Elige varias frases sin repetir dentro del mismo lote.
        const nextBatch = (count, tag = ALL_TAGS) => {
            const total = Math.min(count, poolFor(bank, tag).length);
            let working = bank;
            const picked = [];

            while (picked.length < total) {
                const result = pickPhrase(working, tag);
                if (!result.phrase) break;
                working = result.bank;
                picked.push(result.phrase);
            }

            if (picked.length) setBank(working);
            return picked;
        };

        const markUsed = (id) => {
            setBank((prev) => ({
                ...prev,
                items: prev.items.map((item) =>
                    item.id === id ? { ...item, lastCycle: prev.cycle } : item
                ),
            }));
        };

        const add = (text, tag = 'general') => {
            const clean = text.trim();
            if (!clean) return null;

            const item = {
                id: randomId(),
                text: clean,
                tag: TAGS.some((entry) => entry.id === tag) ? tag : 'general',
                favorite: false,
                lastCycle: -1,
                createdAt: Date.now(),
            };

            setBank((prev) => ({ ...prev, items: [item, ...prev.items] }));
            return item;
        };

        const update = (id, patch) => {
            setBank((prev) => ({
                ...prev,
                items: prev.items.map((item) =>
                    item.id === id
                        ? {
                              ...item,
                              ...patch,
                              text: typeof patch.text === 'string' ? patch.text.trim() : item.text,
                              tag: patch.tag && TAGS.some((t) => t.id === patch.tag) ? patch.tag : item.tag,
                          }
                        : item
                ),
            }));
        };

        const remove = (id) => {
            setBank((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }));
        };

        const toggleFavorite = (id) => {
            setBank((prev) => ({
                ...prev,
                items: prev.items.map((item) =>
                    item.id === id ? { ...item, favorite: !item.favorite } : item
                ),
            }));
        };

        const reset = () => setBank(createSeedBank());

        const replace = (raw) => {
            const clean = normalizeBank(raw);
            if (!clean) return false;
            setBank(clean);
            return true;
        };

        const exportBank = () =>
            JSON.stringify(
                {
                    version: 1,
                    cycle: bank.cycle,
                    items: bank.items.map(({ text, tag, favorite }) => ({ text, tag, favorite })),
                },
                null,
                2
            );

        return { bank, next, nextBatch, markUsed, add, update, remove, toggleFavorite, reset, replace, exportBank };
    }, [bank]);

    return api;
}
