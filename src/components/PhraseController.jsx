import { useState, useEffect } from 'react';
import { MOTIVATIONAL_PHRASES } from '../utils/phrases';

export function PhraseController({ onPhraseChange }) {
    const [availablePhrases, setAvailablePhrases] = useState([]);
    const [exhausted, setExhausted] = useState(false);

    useEffect(() => {
        // Inicializamos barajando las frases de forma aleatoria
        const shuffled = [...MOTIVATIONAL_PHRASES].sort(() => Math.random() - 0.5);
        setAvailablePhrases(shuffled);
        if (shuffled.length > 0) {
            onPhraseChange(shuffled[0]);
        }
    }, []);

    const handleNextPhrase = () => {
        if (availablePhrases.length > 1) {
            // Tomamos la siguiente, la removemos permanentemente de las disponibles
            const remaining = availablePhrases.slice(1);
            setAvailablePhrases(remaining);
            onPhraseChange(remaining[0]);
        } else {
            setAvailablePhrases([]);
            setExhausted(true);
            onPhraseChange("¡Banco de frases agotado! Recargue el archivo phrases.js, jefe.");
        }
    };

    const handleResetBank = () => {
        const shuffled = [...MOTIVATIONAL_PHRASES].sort(() => Math.random() - 0.5);
        setAvailablePhrases(shuffled);
        setExhausted(false);
        onPhraseChange(shuffled[0]);
    };

    return (
        <div>
            <div className="flex justify-end mb-2">
                <span className="text-xs text-amber-500/70">
                    Disponibles: {availablePhrases.length} / {MOTIVATIONAL_PHRASES.length}
                </span>
            </div>

            {!exhausted ? (
                <button
                    onClick={handleNextPhrase}
                    className="w-full py-3 mb-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-semibold rounded-lg border border-amber-500/50 transition-all text-sm cursor-pointer"
                >
                    Siguiente frase (sin repetir)
                </button>
            ) : (
                <button
                    onClick={handleResetBank}
                    className="w-full py-3 mb-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-all text-sm cursor-pointer"
                >
                    Reiniciar banco de frases
                </button>
            )}

            {availablePhrases.length <= 5 && !exhausted && (
                <p className="text-xs text-amber-400 mt-2 text-center">
                    Quedan pocas frases en el banco, jefe.
                </p>
            )}

            {exhausted && (
                <p className="text-xs text-red-500 mt-2 text-center font-bold">
                    Banco agotado por completo. Es hora de actualizar las frases, jefe.
                </p>
            )}
        </div>
    );
}