import { useEffect, useMemo, useRef, useState } from 'react';
import { renderToBlob } from './utils/exportImage';
import { ImageUploader } from './components/ImageUploader';
import { FramingControls } from './components/FramingControls';
import { TemplateSelector } from './components/TemplateSelector';
import { TextEditor } from './components/TextEditor';
import { PhraseController } from './components/PhraseController';
import { TextControls } from './components/TextControls';
import { CanvasPreview } from './components/CanvasPreview';
import { ResultModal } from './components/ResultModal';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { BatchModal } from './components/BatchModal';
import { PhotoStrip } from './components/PhotoStrip';
import { usePhraseBank } from './hooks/usePhraseBank';
import { ALL_TAGS, poolFor } from './utils/phraseBank';
import { DEFAULT_HASHTAGS, buildCaption } from './utils/caption';
import { TEXT } from './utils/textLayout';
import {
  addHistory,
  addPhoto,
  deletePhoto,
  getPhotoBlob,
  listHistory,
  listPhotos,
  loadDraft,
  loadJSON,
  saveDraftMeta,
  saveDraftPhoto,
  saveJSON,
} from './utils/storage';
import { makeThumbnail } from './utils/thumbnail';

const DEFAULT_CROP = { zoom: 1, x: 0, y: 0 };

const DEFAULT_LAYOUTS = {
  vertical: { y: 25, size: 38 },
  horizontal: { y: 35, size: 38 },
  cuadrada: { y: 22, size: 38 },
  cartel: { y: 45, size: 44 },
};

const DEFAULT_SETTINGS = {
  accentText: TEXT.accentText,
  showAccent: true,
  hashtags: DEFAULT_HASHTAGS,
};

const BATCH_OPTIONS = [3, 5, 7];

