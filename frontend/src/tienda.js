// Identidad de la tienda: nombre, colores, textos y categorías.
// Para cambiar de giro edita este archivo (y la lista de categorías en
// backend/src/domain/entities/Product.js).
export const TIENDA = {
  nombre: "paso",
  sufijo: "urbano",
  logoCorto: "pu",
  nombreCompleto: "Paso Urbano",
  acento: "#ff5a1f",
  sombraAcento: "rgba(255, 90, 31, 0.34)",
  fondo: "#f4f2ef",
  buscador: "¿Qué tenis o prenda buscas?",
  // Categoría → ícono (en el orden en que se muestran)
  categorias: {
    Tenis: "👟",
    Playeras: "👕",
    Sudaderas: "🧥",
    Gorras: "🧢",
    Mochilas: "🎒",
    Calcetines: "🧦",
    Accesorios: "🕶️",
    Otros: "📦"
  }
};

export const CATEGORIAS = Object.keys(TIENDA.categorias);
