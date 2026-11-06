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