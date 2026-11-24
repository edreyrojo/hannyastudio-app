# Informe técnico y de producto — HANNYASTUDIO

Fecha: 24 de noviembre de 2026
Alcance: revisión completa del código en `hannyastudio-app` (React 19 + Vite 8 + Tailwind 4), de las plantillas gráficas y del flujo de trabajo real en iPhone.
Estado del repositorio: rama `main`, sin cambios pendientes, último commit `6ac5257` (6 de noviembre de 2026), remoto en GitHub.

---

## 1. Veredicto general

Jefe, la app ya resuelve el núcleo del problema: elegir un marco de la academia, meter la foto, encuadrarla con el dedo, poner una frase y sacar un PNG de 1080x1920 listo para historias. Eso funciona y está bien construido para ser una primera versión.

Lo que tiene hoy es un **generador de imágenes correcto**, pero todavía no es la **herramienta diaria** que usted necesita. Le faltan tres cosas de fondo: memoria (nada se guarda al recargar), administración del contenido (frases y datos de la academia están grabados en el código o en el PNG) y un modo de trabajo en lote para producir la foto del día en menos de un minuto.

Además encontré un defecto que afecta **todas** las imágenes que genere hoy: lo que ve en la vista previa no es exactamente lo que se exporta. El detalle está en el punto 3.1 y es lo primero que hay que corregir.

Verificaciones realizadas:

- `npm run build` compila sin errores. Bundle de produccion: 240 KB de JS (76 KB gzip) y 19 KB de CSS. Peso sano.
- `npm run lint` pasa con 5 advertencias; dos de ellas son reales y están descritas abajo.
- Las cuatro plantillas son 1080x1920, así que la suposición de salida 9:16 es correcta. Los nombres "cuadrada" y "horizontal" se refieren a la forma del hueco de la foto, no al tamaño final.
- `cartel.png` no tiene zona transparente, por eso el aviso no admite foto. Coherente con el código.
- Los huecos detectados automáticamente son: vertical 3.0% / 11.5% / 93.7% x 53.8%; horizontal 2.6% / 6.5% / 97.0% x 45.0%; cuadrada 1.9% / 11.7% / 94.8% x 60.6%.

---

## 2. Lo que ya está bien (y conviene no tocar)

- **Arquitectura simple y sin backend.** Todo corre en el teléfono. No hay servidor, no hay costos, no hay datos que se puedan filtrar.
- **Detección automática del hueco** con relleno por inundación (`findHole.js`). Es una solución elegante: permite cambiar el arte sin tocar código. Además el truco de dibujar la foto por debajo del marco hace que los bordes rasgados de la plantilla enmascaren la foto sin necesidad de recortes complejos.
- **El encuadre con gestos** (un dedo mueve, dos dedos hacen zoom) está bien implementado: usa `pointer` events, mantiene la referencia del gesto y limita el desplazamiento al área de la foto. Es de lo mejor del proyecto.
- **La exportación replica la geometría de la vista previa** con la misma fórmula de escala (`fitImage` se reutiliza en ambos lados). Eso evita el error clásico de que la foto se vea distinta al exportar.
- **El compartir nativo** con `navigator.share({ files })` es la vía correcta en iOS, y el aviso de "mantén presionada la imagen" es un buen respaldo.
- **El diseño** negro y dorado con la tipografía condensada es coherente con la marca y se ve profesional.
- **Manejo de safe areas** con `env(safe-area-inset-*)` en `App.jsx:82`. Muchas apps web se olvidan de eso en iPhone.

---

## 3. P0 — Corregir antes de usarla a diario

### 3.1 La vista previa y la imagen exportada no coinciden (afecta todas las imágenes)

Es el hallazgo más importante del informe.

La clase `.font-strong` (`src/index.css:4-8`) aplica `text-transform: uppercase` y `letter-spacing: 0.05em`. Esas dos propiedades son de CSS y **el canvas no las hereda**. Por lo tanto:

- En pantalla, la frase se ve "LA DISCIPLINA SUPERA AL TALENTO." en mayúsculas y con las letras separadas.
- En el PNG exportado, la frase sale "La disciplina supera al talento." en caja normal y sin separación extra.

