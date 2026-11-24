// Almacenamiento local. Ajustes y frases en localStorage; borrador e
// historial de imágenes en IndexedDB (las fotos no caben en localStorage).

const PREFIX = 'hannya.';

export const MAX_HISTORY = 24;

export function loadJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(PREFIX + key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

export function saveJSON(key, value) {
    try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

const DB_NAME = 'hannyastudio';
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB no está disponible'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('draft')) {
                db.createObjectStore('draft', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('history')) {
                db.createObjectStore('history', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('files')) {
                db.createObjectStore('files', { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    return dbPromise;
}

async function run(store, mode, action) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const request = action(tx.objectStore(store));
        let value;

        if (request) request.onsuccess = () => { value = request.result; };
        tx.oncomplete = () => resolve(value);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

export const idb = {
    get: (store, key) => run(store, 'readonly', (os) => os.get(key)),
    getAll: (store) => run(store, 'readonly', (os) => os.getAll()),
    put: (store, value) => run(store, 'readwrite', (os) => os.put(value)),
    remove: (store, key) => run(store, 'readwrite', (os) => os.delete(key)),
    clear: (store) => run(store, 'readwrite', (os) => os.clear()),
};

// ---- Borrador de trabajo ----
// La foto se guarda aparte del resto para no reescribir un megabyte cada vez
// que se escribe una letra.

export async function loadDraft() {
    const [photo, meta] = await Promise.all([
        idb.get('draft', 'photo').catch(() => null),
        idb.get('draft', 'meta').catch(() => null),
    ]);
    return { photo, meta };
}

export function saveDraftPhoto(blob, width, height) {
    return idb
        .put('draft', { id: 'photo', blob, width, height, updatedAt: Date.now() })
        .catch(() => null);
}

export function saveDraftMeta(meta) {
    return idb.put('draft', { ...meta, id: 'meta', updatedAt: Date.now() }).catch(() => null);
}

// ---- Historial ----
// La imagen completa y la miniatura viven en almacenes distintos para que la
// galería no tenga que cargar todos los PNG completos en memoria.

export async function addHistory(entry, blob) {
    await idb.put('history', entry);
    await idb.put('files', { id: entry.id, blob });

    const all = await idb.getAll('history');
    if (all.length > MAX_HISTORY) {
        const oldest = all
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(0, all.length - MAX_HISTORY);

        for (const item of oldest) {
            await idb.remove('history', item.id);
            await idb.remove('files', item.id);
        }
    }
}

export function listHistory() {
    return idb.getAll('history').catch(() => []);
}

export function getHistoryBlob(id) {
    return idb.get('files', id).then((row) => row?.blob ?? null);
}

export async function deleteHistory(id) {
    await idb.remove('history', id);
    await idb.remove('files', id);
}

export async function clearHistory() {
    await idb.clear('history');
    await idb.clear('files');
}

// ---- Utilidades de archivo ----

export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}
