// TemplateSelector.jsx
export function TemplateSelector({ selectedTemplate, onSelectTemplate }) {
    const templates = [
        { id: 'horizontal', name: 'Grupal horizontal' },
        { id: 'vertical', name: 'Grupal vertical' },
        { id: 'cuadrada', name: 'Grupal cuadrada' },
        { id: 'cartel', name: 'Aviso' },
    ];

    return (
        <div className="grid grid-cols-2 gap-2">
            {templates.map((t) => (
                <button
                    key={t.id}
                    onClick={() => onSelectTemplate(t.id)}
                    className={`py-3 px-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                        selectedTemplate === t.id
                            ? 'bg-amber-500 text-black shadow-lg'
                            : 'bg-zinc-800 text-amber-200 border border-amber-500/30 hover:bg-zinc-700'
                    }`}
                >
                    {t.name}
                </button>
            ))}
        </div>
    );
}