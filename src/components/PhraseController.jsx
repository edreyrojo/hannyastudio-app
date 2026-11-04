import { useState, useEffect } from 'react';
import { MOTIVATIONAL_PHRASES } from '../utils/phrases';

export function PhraseController({ onPhraseChange }) {
    const [availablePhrases, setAvailablePhrases] = useState([]);
    const [usedPhrases, setUsedPhrases] = useState(0);

    // Inicializar el banco de frases al montar el componente
    useEffect(() => {
        // Barajamos las frases inicialmente para que salgan en orden aleatorio
        const shuffled = [...MOTIVATIONAL_PHRASES].sort(() => Math.random() - 0.5);
        setAvailablePhrases(shuffled);
        if (shuffled.length > 0) {
            onPhraseChange(shuffled[0]); // Asigna la primera frase automáticamente
        }
    }, []);

    const handleNextPhrase = () => {
        if (availablePhrases.length > 1) {
            // Tomamos la siguiente frase y la quitamos de las disponibles
            const nextPhrase = availablePhrases[1];
            const remaining = availablePhrases.slice(1);
            setAvailablePhrases(remaining);
            setUsedPhrases(usedPhrases + 1);
            onPhraseChange(nextPhrase);
        } else {
            // Si se acaban, reiniciamos el ciclo automáticamente y barajamos de nuevo
            const shuffled = [...MOTIVATIONAL_PHRASES].sort(() => Math.random() - 0.5);
            setAvailablePhrases(shuffled);
            setUsedPhrases(0);
            onPhraseChange(shuffled[0]);
        }
    };

    return (
        <div className="w-full bg-zinc-900 p-4 rounded-xl border border-amber-500/30 shadow-xl">
            <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-amber-200/80">
                    3. Enfoque del Mes:
                </label>
                <span className="text-xs text-amber-500/70">
                    {availablePhrases.length} frases restantes
                </span>
            </div>

            <button
                onClick={handleNextPhrase}
                className="w-full py-2 mb-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-semibold rounded-lg border border-amber-500/50 transition-all text-sm"
            >
                Aleatorizar Frase
            </button>

            {/* Alerta de recarga cuando quedan pocas frases (ej. menos de 5) */}
            {availablePhrases.length <= 5 && (
                <p className="text-xs text-red-400 mt-2 text-center animate-pulse">
                    ⚠️ Quedan pocas frases. ¡Avisa al jefe para recargar el banco!
                </p>
            )}
        </div>
    );
}