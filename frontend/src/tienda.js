// Identidad de la tienda: nombre, colores, textos y categorías.
// Para cambiar de giro edita este archivo (y la lista de categorías en
// backend/src/domain/entities/Product.js).
export const TIENDA = {
  nombre: "rock",
  sufijo: "zone",
  logoCorto: "rz",
  nombreCompleto: "RockZone",
  acento: "#e0262f",
  sombraAcento: "rgba(224, 38, 47, 0.34)",
  fondo: "#f1f1f0",
  buscador: "¿Qué instrumento o equipo buscas?",
  // Categoría → ícono (en el orden en que se muestran)
  categorias: {
    "Instrumentos": "🎸",
    "Insumos y refacciones": "🔧",
    "Efectos y accesorios": "🎛️",
    "Amplificación y sonido": "🔊",
    "Equipo para bandas": "🥁",
    "Otros": "📦"
  }
};

export const CATEGORIAS = Object.keys(TIENDA.categorias);