Lo mismo pasa con el texto del aviso (`CanvasPreview.jsx:191` contra `exportImage.js:106-114`). Usted aprueba una imagen en pantalla y publica otra distinta. Además, como el espaciado cambia el ancho, los saltos de línea también cambian: la misma frase puede ocupar 2 líneas en la previa y 3 en el archivo final.

Hay un segundo desajuste del mismo tipo: Anton tiene un solo peso (400), pero la previa pide `font-semibold` y `font-bold` (`CanvasPreview.jsx:176,179,191`), así que el navegador inventa una negrita sintética. El canvas, en cambio, usa la única cara disponible. El texto de la previa se ve más grueso que el del archivo exportado.

Solución recomendada: definir una sola fuente de verdad para el estilo del texto (por ejemplo, un objeto `TEXT_STYLE` con familia, peso, mayúsculas, tracking, alto de línea y color) y aplicarlo tanto en el CSS de la previa como en el canvas. En el canvas se implementa con `ctx.letterSpacing` y `text.toUpperCase()`.

### 3.2 La tipografía de la exportación no está garantizada

`exportImage.js:45` dibuja el texto sin esperar a que la fuente Anton esté cargada. Anton se descarga de Google Fonts (`index.html:8-10`). Si el usuario toca "Generar imagen" rápido, o si no hay red, el canvas usa la fuente por defecto del sistema y el resultado cambia de ancho y de aspecto, sin ningún aviso.

Solución: antes de dibujar, `await document.fonts.load('400 40px Anton')` y `await document.fonts.ready`. Y a mediano plazo, alojar la fuente dentro del proyecto (ver 4.7).

### 3.3 Se puede generar una imagen vacía

`handleGenerate` (`App.jsx:61-74`) no valida nada. Con un formato grupal y sin foto, exporta el marco con el hueco negro. Sin frase, exporta el subtítulo solo. Conviene deshabilitar el botón y explicar qué falta ("Falta la foto", "Falta la frase"), en lugar de producir un archivo inservible.

### 3.4 Si falla la detección del hueco, falla en silencio

`findHole` busca un píxel transparente recorriendo **solo la columna central** (`findHole.js:21-29`). Funciona con las cuatro plantillas actuales, pero cualquier marco futuro con el hueco descentrado, dos huecos o una zona transparente en el centro devolverá `null`, y la app simplemente exportará sin foto, sin mensaje (`exportImage.js:49-50`).

Además el relleno por inundación crea un `Uint8Array` de 2 MB y una pila con cientos de miles de números: en un iPhone viejo puede ser un tirón de varios cientos de milisegundos.

Solución: (a) como cada plantilla tiene una sola zona transparente, basta calcular el rectángulo envolvente en una pasada, sin inundación; (b) lo mejor es **precalcular** los huecos y guardarlos en un JSON junto a las plantillas, y que la app solo lo lea; (c) si no hay hueco, mostrar error y ofrecer ajustarlo a mano.

### 3.5 El texto no tiene límite ni ajuste automático

`wrapLines` (`exportImage.js:15-32`) parte por palabras, pero no recorta palabras larguísimas ni limita el número de líneas. En los formatos grupales el bloque crece hacia arriba y puede invadir la foto; en el aviso puede salirse por abajo o encimarse con los datos de contacto. Y como ahora mismo el texto del aviso es libre, es cuestión de tiempo.

Solución: calcular el alto total del bloque antes de dibujar y, si excede el espacio disponible, reducir el tamaño de letra por pasos hasta que quepa (con un mínimo legible). Mostrar en la previa una advertencia cuando se esté aplicando la reducción.

### 3.6 Peso muerto en el proyecto

- `html-to-image` está en `package.json:14` y no se usa en ningún archivo.
- `src/App.css` (184 líneas del template de Vite) no se importa en ningún lado.
- `src/assets/hero.png`, `react.svg`, `vite.svg` y `public/icons.svg` no se usan.
- `src/index.css:1-2` tiene `@import "tailwindcss";` duplicado.
- `src/index.css:10-18` define un fondo azul y un color de texto café que contradicen el tema negro/dorado y solo se tapan por las clases del contenedor.

Todo esto se borra sin riesgo y deja el proyecto más legible para cuando lo retome en unos meses.