function newId() {
  return globalThis.crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function fileName() {
  return `hannyastudio-${Date.now()}.png`;
}

function cleanSettings(raw) {
  return {
    accentText:
      typeof raw?.accentText === 'string' ? raw.accentText : DEFAULT_SETTINGS.accentText,
    showAccent: typeof raw?.showAccent === 'boolean' ? raw.showAccent : true,
    hashtags: typeof raw?.hashtags === 'string' ? raw.hashtags : DEFAULT_SETTINGS.hashtags,
  };
}

function cleanLayouts(raw) {
  const next = { ...DEFAULT_LAYOUTS };
  if (!raw || typeof raw !== 'object') return next;

  for (const key of Object.keys(DEFAULT_LAYOUTS)) {
    const item = raw[key];
    if (item && Number.isFinite(item.y) && Number.isFinite(item.size)) {
      next[key] = { y: item.y, size: item.size };
    }
  }
  return next;
}

function cleanCrop(raw) {
  if (!raw || !Number.isFinite(raw.zoom)) return DEFAULT_CROP;
  return { zoom: raw.zoom, x: Number(raw.x) || 0, y: Number(raw.y) || 0 };
}

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
  const bankApi = usePhraseBank();

  const [image, setImage] = useState(null);
  const [template, setTemplate] = useState('vertical');
  const [text, setText] = useState('');
  const [motivationalText, setMotivationalText] = useState('');
  const [phraseTag, setPhraseTag] = useState(ALL_TAGS);
  const [crop, setCrop] = useState(DEFAULT_CROP);
  const [layouts, setLayouts] = useState(DEFAULT_LAYOUTS);
  const [settings, setSettings] = useState(() => cleanSettings(loadJSON('settings.v1', null)));
  const [photos, setPhotos] = useState([]);
  const [currentPhotoId, setCurrentPhotoId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [resultBusy, setResultBusy] = useState(false);
  const [resultError, setResultError] = useState('');
  const [notice, setNotice] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [batchCount, setBatchCount] = useState(5);
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const [batchItems, setBatchItems] = useState(null);
  const previewRef = useRef(null);

  const isGroup = template !== 'cartel';
  const layout = layouts[template];
  const steps = isGroup
    ? { photo: 2, content: 3, adjust: 4, exp: 5 }
    : { content: 2, adjust: 3, exp: 4 };

  const accent = useMemo(
    () => ({ text: settings.accentText, show: settings.showAccent }),
    [settings.accentText, settings.showAccent]
  );

  // ---- Restaurar el borrador guardado ----
  useEffect(() => {
    let cancelled = false;

    loadDraft()
      .then(({ photo, meta }) => {
        if (cancelled) return;

        if (meta) {
          if (DEFAULT_LAYOUTS[meta.template]) setTemplate(meta.template);
          if (typeof meta.text === 'string') setText(meta.text);
          if (typeof meta.phrase === 'string') setMotivationalText(meta.phrase);
          if (typeof meta.photoId === 'string') setCurrentPhotoId(meta.photoId);
          setCrop(cleanCrop(meta.crop));
          setLayouts(cleanLayouts(meta.layouts));
        }

        if (photo?.blob) {
          setImage({
            url: URL.createObjectURL(photo.blob),
            blob: photo.blob,
            width: photo.width || 0,
            height: photo.height || 0,
          });
        }

        setHydrated(true);
      })
      .catch(() => setHydrated(true));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    saveJSON('settings.v1', settings);
  }, [settings]);

  // ---- Guardado automático ----
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      saveDraftMeta({
        template,
        text,
        phrase: motivationalText,
        crop,
        layouts,
        photoId: currentPhotoId,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [hydrated, template, text, motivationalText, crop, layouts, currentPhotoId]);

  useEffect(() => {
    if (!hydrated || !image?.blob) return;
    saveDraftPhoto(image.blob, image.width, image.height);
  }, [hydrated, image]);

  useEffect(() => {
    listHistory()
      .then((list) => setHistoryCount(list.length))
      .catch(() => {});
    listPhotos()
      .then(setPhotos)
      .catch(() => {});
  }, []);

  const missingPhoto = isGroup && !image;
  const missingPhrase = isGroup && !motivationalText.trim();
  const missingText = !isGroup && !text.trim();
  const canGenerate = !busy && !batchBusy && !missingPhoto && !missingPhrase && !missingText;
  const blockReason = missingPhoto
    ? 'Falta la foto para el formato grupal.'
    : missingPhrase
      ? 'Falta la frase motivadora.'
      : missingText
        ? 'Falta el texto del aviso.'
        : '';

  const poolSize = poolFor(bankApi.bank, phraseTag).length;
  const effectiveBatch = Math.min(batchCount, poolSize);
  const caption = result ? buildCaption(result.phrase, settings.hashtags) : '';
  const captionFor = (phrase) => buildCaption(phrase, settings.hashtags);

  const updateLayout = (patch) =>
    setLayouts((prev) => ({ ...prev, [template]: { ...prev[template], ...patch } }));
  const resetLayout = () =>
    setLayouts((prev) => ({ ...prev, [template]: DEFAULT_LAYOUTS[template] }));

  const handleImageUpload = async (imageData, autoTemplate) => {
    if (image?.url) URL.revokeObjectURL(image.url);
    setImage(imageData);
    setCrop(DEFAULT_CROP);
    setNotice('');
    if (autoTemplate) setTemplate(autoTemplate);

    try {
      const thumb = await makeThumbnail(imageData.blob).catch(() => null);
      const saved = await addPhoto({
        id: newId(),
        createdAt: Date.now(),
        blob: imageData.blob,
        thumb,
        width: imageData.width,
        height: imageData.height,
        size: imageData.blob.size,
      });

      if (saved) {
        setCurrentPhotoId(saved.id);
        setPhotos(await listPhotos());
      }
    } catch (err) {
      console.warn('No se pudo guardar la foto en la biblioteca', err);
    }
  };

  const handleSelectPhoto = async (id) => {
    const blob = await getPhotoBlob(id);
    if (!blob) {
      setNotice('Esa foto ya no está disponible.');
      return;
    }

    const meta = photos.find((photo) => photo.id === id);
    if (image?.url) URL.revokeObjectURL(image.url);
    setImage({
      url: URL.createObjectURL(blob),
      blob,
      width: meta?.width || 0,
      height: meta?.height || 0,
    });
    setCurrentPhotoId(id);
    setCrop(DEFAULT_CROP);
    setNotice('');
  };

  const handleDeletePhoto = async (id) => {
    await deletePhoto(id);
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
    if (currentPhotoId === id) setCurrentPhotoId(null);
  };

  const generateBlob = (phrase) =>
    renderToBlob({
      template,
      image,
      crop,
      text,
      motivationalText: phrase,
      layout,
      accent,
    });

  const saveToHistory = (blob, phrase, resultId) => {
    (async () => {
      const thumb = await makeThumbnail(blob).catch(() => null);
      const entry = {
        id: newId(),
        createdAt: Date.now(),
        template,
        phrase,
        thumb,
      };
      await addHistory(entry, blob);
      const list = await listHistory();
      setHistoryCount(list.length);
      setResult((prev) => (prev && prev.id === resultId ? { ...prev, saved: true } : prev));
    })().catch((err) => console.warn('No se pudo guardar en el historial', err));
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setBusy(true);
    setNotice('');
    setResultError('');
    try {
      const phrase = (isGroup ? motivationalText : text).trim();
      const blob = await generateBlob(motivationalText);
      const id = newId();
      const file = new File([blob], fileName(), { type: 'image/png' });
      setResult({ id, file, url: URL.createObjectURL(blob), phrase, saved: false });
      saveToHistory(blob, phrase, id);
    } catch (err) {
      console.error(err);
      setNotice(err?.message || 'No se pudo generar la imagen.');
    } finally {
      setBusy(false);
    }
  };

  // Genera otra imagen con la siguiente frase sin salir del resultado.
  const handleNextPhrase = async () => {
    if (!isGroup || resultBusy) return;

    const picked = bankApi.next(phraseTag);
    if (!picked) {
      setResultError('No hay frases disponibles en el banco.');
      return;
    }

    setResultBusy(true);
    setResultError('');
    try {
      const blob = await generateBlob(picked.text);
      setMotivationalText(picked.text);

      const id = newId();
      const file = new File([blob], fileName(), { type: 'image/png' });
      const oldUrl = result?.url;
      setResult({ id, file, url: URL.createObjectURL(blob), phrase: picked.text, saved: false });
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      saveToHistory(blob, picked.text, id);
    } catch (err) {
      console.error(err);
      setResultError(err?.message || 'No se pudo generar la imagen.');
    } finally {
      setResultBusy(false);
    }
  };

  // Lote: una imagen por frase, con el mismo encuadre y formato.
  const handleBatch = async () => {
    if (!canGenerate) return;

    const picked = bankApi.nextBatch(batchCount, phraseTag);
    if (!picked.length) {
      setNotice('No hay frases disponibles para el lote.');
      return;
    }

    setBatchBusy(true);
    setNotice('');
    setBatchProgress({ done: 0, total: picked.length });
    const items = [];

    try {
      for (const phrase of picked) {
        const blob = await generateBlob(phrase.text);
        const file = new File([blob], fileName(), { type: 'image/png' });
        const id = newId();
        items.push({ id, blob, file, url: URL.createObjectURL(blob), phrase: phrase.text });
        saveToHistory(blob, phrase.text, id);
        setBatchProgress({ done: items.length, total: picked.length });
      }
      setBatchItems(items);
    } catch (err) {
      console.error(err);
      items.forEach((item) => URL.revokeObjectURL(item.url));
      setNotice(err?.message || 'No se pudo generar el lote.');
    } finally {
      setBatchBusy(false);
      setBatchProgress({ done: 0, total: 0 });
    }
  };

  const closeResult = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setResultError('');
  };

  const closeBatch = () => {
    batchItems?.forEach((item) => URL.revokeObjectURL(item.url));
    setBatchItems(null);
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

        <div className="mt-2 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="px-3 py-1.5 rounded-full bg-zinc-900 text-amber-300 text-[11px] font-semibold border border-amber-500/30 cursor-pointer"
          >
            Historial{historyCount > 0 ? ` · ${historyCount}` : ''}
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="px-3 py-1.5 rounded-full bg-zinc-900 text-amber-300 text-[11px] font-semibold border border-amber-500/30 cursor-pointer"
          >
            Ajustes
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
        <div className="order-first md:order-last sticky top-0 z-30 bg-black py-2 md:top-4 md:bg-transparent md:py-0">
          <CanvasPreview
            image={image}
            template={template}
            text={text}
            motivationalText={motivationalText}
            layout={layout}
            crop={crop}
            accent={accent}
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
              <ImageUploader hasImage={!!image} onImageUpload={handleImageUpload} onError={setNotice} />
              {image && <FramingControls crop={crop} onChange={setCrop} onReset={() => setCrop(DEFAULT_CROP)} />}
              <PhotoStrip
                photos={photos}
                currentId={currentPhotoId}
                onSelect={handleSelectPhoto}
                onDelete={handleDeletePhoto}
              />
            </Section>
          )}

          <div className={isGroup ? '' : 'hidden'}>
            <Section step={steps.content} title="Frase motivadora">
              <PhraseController
                api={bankApi}
                tag={phraseTag}
                onTagChange={setPhraseTag}
                value={motivationalText}
                onChange={setMotivationalText}
                ready={hydrated}
              />
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
              disabled={!canGenerate}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold rounded-xl shadow-lg transition-all cursor-pointer tracking-wide"
            >
              {busy ? 'Generando...' : 'Generar imagen'}
            </button>
            {!busy &&
              (canGenerate ? (
                <p className="text-[11px] text-amber-200/60 text-center mt-2">Salida en 1080 x 1920 px</p>
              ) : (
                <p className="text-[11px] text-amber-300/80 text-center mt-2">{blockReason}</p>
              ))}

            {isGroup && (
              <div className="mt-4 pt-4 border-t border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-amber-200/80">Lote de la semana</span>
                  <span className="text-[10px] text-amber-500/70">
                    {poolSize} {poolSize === 1 ? 'frase' : 'frases'} en el tema
                  </span>
                </div>

                <div className="flex gap-2">
                  {BATCH_OPTIONS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setBatchCount(count)}
                      className={`flex-1 py-2 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                        batchCount === count
                          ? 'bg-amber-500 text-black border-amber-500'
                          : 'bg-zinc-900 text-amber-200/80 border-amber-500/30'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleBatch}
                  disabled={!canGenerate || effectiveBatch === 0}
                  className="w-full py-2.5 rounded-lg bg-zinc-800 text-amber-300 text-[11px] font-semibold border border-amber-500/40 disabled:opacity-50 cursor-pointer"
                >
                  {batchBusy
                    ? `Generando ${batchProgress.done} de ${batchProgress.total}...`
                    : `Generar ${effectiveBatch} ${effectiveBatch === 1 ? 'imagen' : 'imágenes'}`}
                </button>
              </div>
            )}

            {notice && (
              <p className="text-[11px] text-red-400 text-center mt-2" role="alert">
                {notice}
              </p>
            )}
          </Section>
        </div>
      </main>

      {result && (
        <ResultModal
          key={result.id}
          result={result}
          onClose={closeResult}
          onNext={isGroup ? handleNextPhrase : null}
          busy={resultBusy}
          error={resultError}
          caption={caption}
        />
      )}

      {batchItems && (
        <BatchModal items={batchItems} captionFor={captionFor} onClose={closeBatch} />
      )}

      {showHistory && (
        <HistoryModal
          onClose={() => setShowHistory(false)}
          onCountChange={setHistoryCount}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
