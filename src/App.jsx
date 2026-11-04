import { useState, useRef } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { TemplateSelector } from './components/TemplateSelector';
import { TextEditor } from './components/TextEditor';
import { CanvasPreview } from './components/CanvasPreview';
import { PhraseController } from './components/PhraseController'; // Nuevo import
import { toPng } from 'html-to-image';

export default function App() {
  const [image, setImage] = useState(null);
  const [template, setTemplate] = useState('vertical');
  const [text, setText] = useState('');
  const [motivationalText, setMotivationalText] = useState(''); // Nuevo estado para la frase
  const previewRef = useRef(null);

  const handleImageUpload = (imageUrl, autoTemplate) => {
    setImage(imageUrl);
    if (autoTemplate) {
      setTemplate(autoTemplate);
    }
  };

  const handleDownload = () => {
    const node = previewRef.current;
    if (!node) return;

    const pixelRatio = 1080 / node.offsetWidth;

    toPng(node, { cacheBust: true, pixelRatio })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'hannyastudio-imagen.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => console.error('Error al generar la imagen', err));
  };

  return (
    <div className="min-h-screen bg-black text-amber-100 flex flex-col p-4 md:p-8">
      <header className="mb-6 text-center flex flex-col items-center justify-center">
        <img
          src="/logo.png"
          alt="Hannya Logo"
          className="w-16 h-16 object-contain mb-2 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
        />
        <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-amber-400">HANNYASTUDIO</h1>
        <p className="text-sm text-amber-200/70">Generador de imágenes para Jiu Jitsu</p>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col space-y-4">
          <div className="bg-zinc-900 p-4 rounded-xl border border-amber-500/30 shadow-xl">
            <ImageUploader onImageUpload={handleImageUpload} />
          </div>

          <div className="bg-zinc-900 p-4 rounded-xl border border-amber-500/30 shadow-xl">
            <TemplateSelector selectedTemplate={template} onSelectTemplate={setTemplate} />
          </div>

          {/* Control condicional: TextEditor para avisos, PhraseController para fotos grupales */}
          {template === 'cartel' ? (
            <div className="bg-zinc-900 p-4 rounded-xl border border-amber-500/30 shadow-xl">
              <TextEditor text={text} onTextChange={setText} />
            </div>
          ) : (
            <PhraseController onPhraseChange={setMotivationalText} />
          )}

          <button
            onClick={handleDownload}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl shadow-lg transition-all cursor-pointer tracking-wide"
          >
            Descargar Imagen
          </button>
        </div>

        {/* Pasamos el texto motivacional al CanvasPreview */}
        <CanvasPreview
          image={image}
          template={template}
          text={text}
          motivationalText={motivationalText} 
          previewRef={previewRef}
        />
      </main>
    </div>
  );
}