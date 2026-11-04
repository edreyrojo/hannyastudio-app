const cache = {};

export async function findHole(src) {
    if (cache[src]) return cache[src];

    const img = new Image();
    img.src = src;
    await img.decode();

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, w, h);

    const isHole = (x, y) => data[(y * w + x) * 4 + 3] < 20;

    // Buscar un pixel transparente en la columna central, desde el centro hacia afuera
    const cx = Math.floor(w / 2);
    let seed = null;
    for (let d = 0; d < h / 2 && !seed; d++) {
        for (const y of [Math.floor(h / 2) + d, Math.floor(h / 2) - d]) {
            if (y >= 0 && y < h && isHole(cx, y)) { seed = [cx, y]; break; }
        }
    }
    if (!seed) return null;

    // Flood fill desde la semilla: solo la región transparente conectada
    const visited = new Uint8Array(w * h);
    const stack = [seed[0], seed[1]];
    let minX = w, minY = h, maxX = 0, maxY = 0;

    while (stack.length) {
        const y = stack.pop();
        const x = stack.pop();
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const i = y * w + x;
        if (visited[i] || !isHole(x, y)) continue;
        visited[i] = 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
    }

    const result = {
        left: (minX / w) * 100,
        top: (minY / h) * 100,
        width: ((maxX - minX + 1) / w) * 100,
        height: ((maxY - minY + 1) / h) * 100,
    };
    cache[src] = result;
    return result;
}