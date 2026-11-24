// Miniatura JPEG para el historial. Nunca debe romper el guardado: si falla,
// quien llama se queda con la imagen completa.
export async function makeThumbnail(blob, maxWidth = 360) {
    if (typeof createImageBitmap !== 'function') return null;

    const bitmap = await createImageBitmap(blob);
    try {
        const scale = Math.min(1, maxWidth / bitmap.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));

        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        return await new Promise((resolve) => {
            canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.7);
        });
    } finally {
        bitmap.close?.();
    }
}
