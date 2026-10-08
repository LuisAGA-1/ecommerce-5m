// =========================================================
// Utilidades de formato y rangos de fecha del panel
// =========================================================

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function moneda(valor, compacto = false) {
  const n = Number(valor || 0);
  if (compacto && Math.abs(n) >= 1000) {
    return "$" + new Intl.NumberFormat("es-MX", {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(n);
  }
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2
  });
}

export function numero(valor) {
  return Number(valor || 0).toLocaleString("es-MX");
}

// "2026-10-08" -> Date local (sin desfase de zona horaria)
export function aFecha(texto) {
  const [a, m, d] = String(texto).split("-").map(Number);
  return new Date(a, m - 1, d);
}

export function aTexto(fecha) {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${a}-${m}-${d}`;
}

export function etiquetaPeriodo(periodo, granularidad, larga = false) {
  const f = aFecha(periodo);
  const dia = String(f.getDate()).padStart(2, "0");
  const mes = MESES[f.getMonth()];

  if (granularidad === "mes") {
    return `${mes} ${f.getFullYear()}`;
  }
  if (granularidad === "semana") {
    return larga ? `Semana del ${dia} ${mes} ${f.getFullYear()}` : `Sem ${dia} ${mes}`;
  }
  return larga ? `${dia} ${mes} ${f.getFullYear()}` : `${dia} ${mes}`;
}

export function fechaCorta(texto) {
  const f = aFecha(texto);
  return `${String(f.getDate()).padStart(2, "0")} ${MESES[f.getMonth()]} ${f.getFullYear()}`;
}

// ---------------------------------------------------------
// Rangos predefinidos
// ---------------------------------------------------------
export const PRESETS = [
  { id: "7d", etiqueta: "Últimos 7 días" },
  { id: "30d", etiqueta: "Últimos 30 días" },
  { id: "mes", etiqueta: "Este mes" },
  { id: "mesAnterior", etiqueta: "Mes anterior" },
  { id: "90d", etiqueta: "Últimos 90 días" },
  { id: "anio", etiqueta: "Este año" },
  { id: "custom", etiqueta: "Personalizado" }
];

export function rangoDePreset(id, hoy = new Date()) {
  const h = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const menos = dias => new Date(h.getFullYear(), h.getMonth(), h.getDate() - dias);

  switch (id) {
    case "7d":
      return { desde: aTexto(menos(6)), hasta: aTexto(h) };
    case "30d":
      return { desde: aTexto(menos(29)), hasta: aTexto(h) };
    case "90d":
      return { desde: aTexto(menos(89)), hasta: aTexto(h) };
    case "mes":
      return { desde: aTexto(new Date(h.getFullYear(), h.getMonth(), 1)), hasta: aTexto(h) };
    case "mesAnterior":
      return {
        desde: aTexto(new Date(h.getFullYear(), h.getMonth() - 1, 1)),
        hasta: aTexto(new Date(h.getFullYear(), h.getMonth(), 0))
      };
    case "anio":
      return { desde: aTexto(new Date(h.getFullYear(), 0, 1)), hasta: aTexto(h) };
    default:
      return null;
  }
}

export const COLORES_ESTADO = {
  PENDIENTE: "#f59e0b",
  PAGADO: "#16a34a",
  ENVIADO: "#2563eb",
  CANCELADO: "#dc2626"
};
