// TextEditor.jsx
export function TextEditor({ text, onTextChange }) {
    return (
        <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Escribe el mensaje del aviso aquí..."
            rows="4"
            className="w-full p-3 bg-zinc-950 border border-amber-500/30 rounded-lg text-amber-100 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
        />
    );
}