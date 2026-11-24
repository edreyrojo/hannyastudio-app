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
npm run dev        # desarrollo en http://localhost:5173
npm run build      # compila a dist/ y genera el service worker
npm run preview    # sirve la versión compilada
npm run lint       # oxlint
npm run templates  # convierte templates-source/*.png a WebP y calcula huecos
npm run icons      # regenera los iconos de la app desde brand/logo.png
```

## App instalada y uso sin conexión

La app es una PWA. En iPhone se instala desde Safari con Compartir → "Agregar a
inicio", y abre en pantalla completa sin barra del navegador.

La primera vez que se abre con internet, el service worker guarda en el teléfono
el código, las plantillas, la fuente y los iconos (menos de 1 MB). A partir de
ahí abre y genera imágenes sin conexión, incluidas las fotos que ya están en la
biblioteca. La cámara y la galería del teléfono también funcionan sin red.

Cuando se publica una versión nueva, la app muestra un aviso de "Hay una versión
nueva" con un botón para actualizar. En iOS, si el aviso no aparece, basta con
cerrar y volver a abrir la app.

La fuente Anton está alojada en el proyecto (`src/assets/fonts/`), así que no
depende de Google Fonts ni para la vista previa ni para la exportación.

## Qué guarda la app

Todo se guarda en el teléfono, sin cuenta ni nube.

- **Borrador**: foto, formato, frase, encuadre y ajustes de texto en IndexedDB.
  Al abrir la app se restaura tal como quedó.
- **Ajustes**: línea de acento y hashtags en `localStorage`.
- **Banco de frases**: en `localStorage`, con el avance del ciclo "sin repetir".
- **Biblioteca de fotos**: las últimas 12 fotos subidas, con miniatura, en
  IndexedDB. Se puede cambiar de foto sin volver a subirla.
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

## Lote de la semana

En la sección Exportar se elige 3, 5 o 7. La app toma esa cantidad de frases del
tema activo, una por imagen, y genera todas con el mismo encuadre y formato. Al
terminar se abre una galería con las imágenes para compartir, descargar o copiar
el pie de cada una. Todas quedan en el historial.

## Biblioteca de fotos

Cada foto que se sube se guarda en el teléfono (máximo 12). La tira de
miniaturas aparece en la sección Foto: se toca una para volver a usarla sin pasar
por la galería del teléfono. Para borrar una, se toca la × y se confirma con el
mismo botón.

## Pie de foto

El botón "Copiar pie de foto" del resultado copia la frase de la imagen y los
hashtags configurados en Ajustes, separados por una línea en blanco. Si iOS
bloquea el portapapeles, la app muestra el texto en un campo para que lo
selecciones y lo copies a mano.

## Historial

Cada imagen que se genera se guarda en el historial del teléfono con una
miniatura. Desde ahí se puede compartir, descargar o borrar. Se conservan las
últimas 24; al pasar ese límite se descarta la más vieja.

## Agregar una plantilla nueva

Las plantillas se preparan con un script, no a mano.

1. Copia el PNG a 	emplates-source/. Debe medir 1080 x 1920 y la zona de la
   foto debe ser transparente.
2. Ejecuta:

`ash
npm run templates
`

3. El script escribe en public/templates/ la versión completa (.webp), la de
   vista previa (-preview.webp) y te imprime la entrada lista para pegar en
   src/utils/templates.js, con el hueco calculado.

`js
  mi-plantilla: {
    src: '/templates/mi-plantilla.webp',
    preview: '/templates/mi-plantilla-preview.webp',
    hole: { left: 2.5, top: 11.2, width: 94.4, height: 54.3 },
  },
`

Si la plantilla no lleva foto (como el aviso), el script devuelve hole: null.

Notas:

- El hueco es el rectángulo que encierra toda la zona transparente, con 2 px de
  margen para que la foto cubra hasta el borde rasgado. Si el arte tiene más de
  una zona transparente separada, el resultado será la caja que las contiene.
- La versión de vista previa se genera a 540 px de ancho: es la que se usa en
  pantalla. La completa solo se usa al exportar, así que el teléfono no carga
  imágenes de 1080 px para mostrar una miniatura.
- Los PNG de 	emplates-source/ no se publican ni se cachean; solo son la
  fuente para regenerar.

## Caché y actualizaciones

El build genera hashes en los nombres de JS, CSS y fuente, y el service worker
precarga todo con su propia revisión. Al reemplazar una plantilla y volver a
compilar, la app descarga la nueva versión y muestra el aviso de actualizar; no
hace falta cambiar nombres de archivo.

Los PNG de 	emplates-source/ y rand/ no se sirven al navegador.
## Estructura

```
src/
  App.jsx                    estado general, borrador, historial y PWA
  components/
    CanvasPreview.jsx        vista previa con gestos de encuadre
    ImageUploader.jsx        galería y cámara
    PhotoStrip.jsx           biblioteca de fotos guardadas
    PhraseController.jsx     frase del día, tema y acceso al banco
    PhraseBankModal.jsx      administrador del banco de frases
    HistoryModal.jsx         historial de imágenes generadas
    BatchModal.jsx           resultado del lote de la semana
    SettingsModal.jsx        línea de acento y hashtags
    Modal.jsx                contenedor común de ventanas emergentes
    TextControls.jsx         altura y tamaño del texto
    FramingControls.jsx      zoom del encuadre
    ResultModal.jsx          resultado, siguiente frase, compartir y descargar
  hooks/
    usePhraseBank.js         estado y persistencia del banco
  utils/
    templates.js             tamaños, plantillas, huecos y versiones de previa
    fitImage.js              encuadre de la foto dentro del hueco
    textLayout.js            motor de texto compartido (previa y export)
    exportImage.js           dibujo del PNG final
    phraseBank.js            temas, clasificación y elección sin repetir
    phrases.js               banco inicial de frases
    caption.js               pie de foto y copiado al portapapeles
    storage.js               localStorage, IndexedDB y descargas
    thumbnail.js             miniaturas del historial y la biblioteca
  assets/fonts/              Anton (woff2) alojada en el proyecto
scripts/
  templates.mjs              PNG → WebP completa + previa y cálculo del hueco
  icons.mjs                  iconos de la PWA y logo del encabezado
templates-source/            PNG originales de las plantillas (no se publican)
brand/                       logo original (no se publica)
public/                      lo que sí se sirve: plantillas WebP, iconos, manifest
```

## Despliegue

- Las rutas son absolutas (`/templates/...`, `/icons/...`, `start_url: "/"`), así
  que el sitio debe publicarse en la raíz del dominio. Vercel o Cloudflare Pages
  funcionan directo; GitHub Pages en una subruta requiere ajustar `base`.
- HTTPS es obligatorio: la cámara, el compartir, el portapapeles y el service
  worker no funcionan sin él.
- El build genera `sw.js`. No lo bloquees en el servidor y no le pongas caché
  larga: debe poder actualizarse.
- Caché larga para `/assets/*` (llevan hash). Para `/templates/*`, `/icons/*` y
  `/manifest.json` no hace falta configurar nada: el service worker controla su
  propia revisión.
- Después de desplegar una versión nueva, ábrela una vez con internet para que el
  aviso de actualización aparezca en los teléfonos.

## Pendientes

El análisis completo y el plan de mejoras están en `INFORME-MEJORAS.md`.
