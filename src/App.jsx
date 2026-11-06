import { useState, useRef } from 'react';
import { toBlob } from 'html-to-image';
import { ImageUploader } from './components/ImageUploader';
import { FramingControls } from './components/FramingControls';
import { TemplateSelector } from './components/TemplateSelector';
import { TextEditor } from './components/TextEditor';
import { PhraseController } from './components/PhraseController';
import { TextControls } from './components/TextControls';
import { CanvasPreview } from './components/CanvasPreview';
import { ResultModal } from './components/ResultModal';

const DEFAULT_CROP = { zoom: 1, x: 0, y: 0 };

// y: % desde abajo en fotos grupales, % desde arriba en el aviso
// size: 10 = 1 % del ancho de la imagen
const DEFAULT_LAYOUTS = {
  vertical: { y: 25, size: 38 },
  horizontal: { y: 35, size: 38 },
  cuadrada: { y: 22, size: 38 },
  cartel: { y: 45, size: 44 },
};

function Section({ step, title, children }) {
  return (
    <section className="bg-zinc-900 p-4 rounded-xl border border-amber-500/30 shadow-xl">
      <h2 className="text-sm font-semibold text-amber-200/90 mb-3">
        {step}. {title}
      </h2>
      {children}
    </section>
  );
}

export default function App() {
  const [image, setImage] = useState(null); // { url, width, height }
  const [template, setTemplate] = useState('vertical');
  const [text, setText] = useState('');
  const [motivationalText, setMotivationalText] = useState('');
  const [crop, setCrop] = useState(DEFAULT_CROP);
  const [layouts, setLayouts] = useState(DEFAULT_LAYOUTS);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { file, url }
  const previewRef = useRef(null);

  const isGroup = template !== 'cartel';
  const layout = layouts[template];
  const steps = isGroup
    ? { photo: 2, content: 3, adjust: 4, exp: 5 }
    : { content: 2, adjust: 3, exp: 4 };

  const updateLayout = (patch) =>
    setLayouts((prev) => ({ ...prev, [template]: { ...prev[template], ...patch } }));
  const resetLayout = () =>
    setLayouts((prev) => ({ ...prev, [template]: DEFAULT_LAYOUTS[template] }));

  const handleImageUpload = (imageData, autoTemplate) => {
    if (image?.url) URL.revokeObjectURL(image.url);
    setImage(imageData);
    setCrop(DEFAULT_CROP);
    if (autoTemplate) setTemplate(autoTemplate);
  };

  const renderImage = async () => {
    const node = previewRef.current;
    const options = { cacheBust: true, pixelRatio: 1080 / node.offsetWidth };
    // Safari a veces sale en blanco en el primer render: el primero "calienta"
    await toBlob(node, options);
    return toBlob(node, options);
  };

  const handleGenerate = async () => {
    if (busy || !previewRef.current) return;
    setBusy(true);
    try {
      const blob = await renderImage();
      if (!blob) throw new Error('No se generó la imagen');
      const file = new File([blob], `hannyastudio-${Date.now()}.png`, { type: 'image/png' });
      setResult({ file, url: URL.createObjectURL(blob) });
    } catch (err) {
      console.error(err);
      alert('No se pudo generar la imagen. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const closeResult = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-black text-amber-100 flex flex-col p-4 md:p-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <header className="mb-3 md:mb-6 text-center flex flex-col items-center justify-center">
        <img
          src="/logo.png"
          alt="Hannya Logo"
          className="w-12 h-12 md:w-16 md:h-16 object-contain mb-1 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
        />
        <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-amber-400">HANNYASTUDIO</h1>
        <p className="text-sm text-amber-200/70">Generador de imágenes para Jiu Jitsu</p>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
        {/* Vista previa: fija arriba en celular, a la derecha en PC */}
        <div className="order-first md:order-last sticky top-0 z-30 bg-black py-2 md:top-4 md:bg-transparent md:py-0">
          <CanvasPreview
            image={image}
            template={template}
            text={text}
            motivationalText={motivationalText}
            layout={layout}
            crop={crop}
            onCropChange={setCrop}
            previewRef={previewRef}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Section step={1} title="Formato">
            <TemplateSelector selectedTemplate={template} onSelectTemplate={setTemplate} />
          </Section>

          {isGroup && (
            <Section step={steps.photo} title="Foto">
              <ImageUploader hasImage={!!image} onImageUpload={handleImageUpload} />
              {image && <FramingControls crop={crop} onChange={setCrop} onReset={() => setCrop(DEFAULT_CROP)} />}
            </Section>
          )}

          {/* El banco de frases siempre montado para no reiniciar el "sin repetir" */}
          <div className={isGroup ? '' : 'hidden'}>
            <Section step={steps.content} title="Frase motivadora">
              <PhraseController onPhraseChange={setMotivationalText} />
            </Section>
          </div>

          {!isGroup && (
            <Section step={steps.content} title="Texto del aviso">
              <TextEditor text={text} onTextChange={setText} />
            </Section>
          )}

          <Section step={steps.adjust} title="Ajustes del texto">
            <TextControls
              layout={layout}
              anchor={isGroup ? 'bottom' : 'top'}
              onChange={updateLayout}
              onReset={resetLayout}
            />
          </Section>

          <Section step={steps.exp} title="Exportar">
            <button
              onClick={handleGenerate}
              disabled={busy}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-black font-bold rounded-xl shadow-lg transition-all cursor-pointer tracking-wide"
            >
              {busy ? 'Generando...' : 'Generar imagen'}
            </button>
            <p className="text-[11px] text-amber-200/60 text-center mt-2">Salida en 1080 x 1920 px</p>
          </Section>
        </div>
      </main>

      {result && <ResultModal result={result} onClose={closeResult} />}
    </div>
  );
}