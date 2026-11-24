// Geometría base de todas las plantillas y datos de sus huecos.
// Las plantillas deben ser 1080 x 1920 y el hueco debe ser una zona transparente.
// Los archivos de public/templates/ se generan con: npm run templates

export const W = 1080;
export const H = 1920;

export const MAX_ZOOM = 4;

// Huecos medidos en píxeles sobre cada PNG, expresados en porcentaje.
// Se agregan 2 px de margen a cada lado para que la foto cubra hasta el borde
// rasgado; el marco se dibuja encima, así que el margen no se ve.
// Para agregar una plantilla nueva, ver README.md.
export const TEMPLATES = {
  cuadrada: {
    src: '/templates/cuadrada.webp',
    preview: '/templates/cuadrada-preview.webp',
    hole: { left: 1.481, top: 11.563, width: 95.556, height: 61.094 },
  },
  horizontal: {
    src: '/templates/horizontal.webp',
    preview: '/templates/horizontal-preview.webp',
    hole: { left: 2.407, top: 6.198, width: 97.593, height: 45.469 },
  },
  vertical: {
    src: '/templates/vertical.webp',
    preview: '/templates/vertical-preview.webp',
    hole: { left: 2.593, top: 11.198, width: 94.444, height: 54.323 },
  },
  cartel: {
    src: '/templates/cartel.webp',
    preview: '/templates/cartel-preview.webp',
    hole: null,
  },
};

export function getTemplate(id) {
  return TEMPLATES[id] || TEMPLATES.cartel;
}
