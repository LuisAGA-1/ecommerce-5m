// Identidad de la tienda: nombre, colores, textos y categorías.
// Para cambiar de giro edita este archivo (y la lista de categorías en
// backend/src/domain/entities/Product.js).
export const TIENDA = {
  nombre: "tienda",
  sufijo: "5m",
  logoCorto: "5m",
  acento: "#5433eb",
  sombraAcento: "rgba(69, 36, 219, 0.34)",
  fondo: "#f2f4f5",
  buscador: "¿Qué buscas hoy?",
  // Categoría → ícono (en el orden en que se muestran)
  categorias: {
    Laptops: "💻",
    Computadoras: "🖥️",
    Monitores: "📺",
    Celulares: "📱",
    Tablets: "📲",
    Audio: "🎧",
    Accesorios: "🖱️",
    Componentes: "💾",
    Otros: "📦"
  }
};

export const CATEGORIAS = Object.keys(TIENDA.categorias);
