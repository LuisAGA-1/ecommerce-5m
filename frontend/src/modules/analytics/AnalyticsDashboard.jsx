import { useCallback, useEffect, useRef, useState } from "react";

import { getDashboard } from "../../services/analyticsService";

import FiltrosReporte from "./components/FiltrosReporte";
import KpiCards from "./components/KpiCards";
import IngresosChart from "./components/IngresosChart";
import EstadosPieChart from "./components/EstadosPieChart";
import RankingProductos from "./components/RankingProductos";

import { rangoDePreset, fechaCorta } from "./formato";

// =========================================================
// PANEL DE ANALÍTICA (solo administrador)
//
// Consume GET /api/reportes/dashboard, que devuelve en una
// sola respuesta: resumen + tickets, serie de ingresos,
// ranking de productos y distribución por estado.
// =========================================================
function AnalyticsDashboard() {

  const [preset, setPreset] = useState("30d");
  const [rango, setRango] = useState(() => rangoDePreset("30d"));
  const [personalizado, setPersonalizado] = useState(() => rangoDePreset("30d"));
  const [granularidad, setGranularidad] = useState("auto");
  const [base, setBase] = useState("pagados");
  const [limite, setLimite] = useState(5);
  const [ordenarPor, setOrdenarPor] = useState("unidades");

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Evita que una respuesta lenta pise a una más reciente.
  const ultimaPeticion = useRef(0);

  const cargar = useCallback(async () => {

    const id = ++ultimaPeticion.current;

    setCargando(true);
    setError("");

    try {

      const respuesta = await getDashboard({
        desde: rango.desde,
        hasta: rango.hasta,
        granularidad: granularidad === "auto" ? undefined : granularidad,
        base,
        limite,
        ordenarPor
      });

      if (id === ultimaPeticion.current) {
        setDatos(respuesta);
      }

    } catch (e) {

      if (id === ultimaPeticion.current) {
        setError(e.message);
      }

    } finally {

      if (id === ultimaPeticion.current) {
        setCargando(false);
      }
    }

  }, [rango, granularidad, base, limite, ordenarPor]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cambiarPreset(id) {
    setPreset(id);
    if (id !== "custom") {
      setRango(rangoDePreset(id));
    } else {
      setPersonalizado(rango);
    }
  }

  function aplicarPersonalizado() {
    if (personalizado.desde && personalizado.hasta) {
      setRango({ ...personalizado });
    }
  }

  return (

    <div className="analytics">

      <div className="analytics-header">

        <div>
          <h2>Reportes y analítica</h2>
          <p>
            Métricas de rendimiento comercial
            {datos && (
              <>
                {" · "}
                <b>{fechaCorta(datos.rango.desde)}</b> al <b>{fechaCorta(datos.rango.hasta)}</b>
                {" · comparado con "}
                {fechaCorta(datos.periodoAnterior.desde)} – {fechaCorta(datos.periodoAnterior.hasta)}
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          className="analytics-refresh"
          onClick={cargar}
          disabled={cargando}
        >
          {cargando ? "Actualizando…" : "Actualizar"}
        </button>

      </div>

      <FiltrosReporte
        preset={preset}
        onPreset={cambiarPreset}
        personalizado={personalizado}
        onPersonalizado={setPersonalizado}
        onAplicarPersonalizado={aplicarPersonalizado}
        granularidad={granularidad}
        onGranularidad={setGranularidad}
        base={base}
        onBase={setBase}
        cargando={cargando}
      />

      {error && (
        <div className="analytics-error" role="alert">
          {error}
        </div>
      )}

      {!datos && cargando && (
        <div className="analytics-loading">Cargando métricas…</div>
      )}

      {datos && (

        <div className={cargando ? "analytics-body is-loading" : "analytics-body"}>

          <KpiCards
            resumen={datos.resumen}
            variacion={datos.variacion}
          />

          <div className="analytics-grid">

            <IngresosChart
              ingresos={datos.ingresos}
              granularidad={datos.rango.granularidad}
            />

            <EstadosPieChart estados={datos.estados} />

          </div>

          <RankingProductos
            ranking={datos.productosTop}
            limite={limite}
            onLimite={setLimite}
            ordenarPor={ordenarPor}
            onOrdenarPor={setOrdenarPor}
          />

          <p className="analytics-note">
            {base === "pagados"
              ? "Ingresos, tickets y ranking consideran solo pedidos pagados (aceptados o enviados)."
              : "Ingresos, tickets y ranking consideran pedidos pendientes, pagados y enviados; se excluyen los cancelados."}
            {" "}La distribución por estado incluye todos los pedidos del período.
          </p>

        </div>

      )}

    </div>
  );
}

export default AnalyticsDashboard;
