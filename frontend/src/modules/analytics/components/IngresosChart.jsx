import { useState } from "react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

import { moneda, numero, etiquetaPeriodo } from "../formato";

function TooltipIngresos({ active, payload, granularidad }) {

  if (!active || !payload?.length) return null;

  const punto = payload[0].payload;

  return (
    <div className="analytics-tooltip">
      <strong>{etiquetaPeriodo(punto.periodo, granularidad, true)}</strong>
      <span>Ingresos: <b>{moneda(punto.ingresos)}</b></span>
      <span>Pedidos: <b>{numero(punto.pedidos)}</b></span>
    </div>
  );
}

// =========================================================
// Tendencia de ingresos (área o barras)
// =========================================================
function IngresosChart({ ingresos, granularidad }) {

  const [tipo, setTipo] = useState("area");

  const datos = ingresos.serie;
  const formatoX = valor => etiquetaPeriodo(valor, granularidad);
  const formatoY = valor => moneda(valor, true);

  const comunes = {
    data: datos,
    margin: { top: 10, right: 12, left: 4, bottom: 0 }
  };

  const ejes = [
    <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />,
    <XAxis
      key="x"
      dataKey="periodo"
      tickFormatter={formatoX}
      tick={{ fontSize: 11, fill: "#6b7280" }}
      tickLine={false}
      axisLine={{ stroke: "#e5e7eb" }}
      minTickGap={18}
    />,
    <YAxis
      key="y"
      tickFormatter={formatoY}
      tick={{ fontSize: 11, fill: "#6b7280" }}
      tickLine={false}
      axisLine={false}
      width={64}
    />,
    <Tooltip
      key="tooltip"
      content={<TooltipIngresos granularidad={granularidad} />}
      cursor={{ fill: "rgba(30, 58, 138, 0.06)", stroke: "#1e3a8a", strokeOpacity: 0.2 }}
    />
  ];

  return (

    <section className="analytics-card analytics-card-wide">

      <header className="analytics-card-header">

        <div>
          <h3>Tendencia de ingresos</h3>
          <span>
            Total {moneda(ingresos.total)} · Promedio por{" "}
            {granularidad === "mes" ? "mes" : granularidad === "semana" ? "semana" : "día"}{" "}
            {moneda(ingresos.promedioPorPeriodo)}
          </span>
        </div>

        <div className="analytics-toggle" role="group" aria-label="Tipo de gráfica">
          <button
            type="button"
            className={tipo === "area" ? "active" : ""}
            onClick={() => setTipo("area")}
          >
            Líneas
          </button>
          <button
            type="button"
            className={tipo === "barras" ? "active" : ""}
            onClick={() => setTipo("barras")}
          >
            Barras
          </button>
        </div>

      </header>

      <div className="analytics-chart">

        <ResponsiveContainer width="100%" height={300}>

          {tipo === "area" ? (

            <AreaChart {...comunes}>
              <defs>
                <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e3a8a" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              {ejes}
              <Area
                type="monotone"
                dataKey="ingresos"
                name="Ingresos"
                stroke="#1e3a8a"
                strokeWidth={2}
                fill="url(#gradIngresos)"
                activeDot={{ r: 5 }}
              />
            </AreaChart>

          ) : (

            <BarChart {...comunes}>
              {ejes}
              <Bar
                dataKey="ingresos"
                name="Ingresos"
                fill="#1e3a8a"
                radius={[4, 4, 0, 0]}
                maxBarSize={42}
              />
            </BarChart>

          )}

        </ResponsiveContainer>

      </div>

      {ingresos.mejorPeriodo && (
        <p className="analytics-footnote">
          Mejor período: <b>{etiquetaPeriodo(ingresos.mejorPeriodo.periodo, granularidad, true)}</b>{" "}
          con {moneda(ingresos.mejorPeriodo.ingresos)} en {numero(ingresos.mejorPeriodo.pedidos)} pedidos.
        </p>
      )}

    </section>
  );
}

export default IngresosChart;
