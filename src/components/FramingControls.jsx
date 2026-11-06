import { MAX_ZOOM } from './CanvasPreview';

const stepBtn =
    'w-10 h-10 shrink-0 rounded-lg bg-zinc-800 border border-amber-500/40 text-amber-400 text-lg font-bold cursor-pointer active:bg-zinc-700';

export function FramingControls({ crop, onChange, onReset }) {
    const setZoom = (z) => onChange({ ...crop, zoom: Math.min(MAX_ZOOM, Math.max(1, z)) });

    return (
        <div className="mt-4 space-y-3">
            <div>
                <div className="flex justify-between text-xs text-amber-200/80 mb-1">
                    <span>Zoom</span>
                    <span>{crop.zoom.toFixed(1)}x</span>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" className={stepBtn} onClick={() => setZoom(crop.zoom - 0.1)}>−</button>
                    <input
                        type="range"
                        min="1"
                        max={MAX_ZOOM}
                        step="0.05"
                        value={crop.zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="flex-1 accent-amber-500"
                    />
                    <button type="button" className={stepBtn} onClick={() => setZoom(crop.zoom + 0.1)}>+</button>
                </div>
            </div>
            <button
                type="button"
                onClick={onReset}
                className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-200 text-xs font-semibold border border-amber-500/30 cursor-pointer"
            >
                Centrar encuadre
            </button>
        </div>
    );
}