### 3.7 Escritura de una referencia durante el render

`CanvasPreview.jsx:61` hace `latest.current = {...}` en el cuerpo del componente. Funciona, pero el propio linter lo marca (`react(refs)`) y con React 19 en modo concurrente puede dar comportamientos raros. Se mueve a un `useEffect` o a un `useLayoutEffect`.

---

## 4. P1 — Lo que más le va a doler en el uso diario

### 4.1 Nada se guarda al recargar

Si actualiza la página, o si iOS descarga la pestaña porque cambió de app un rato, se pierde la foto, el texto, el encuadre, el formato elegido y el avance del banco de frases. Para una herramienta que va a usar todos los días desde el teléfono, esto es lo primero que hay que resolver.

Solución: guardar ajustes y progreso en `localStorage`, y la foto y el historial en `IndexedDB` (las imágenes no caben en `localStorage`). Al abrir, restaurar el último borrador.

### 4.2 El banco de frases está fijo en el código

`src/utils/phrases.js` tiene 51 frases escritas a mano. Para cambiarlas hay que editar el archivo, hacer commit y volver a desplegar. El contador "sin repetir" se reinicia en cada recarga (`PhraseController.jsx:8-15`), así que en la práctica repite frases.

Falta: agregar, editar y borrar frases desde el teléfono; marcar favoritas; etiquetarlas por tema (disciplina, competencia, infantil, femenil, defensa personal); recordar cuáles ya se usaron y en qué fecha; y exportar/importar el banco en JSON para respaldarlo.

También hay dos detalles menores: el mezclado con `Math.random() - 0.5` (`PhraseController.jsx:10` y `:31`) es un shuffle sesgado, y el mensaje de banco agotado ("Recargue el archivo phrases.js, jefe") es lenguaje de desarrollador que podría terminar impreso en una imagen exportada.

### 4.3 No hay historial

No se puede volver a descargar ni a compartir la imagen de ayer. Para quien publica a diario, un historial con miniaturas, fecha y frase usada resuelve dos cosas: republicar rápido y llevar registro de qué se publicó. Se guarda en `IndexedDB` con el blob y una miniatura.

### 4.4 Los formatos "grupales" solo aceptan una foto

El nombre promete foto de grupo y el flujo solo permite una imagen. Opciones, de menor a mayor esfuerzo:

1. Subir varias fotos y elegir cuál va (biblioteca de fotos del sensei).
2. Subir varias y armar una cuadrícula o collage dentro del hueco (2, 3 o 4 fotos).
3. Permitir cambiar de foto sin volver a elegir archivo, tocando la miniatura.

La opción 1 es la que más valor da por el esfuerzo.

### 4.5 Texto y datos de la academia grabados

- "JIU JITSU BRASILEÑO" está escrito en dos lugares (`CanvasPreview.jsx:180` y `exportImage.js:93`). Si algún día quiere poner el nombre de la academia o el nombre del sensei, hay que tocar código en dos sitios.
- El teléfono, la sede y el Instagram de `cartel.png` están dentro del PNG. Si cambia el horario o el número, hay que pedir arte nuevo.

Solución: una pantalla de "Ajustes de la academia" con nombre, subtítulo, Instagram, teléfono y sede, y que esos campos se dibujen como capas de texto. El cartel ganaría un campo de texto para los datos de contacto y otro para la palabra "AVISO".

### 4.6 El zoom promete más de lo que la foto puede dar

La foto se reduce a 2400 px de lado mayor (`ImageUploader.jsx:3`) y el zoom llega a 4x (`CanvasPreview.jsx:4`). El hueco mide unos 1000 px de ancho en la imagen final: a partir de 2.4x ya se está ampliando una imagen más pequeña que el resultado, y a 4x se ve borroso. Además se recomprime a JPEG 0.92 (`ImageUploader.jsx:21`), lo que suma una segunda pérdida.

Solución: subir `MAX_SIDE` a 3500-4000 px (un iPhone moderno lo aguanta) o bajar el zoom máximo a 2.5x. Lo ideal es avisar cuando la resolución efectiva baje de cierto umbral: "A este zoom la foto se va a ver borrosa".

### 4.7 La PWA está a medias

