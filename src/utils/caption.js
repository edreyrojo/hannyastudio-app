// Pie de foto para redes: la frase de la imagen más los hashtags de la academia.

export const DEFAULT_HASHTAGS =
    '#jiujitsu #bjj #hannyaacademy #tatami #jiujitsubrasileno #disciplina #artesuave';

export function buildCaption(phrase, hashtags) {
    const cleanPhrase = String(phrase ?? '').trim();
    const cleanTags = String(hashtags ?? '').trim();
    return [cleanPhrase, cleanTags].filter(Boolean).join('\n\n');
}

// Copia con respaldo para iOS, donde el portapapeles falla si la app no está
// en primer plano o si el gesto se pierde.
export async function copyText(text) {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        // sigue con el método clásico
    }

    try {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.top = '-1000px';
        area.style.opacity = '0';
        document.body.appendChild(area);

        area.focus();
        area.select();
        area.setSelectionRange(0, area.value.length);

        const ok = document.execCommand('copy');
        area.remove();
        return ok;
    } catch {
        return false;
    }
}
