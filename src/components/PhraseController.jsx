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
        <div className="w-full bg-zinc-900 p-4 rounded-xl border border-amber-500/30 shadow-xl">
            <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-amber-200/80">
                    3. Enfoque del Mes:
                </label>
                <span className="text-xs text-amber-500/70">
                    Disponibles: {availablePhrases.length} / {MOTIVATIONAL_PHRASES.length}
                </span>
            </div>

            {!exhausted ? (
                <button
                    onClick={handleNextPhrase}
                    className="w-full py-2 mb-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-semibold rounded-lg border border-amber-500/50 transition-all text-sm cursor-pointer"
                >
                    Siguiente Frase (Sin repetir)
                </button>
            ) : (
                <button
                    onClick={handleResetBank}
                    className="w-full py-2 mb-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-all text-sm cursor-pointer"
                >
                    Reiniciar / Recargar Banco
                </button>
            )}

            {availablePhrases.length <= 5 && !exhausted && (
                <p className="text-xs text-amber-400 mt-2 text-center">
                    Atención: Quedan pocas frases en el banco, jefe.
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