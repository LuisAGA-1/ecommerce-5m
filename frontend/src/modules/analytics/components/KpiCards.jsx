import { moneda, numero } from "../formato";

function Variacion({ valor }) {

  if (valor === null || valor === undefined) {
    return <span className="analytics-delta neutral">Nuevo</span>;
  }

  const clase = valor > 0 ? "up" : valor < 0 ? "down" : "neutral";
  const flecha = valor > 0 ? "▲" : valor < 0 ? "▼" : "•";

  return (
    <span className={`analytics-delta ${clase}`} title="Comparado con el período anterior de igual duración">
      {flecha} {Math.abs(valor).toLocaleString("es-MX")}%
    </span>
  );
}

// =========================================================
// Tarjetas de indicadores clave
// =========================================================
function KpiCards({ resumen, variacion }) {

  const tarjetas = [
    {
      titulo: "Ingresos totales",
      valor: moneda(resumen.ingresos),
      detalle: `${numero(resumen.unidadesVendidas)} unidades vendidas`,
      delta: variacion.ingresos
    },
    {
      titulo: "Pedidos",
      valor: numero(resumen.pedidos),
      detalle: `${numero(resumen.clientesCompradores)} clientes compraron`,
      delta: variacion.pedidos
    },
    {
      titulo: "Ticket promedio por pedido",
      valor: moneda(resumen.ticketPromedioPedido),
      detalle: "Ingresos ÷ pedidos",
      delta: variacion.ticketPromedioPedido
    },
    {
      titulo: "Ticket promedio por cliente",
      valor: moneda(resumen.ticketPromedioCliente),
      detalle: `De ${numero(resumen.clientesRegistrados)} clientes registrados`,
      delta: variacion.ticketPromedioCliente
    }
  ];

  return (

    <div className="analytics-kpis">

      {tarjetas.map(t => (

        <article className="analytics-kpi" key={t.titulo}>

          <div className="analytics-kpi-top">
            <span>{t.titulo}</span>
            <Variacion valor={t.delta} />
          </div>

          <strong>{t.valor}</strong>

          <small>{t.detalle}</small>

        </article>

      ))}

    </div>
  );
}

export default KpiCards;
