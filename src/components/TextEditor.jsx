export function TextEditor({ text, onTextChange }) {
    return (
        <div className="w-full bg-black-800 p-4 rounded-xl shadow-md border border-amber-700 mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
                3. Escribe el texto del aviso:
            </label>
            <textarea
                value={text}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Escribe el mensaje del cartel aquí..."
                rows="3"
                className="w-full p-3 bg-amber-900 border border-amber-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
        </div>
    );
}