const stepBtn =
    'w-10 h-10 shrink-0 rounded-lg bg-zinc-800 border border-amber-500/40 text-amber-400 text-lg font-bold cursor-pointer active:bg-zinc-700';

function Row({ label, value, min, max, step, onChange }) {
    const set = (v) => onChange(Math.min(max, Math.max(min, v)));
    return (
        <div>
            <div className="flex justify-between text-xs text-amber-200/80 mb-1">
                <span>{label}</span>
                <span>{Number(value.toFixed(1))}</span>
            </div>
            <div className="flex items-center gap-2">
                <button type="button" className={stepBtn} onClick={() => set(value - step)}>−</button>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => set(parseFloat(e.target.value))}
                    className="flex-1 accent-amber-500"
                />
                <button type="button" className={stepBtn} onClick={() => set(value + step)}>+</button>
            </div>
        </div>
    );
}

// anchor: 'bottom' (fotos grupales) o 'top' (aviso). Siempre "más = más arriba" en pantalla.
export function TextControls({ layout, anchor, onChange, onReset }) {
    const height = anchor === 'top' ? 100 - layout.y : layout.y;

    return (
        <div className="space-y-4">
            <Row
                label="Altura del texto"
                value={height}
                min={0}
                max={95}
                step={0.5}
                onChange={(v) => onChange({ y: anchor === 'top' ? 100 - v : v })}
            />
            <Row
                label="Tamaño de letra"
                value={layout.size}
                min={20}
                max={90}
                step={1}
                onChange={(v) => onChange({ size: v })}
            />
            <button
                type="button"
                onClick={onReset}
                className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-200 text-xs font-semibold border border-amber-500/30 cursor-pointer"
            >
                Restablecer texto
            </button>
        </div>
    );
}