Hay manifest e iconos, pero falta lo que hace que se sienta app instalada:

- No hay service worker: sin red, la app no abre. Para un taller o un dojo con wifi irregular, eso importa.
- No hay `apple-mobile-web-app-capable` ni `status-bar-style` en `index.html`, que es lo que iOS usa para el modo pantalla completa.
- El manifest declara el mismo archivo para 192x192 y 512x512 (`manifest.json:8-19`), y el logo real es de 1000x1000. Faltan los tamaños correctos y un `apple-touch-icon` de 180x180.
- Anton se descarga de Google Fonts: sin red, cambia la tipografía (y con ello el resultado exportado, ver 3.2). Conviene alojarla en el proyecto.
- Falta `orientation`, `id`, `scope` y capturas para la instalación.

La solución estándar es `vite-plugin-pwa` con precarga de las plantillas y la fuente, más un aviso de "hay una versión nueva" cuando se despliegue.

### 4.8 Las plantillas pesan demasiado

Cada PNG mide entre 1.1 y 1.6 MB. Son texturas fotográficas, así que en WebP con calidad 80-85 bajarían a 150-300 KB sin diferencia visible. Además, cada plantilla decodificada ocupa unos 8 MB de memoria en el teléfono.

Recomendación: generar dos versiones por plantilla, una reducida (540x960) para la vista previa y la original para exportar; servir WebP; y precargar solo la plantilla por defecto.

Ojo con el caché: los archivos de `public/` no llevan hash en el nombre, así que si reemplaza `vertical.png` iOS puede seguir mostrando el viejo, y `findHole` cachea por URL. Conviene versionar los nombres (`vertical-v2.png`) o agregar un parámetro de versión, y actualizar el manifest de huecos al mismo tiempo.

### 4.9 La plantilla se cambia sola al subir la foto

`ImageUploader.jsx:39-42` deduce el formato por la orientación de la foto y `App.jsx:58` lo aplica sin preguntar. Si usted eligió "Grupal vertical" y sube una foto horizontal, la app cambia a "horizontal" por su cuenta. Puede ser cómodo la primera vez, pero es sorpresivo cuando ya eligió. Mejor: aplicar la deducción solo en la primera foto, o mostrar "La foto es horizontal, ¿cambiar de formato?".

Detalle extra: al cambiar de plantilla no se reinicia el encuadre, y como los huecos tienen proporciones distintas, la foto "salta" de posición.

### 4.10 Manejo de errores y modal

- Los errores se muestran con `alert()` (`App.jsx:70`, `ImageUploader.jsx:45`). En iPhone se ve tosco y bloquea. Conviene un aviso flotante.
- No hay `ErrorBoundary`: cualquier error de ejecución deja pantalla en blanco.
- El modal de resultado no bloquea el scroll del fondo, no atrapa el foco y no se cierra con Escape.
- En iOS, el enlace `download` (`ResultModal.jsx:38-48`) no descarga: abre la imagen en otra pestaña. El botón de compartir es el camino correcto; conviene que sea el único protagonista y dejar el otro como respaldo.
- Falta el paso natural después de exportar: "Siguiente frase y generar otra", sin cerrar el modal.

---

## 5. P2 — Calidad y mantenimiento

