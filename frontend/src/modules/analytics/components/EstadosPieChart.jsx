import { useState } from "react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from "recharts";

import { COLORES_ESTADO, moneda, numero } from "../formato";

function TooltipEstado({ active, payload }) {

  if (!active || !payload?.length) return null;

  const e = payload[0].payload;

  return (
    <div className="analytics-tooltip">
      <strong>{e.etiqueta}</strong>
      <span>{numero(e.cantidad)} pedidos ({e.porcentaje}%)</span>
      <span>Monto: <b>{moneda(e.monto)}</b></span>
    </div>
  );
}

// =========================================================
// Distribución de pedidos por estado (dona)
// =========================================================
function EstadosPieChart({ estados }) {

  const [activo, setActivo] = useState(null);

  const conDatos = estados.estados.filter(e => e.cantidad > 0);

  return (

    <section className="analytics-card">

      <header className="analytics-card-header">
        <div>
          <h3>Estado de pedidos</h3>
          <span>{numero(estados.total)} pedidos en el período</span>
        </div>
      </header>

      {estados.total === 0 ? (

        <div className="analytics-empty">Sin pedidos en este rango.</div>

      ) : (

        <div className="analytics-pie-wrap">

          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={conDatos}
                dataKey="cantidad"
                nameKey="etiqueta"
                innerRadius={58}
                outerRadius={90}
                paddingAngle={2}
                stroke="#ffffff"
                strokeWidth={2}
                onMouseEnter={(_, i) => setActivo(conDatos[i]?.clave)}
                onMouseLeave={() => setActivo(null)}
              >
                {conDatos.map(e => (
                  <Cell
                    key={e.clave}
                    fill={COLORES_ESTADO[e.clave]}
                    opacity={activo && activo !== e.clave ? 0.35 : 1}
                  />
                ))}
              </Pie>
              <Tooltip content={<TooltipEstado />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="analytics-pie-center" aria-hidden="true">
            <strong>{numero(estados.total)}</strong>
            <span>pedidos</span>
          </div>

        </div>

      )}

      <ul className="analytics-legend">
        {estados.estados.map(e => (
          <li
            key={e.clave}
            className={activo && activo !== e.clave ? "dim" : ""}
            onMouseEnter={() => e.cantidad > 0 && setActivo(e.clave)}
            onMouseLeave={() => setActivo(null)}
          >
            <i style={{ background: COLORES_ESTADO[e.clave] }} />
            <span className="analytics-legend-label">{e.etiqueta}</span>
            <span className="analytics-legend-count">{numero(e.cantidad)}</span>
            <b>{e.porcentaje}%</b>
          </li>
        ))}
      </ul>

    </section>
  );
}

export default EstadosPieChart;
