import { Modal } from './Modal';
import { TEXT } from '../utils/textLayout';

export function SettingsModal({ settings, onChange, onClose }) {
    const update = (patch) => onChange({ ...settings, ...patch });

    return (
        <Modal
            title="Ajustes"
            subtitle="Se guardan en este teléfono"
            onClose={onClose}
            footer={
                <button
                    type="button"
                    onClick={() => onChange({ accentText: TEXT.accentText, showAccent: true })}
                    className="w-full py-2 rounded-lg bg-zinc-900 text-amber-500/70 text-[10px] border border-amber-500/15 cursor-pointer"
                >
                    Restablecer ajustes
                </button>
            }
        >
            <div className="space-y-5">
                <div>
                    <label htmlFor="accent-text" className="block text-[11px] text-amber-200/80 mb-1">
                        Línea de acento
                    </label>
                    <p className="text-[10px] text-amber-500/60 mb-2">
                        Es el texto dorado que aparece debajo de cada frase.
                    </p>
                    <input
                        id="accent-text"
                        type="text"
                        value={settings.accentText}
                        maxLength={40}
                        onChange={(event) => update({ accentText: event.target.value })}
                        className="w-full p-2.5 bg-zinc-950 border border-amber-500/30 rounded-lg text-amber-100 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder={TEXT.accentText}
                    />
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.showAccent}
                            onChange={(event) => update({ showAccent: event.target.checked })}
                            className="w-4 h-4 accent-amber-500"
                        />
                        <span className="text-[11px] text-amber-200/80">Mostrar línea de acento</span>
                    </label>
                </div>

                <div className="rounded-lg border border-amber-500/15 bg-zinc-900/40 p-3">
                    <p className="text-[10px] text-amber-200/60 leading-relaxed">
                        El teléfono, la sede y el Instagram del aviso están grabados dentro de la
                        plantilla. Para cambiarlos hace falta un arte nuevo del cartel.
                    </p>
                </div>

                <div className="rounded-lg border border-amber-500/15 bg-zinc-900/40 p-3">
                    <p className="text-[10px] text-amber-200/60 leading-relaxed">
                        El borrador, las frases y el historial se guardan únicamente en este
                        dispositivo. Si borras los datos del sitio, se pierden.
                    </p>
                </div>
            </div>
        </Modal>
    );
}
