# HANNYASTUDIO

Generador de imágenes para Hannya Academy. Toma una foto, la coloca dentro de un
marco de la academia y agrega una frase de jiu jitsu para publicar en historias
de Instagram. Todo corre en el navegador, sin servidor ni base de datos.

Salida: PNG de 1080 x 1920 px.

## Requisitos

- Node 20 o superior
- npm

## Comandos

```bash
npm install
npm run dev      # desarrollo en http://localhost:5173
npm run build    # compila a dist/
npm run preview  # sirve la versión compilada
npm run lint     # oxlint
```

## Qué guarda la app

Todo se guarda en el teléfono, sin cuenta ni nube.

- **Borrador**: foto, formato, frase, encuadre y ajustes de texto en IndexedDB.
  Al abrir la app se restaura tal como quedó.
- **Ajustes**: línea de acento en `localStorage`.
- **Banco de frases**: en `localStorage`, con el avance del ciclo "sin repetir".
- **Historial**: las últimas 24 imágenes generadas, con miniatura, en IndexedDB.
  Se guardan solas al generar.

Si se borran los datos del sitio desde el navegador, se pierde todo. El banco de
frases se puede respaldar con el botón Exportar JSON.

## Cómo se arma una imagen

1. **Marco**: un PNG de 1080 x 1920 en `public/templates/`.
2. **Hueco**: la zona transparente del PNG donde va la foto. El marco se dibuja
   encima de la foto, así que los bordes rasgados recortan la imagen solos.
3. **Texto**: una capa dibujada con canvas al final, encima de todo.

La vista previa y la exportación comparten el mismo motor de texto
(`src/utils/textLayout.js`), por lo que lo que se ve en pantalla es exactamente
lo que sale en el archivo: mismo tamaño, mismos saltos de línea, mismas
mayúsculas y mismo espaciado.

## Ajustar el estilo del texto

Todo el estilo vive en `TEXT` dentro de `src/utils/textLayout.js`: familia, peso,
mayúsculas, espaciado entre letras, interlineado, colores, sombra, ancho máximo y
tope de reducción. Se cambia ahí y aplica a la previa y al PNG.

La **línea de acento** (el texto dorado debajo de la frase) se edita desde el
botón Ajustes de la app y se guarda en el teléfono.

Reglas que conviene respetar:

- Usar una fuente con peso real. Anton solo tiene 400; pedir negrita hace que el
  navegador la invente y el canvas no, y la previa deja de coincidir.
- El texto se reduce solo cuando no cabe. El tope está en `minScale`.

## Banco de frases

Cada frase tiene un texto, un tema y una marca de favorita.

- **Otra frase** elige una frase del tema seleccionado que no se haya usado en el
  ciclo actual. El ciclo avanza solo cuando se agotan las frases, así que no se
  repiten aunque cierres la app.
- **Banco** abre el administrador: agregar, editar, borrar, buscar, filtrar por
  tema o favoritas, importar y exportar JSON, y restablecer las originales.
- Si escribes una frase propia, el botón "Guardar esta frase en el banco" la
  agrega.

Los temas se definen en `src/utils/phraseBank.js` (`TAGS`). Al agregar una frase
el tema se puede elegir a mano; las frases importadas sin tema válido se
clasifican por palabras clave.

## Historial

Cada imagen que se genera se guarda en el historial del teléfono con una
miniatura. Desde ahí se puede compartir, descargar o borrar. Se conservan las
últimas 24; al pasar ese límite se descarta la más vieja.

## Agregar una plantilla nueva

1. Copia el PNG a `public/templates/`. Debe medir 1080 x 1920.
2. Calcula el hueco. Abre la app en el navegador, entra a la consola y pega esto
   cambiando el nombre del archivo:

```js
(async () => {
  const src = '/templates/mi-plantilla.png';
  const img = new Image();
  img.src = src;
  await img.decode();
  const { naturalWidth: w, naturalHeight: h } = img;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, w, h);

  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] < 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return console.log('Sin hueco: es una plantilla de aviso.');

  const round = (v) => Math.round(v * 1000) / 1000;
  const left = Math.max(0, minX - 2);
  const top = Math.max(0, minY - 2);
  const right = Math.min(w, maxX + 3);
  const bottom = Math.min(h, maxY + 3);
  console.log(JSON.stringify({
    left: round((left / w) * 100),
    top: round((top / h) * 100),
    width: round(((right - left) / w) * 100),
    height: round(((bottom - top) / h) * 100),
  }, null, 2));
})();
```

3. Agrega la entrada en `src/utils/templates.js` con ese hueco. Si la plantilla
   no lleva foto, usa `hole: null`.

Nota: el script toma el rectángulo que encierra toda la zona transparente. Si el
arte tiene más de una zona transparente separada, el resultado va a ser la caja
que las contiene; en ese caso conviene revisar el PNG.

## Archivos de plantilla y caché

Los archivos de `public/` no llevan hash en el nombre, así que si reemplazas un
marco con el mismo nombre el navegador puede seguir mostrando el viejo. Usa
nombres versionados (`vertical-v2.png`) y actualiza la entrada correspondiente.

## Estructura

```
src/
  App.jsx                    estado general, borrador e historial
  components/
    CanvasPreview.jsx        vista previa con gestos de encuadre
    ImageUploader.jsx        galería y cámara
    PhraseController.jsx     frase del día, tema y acceso al banco
    PhraseBankModal.jsx      administrador del banco de frases
    HistoryModal.jsx         historial de imágenes generadas
    SettingsModal.jsx        línea de acento
    Modal.jsx                contenedor común de ventanas emergentes
    TextControls.jsx         altura y tamaño del texto
    FramingControls.jsx      zoom del encuadre
    ResultModal.jsx          resultado, compartir y descargar
  hooks/
    usePhraseBank.js         estado y persistencia del banco
  utils/
    templates.js             tamaños, plantillas y huecos
    fitImage.js              encuadre de la foto dentro del hueco
    textLayout.js            motor de texto compartido (previa y export)
    exportImage.js           dibujo del PNG final
    phraseBank.js            temas, clasificación y elección sin repetir
    phrases.js               banco inicial de frases
    storage.js               localStorage, IndexedDB y descargas
    thumbnail.js             miniaturas del historial
```

## Despliegue

- Las rutas son absolutas (`/templates/...`, `/logo.png`, `start_url: "/"`), así
  que el sitio debe publicarse en la raíz del dominio. Vercel o Cloudflare Pages
  funcionan directo; GitHub Pages en una subruta requiere ajustar `base`.
- La cámara, el compartir y la instalación como app necesitan HTTPS.
- Caché larga para `/assets/*` (llevan hash) y corta para `/templates/*` y
  `/logo.png` (no lo llevan).

## Pendientes

El análisis completo y el plan de mejoras están en `INFORME-MEJORAS.md`.