1. **Sin pruebas automatizadas.** `fitImage` y `wrapLines` son funciones puras con matemática delicada y son el corazón del encuadre. Un archivo de pruebas con Vitest (5 o 6 casos: zoom mínimo, desplazamiento al límite, frase de una palabra, palabra larguísima) habría detectado varios de los puntos anteriores. Y una prueba de humo con Playwright en viewport de iPhone para el flujo completo.
2. **Sin tipos.** Con tanta geometría, TypeScript o al menos JSDoc en `fitImage`, `findHole` y `renderToBlob` ahorraría errores. No es urgente, pero sí antes de agregar multi-foto y capas de texto.
3. **Constantes exportadas desde un componente.** `MAX_ZOOM` y `TEMPLATES` viven en `CanvasPreview.jsx:4-11` y se importan desde `exportImage.js`. Eso rompe el Fast Refresh (por eso salen dos advertencias del linter) y genera un acoplamiento raro entre el exportador y la vista. Deben vivir en `src/utils/templates.js`.
4. **Configuración de lint incompleta.** Las advertencias reales de `PhraseController.jsx:11-13` (setState dentro de un efecto y dependencia faltante) no están como error. Vale la pena activar `exhaustive-deps` como error.
5. **Accesibilidad.** Los botones de más y menos no tienen `aria-label` (`TextControls.jsx:13-23`, `FramingControls.jsx:17-27`), los sliders tampoco, el modal no tiene `role="dialog"` ni `aria-modal`, y las imágenes no tienen texto alternativo descriptivo. Con VoiceOver la app es difícil de usar.
6. **README genérico.** Sigue siendo el del template de Vite. Debe explicar qué es la app, cómo correrla, cómo desplegarla y, sobre todo, **cómo agregar una plantilla nueva** (tamaño, dónde va el hueco, cómo se detecta).
7. **`object-fill` en el marco** (`CanvasPreview.jsx:168`) y el `aspect-[9/16]` fijo (`:125`). Hoy funciona porque todo es 1080x1920, pero el día que agregue una plantilla 1:1 o 4:5 se va a deformar. Conviene derivar la proporción del tamaño real de la imagen.
8. **Zona segura de Instagram.** En historias, los primeros y últimos 250 px de los 1920 quedan tapados por la interfaz. El texto grupal a 25% está bien ubicado, pero los datos de contacto del cartel (alrededor de y=1700) caen justo en la zona baja. Vale la pena una guía visual opcional en la previa.
9. **El resultado no se libera si se genera dos veces.** `App.jsx:67` crea un object URL nuevo sin revocar el anterior. Hoy el modal lo impide, pero si agrega "siguiente frase" desde el modal, va a pasar.
10. **Rutas absolutas.** Tanto `index.html` como el manifest y las plantillas usan rutas desde la raíz (`/templates/...`, `/logo.png`, `start_url: "/"`). Eso obliga a desplegar en el dominio raíz: en GitHub Pages tipo `usuario.github.io/hannyastudio-app/` todo daría 404. Si va a usar GitHub Pages, hay que ajustar `base` en Vite y las rutas del manifest.

---

## 6. Mejoras que valdría la pena implementar

Ordenadas por relación entre valor y esfuerzo, pensando en su flujo real: tomar la foto del sensei y publicar una imagen diaria.

| # | Mejora | Por qué | Esfuerzo |
|---|--------|---------|----------|
| 1 | Guardado automático del borrador | Cerrar la app sin perder el trabajo. Es la base de todo lo demás. | Bajo |
| 2 | Banco de frases editable con temas y favoritos | Usted es el dueño del contenido; no debería depender de un archivo y un despliegue. | Medio |
| 3 | Historial con miniaturas y "volver a compartir" | Republican y no perder lo hecho. | Medio |
| 4 | "Siguiente frase" desde el modal y generación en lote | Producir 5 o 7 imágenes de la semana en una sola sesión es el mayor ahorro de tiempo. | Medio |
| 5 | Biblioteca de fotos del sensei | Evita subir la misma foto cada día y permite alternar retratos. | Medio |
| 6 | Ajustes de la academia (nombre, Instagram, teléfono, sede) como capas de texto | Deja de depender del arte para cambiar un dato. También permite un cartel sin datos grabados. | Medio |
| 7 | Plantillas administrables desde el teléfono | Subir un PNG nuevo, detectar el hueco y guardarlo en IndexedDB, sin tocar código ni desplegar. | Alto |
| 8 | Guía de cámara: cuadrícula, nivel y aviso de resolución | Mejora la foto de origen, que es de donde sale la calidad final. | Bajo |
| 9 | Pie de foto con hashtags y botón "Copiar texto" | Completar la publicación sin salir de la app. | Bajo |
| 10 | Formatos 1:1 y 4:5 para feed | Hoy solo produce historias; el feed se queda fuera. Requiere arte nuevo. | Medio-Alto |
| 11 | Archivo de respaldo (frases, ajustes y plantillas en JSON) | Protege meses de contenido si cambia de teléfono. | Bajo |
| 12 | PWA offline real con actualización automática | Que abra en el dojo, sin señal y sin pensar en el navegador. | Bajo-Medio |

