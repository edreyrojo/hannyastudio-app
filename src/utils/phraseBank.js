import { MOTIVATIONAL_PHRASES } from './phrases';

export const ALL_TAGS = 'all';

export const TAGS = [
    { id: 'general', label: 'General' },
    { id: 'disciplina', label: 'Disciplina' },
    { id: 'tecnica', label: 'Técnica' },
    { id: 'competencia', label: 'Competencia' },
    { id: 'mente', label: 'Mente' },
    { id: 'defensa', label: 'Defensa personal' },
];

export function tagLabel(id) {
    return TAGS.find((tag) => tag.id === id)?.label ?? 'General';
}

export function deaccent(text) {
    return String(text ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

const RULES = [
    ['competencia', /compet|campe|combate|rival|victoria|pelear|torneo|medalla/],
    ['defensa', /defensa|proteg|seguridad|calle/],
    [
        'tecnica',
        /tecnic|guardia|llave|sumision|transicion|movimiento|agarre|escape|posicion|equilibrio|fluye|fluir|suavidad|arte|ajedrez/,
    ],
    [
        'disciplina',
        /disciplin|constancia|entrena|sudor|trabajo|paciencia|proceso|clase|grado|cinturon|rutina|esfuerzo/,
    ],
    [
        'mente',
        /mente|miedo|calma|respir|enfoque|concentr|confianza|humildad|actitud|caracter|emocion|resiliencia|valor|voluntad/,
    ],
];

export function guessTag(text) {
    const clean = deaccent(text);
    const found = RULES.find(([, pattern]) => pattern.test(clean));
    return found ? found[0] : 'general';
}

export function createSeedBank() {
    return {
        cycle: 0,
        items: MOTIVATIONAL_PHRASES.map((text, index) => ({
            id: `seed-${index}`,
            text,
            tag: guessTag(text),
            favorite: false,
            lastCycle: -1,
            createdAt: 0,
        })),
    };
}

const isKnownTag = (id) => TAGS.some((tag) => tag.id === id);

// Acepta datos de localStorage o de un JSON importado y devuelve null si no
// hay nada aprovechable.
export function normalizeBank(raw) {
    if (!raw || !Array.isArray(raw.items) || raw.items.length === 0) return null;

    const seen = new Set();
    const items = [];

    raw.items.forEach((item, index) => {
        if (!item || typeof item.text !== 'string') return;
        const text = item.text.trim();
        if (!text) return;

        const id = typeof item.id === 'string' && item.id ? item.id : `imp-${Date.now()}-${index}`;
        if (seen.has(id)) return;
        seen.add(id);

        items.push({
            id,
            text,
            tag: isKnownTag(item.tag) ? item.tag : guessTag(text),
            favorite: Boolean(item.favorite),
            lastCycle: Number.isFinite(item.lastCycle) ? item.lastCycle : -1,
            createdAt: Number(item.createdAt) || 0,
        });
    });

    if (!items.length) return null;

    return {
        cycle: Number.isFinite(raw.cycle) ? Math.max(0, Math.floor(raw.cycle)) : 0,
        items,
    };
}

export function poolFor(bank, tag) {
    if (!tag || tag === ALL_TAGS) return bank.items;
    return bank.items.filter((item) => item.tag === tag);
}

export function remainingCount(bank, tag) {
    return poolFor(bank, tag).filter((item) => item.lastCycle < bank.cycle).length;
}

// Elige una frase que no se haya usado en el ciclo actual. Cuando el ciclo se
// agota, sube el contador y todo vuelve a estar disponible. Así el "sin
// repetir" sobrevive a recargas sin guardar una lista de usadas.
export function pickPhrase(bank, tag) {
    const pool = poolFor(bank, tag);
    if (!pool.length) return { bank, phrase: null };

    let cycle = bank.cycle;
    let fresh = pool.filter((item) => item.lastCycle < cycle);

    if (!fresh.length) {
        cycle += 1;
        fresh = pool;
    }

    const chosen = fresh[Math.floor(Math.random() * fresh.length)];

    return {
        bank: {
            ...bank,
            cycle,
            items: bank.items.map((item) =>
                item.id === chosen.id ? { ...item, lastCycle: cycle } : item
            ),
        },
        phrase: chosen,
    };
}
