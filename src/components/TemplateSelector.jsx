export function TemplateSelector({ selectedTemplate, onSelectTemplate }) {
    const templates = [
        { id: 'horizontal', name: 'Grupal Horizontal' },
        { id: 'vertical', name: 'Grupal Vertical' },
        { id: 'cuadrada', name: 'Grupal Cuadrada' },
        { id: 'cartel', name: 'Avisos' },
    ];

    return (
        <div className="w-full bg-black-800 p-4 rounded-xl shadow-md border border-amber-700 mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
                2. Selecciona el formato de plantilla:
            </label>
            <div className="grid grid-cols-2 gap-2">
                {templates.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => onSelectTemplate(t.id)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${selectedTemplate === t.id
                                ? 'bg-amber-500 text-white shadow-lg'
                                : 'bg-amber-600 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        {t.name}
                    </button>
                ))}
            </div>
        </div>
    );
}