Nota sobre el punto 4: si se implementa, conviene que el lote incluya una hoja de contacto (una sola imagen con las 7 propuestas) para elegir rápido antes de exportar todo.

---

## 7. Lo que no le recomiendo (por ahora)

- **Generación de imágenes con IA.** El valor de su app es que sale el sensei real. Una imagen sintética rompería la confianza con los alumnos y le costaría dinero por imagen.
- **Detección automática de rostros.** Suena bien, pero en iOS requiere modelos pesados y el encuadre manual con dos dedos ya funciona. Mejor invertir ese esfuerzo en la biblioteca de fotos.
- **Usuarios, contraseñas y base de datos.** Es una herramienta personal. Si algún día la comparte con instructores, un passcode o Cloudflare Access delante del sitio resuelve el 90% con el 5% del trabajo.
- **Internacionalización.** La academia es en español. No aporta.
- **Publicación directa a Instagram.** Desde el navegador no es posible. Si eso se vuelve un requisito, la vía es envolver la app con Capacitor para tener cámara nativa, acceso a Fotos e intent de Instagram; es un proyecto aparte, no una mejora incremental.

---

## 8. Plan sugerido

**Etapa 1 — Confiabilidad (1 semana).**
Corregir 3.1 (mayúsculas y tracking), 3.2 (fuente lista), 3.3 (validaciones), 3.5 (ajuste de texto), 3.4 (huecos precalculados con mensaje de error), limpieza de 3.6 y 3.7. Al terminar, lo que ve es lo que publica.

**Etapa 2 — Memoria y contenido (1 a 2 semanas).**
Guardado automático, banco de frases editable con temas, historial y ajustes de la academia. Aquí es donde la app deja de ser un generador y se vuelve su herramienta.

**Etapa 3 — Velocidad de producción (1 semana).**
Generación en lote, "siguiente frase" desde el modal, biblioteca de fotos y pie de foto con hashtags.

**Etapa 4 — App instalada (3 a 5 días).**
PWA offline con `vite-plugin-pwa`, fuente local, iconos correctos, optimización de plantillas a WebP con versión de previa, despliegue en Vercel o Cloudflare Pages con HTTPS y dominio propio.

**Etapa 5 — Crecimiento (cuando lo pida el uso).**
Plantillas administrables desde el teléfono, formatos de feed, capas de texto configurables.

---

## 9. Pruebas obligatorias en iPhone antes de cada entrega

1. Abrir en **Safari real**, no en Chrome, y también desde el icono instalado en pantalla de inicio.
2. Tomar la foto con la cámara del iPhone (no desde la galería) en vertical y en horizontal.
3. Subir una foto de la galería que venga en HEIC y verificar que no se voltee ni se deforme.
4. Hacer zoom y desplazar hasta los bordes; soltar dos dedos a la vez y verificar que no se quede trabado.
5. Generar, compartir a WhatsApp, a Instagram y guardar en Fotos.
6. Comparar píxel por píxel la vista previa contra el PNG exportado (misma frase, mismo encuadre).
7. Poner el teléfono en modo avión y abrir la app instalada: debe abrir y funcionar.
8. Bloquear el teléfono a media edición, desbloquear y verificar que el borrador siguió ahí.
9. Probar con la frase más larga del banco y con una de una sola palabra.
10. Revisar en un iPhone pequeño (SE) y en uno grande, para confirmar que la previa fija no se come la pantalla.

---

## 10. Despliegue

- El repositorio apunta a GitHub y la rama es `main`. La vía más simple y con HTTPS automático es Vercel o Cloudflare Pages conectados al repositorio.
- El sitio debe vivir en la **raíz del dominio** por las rutas absolutas descritas en 5.10. Si usa GitHub Pages en una subruta, hay que corregir `base` y el manifest.
- La cámara y el compartir requieren HTTPS; en `localhost` funciona, en una IP local por HTTP no.
- Configure caché larga para `/assets/*` (ya llevan hash) y caché corta para `/templates/*` y `/logo.png`, que no llevan hash.
- Deje anotado en el README el proceso de actualización de una plantilla: reemplazar el archivo con nombre versionado, regenerar el JSON de huecos y desplegar.
