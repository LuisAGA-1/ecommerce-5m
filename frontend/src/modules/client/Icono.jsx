// Íconos de línea (24x24) para la tienda; heredan el color del texto.
const TRAZOS = {
  inicio: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z",
  productos: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  carrito: "M6 7h12l-1 13H7zM9 7a3 3 0 0 1 6 0",
  pedidos: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  salir: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  flecha: "M5 12h14M13 6l6 6-6 6",
  chevron: "M9 6l6 6-6 6"
};

function Icono({ nombre, tamano = 24 }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}

export default Icono;
