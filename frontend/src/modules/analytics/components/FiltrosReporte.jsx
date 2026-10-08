import { PRESETS } from "../formato";

// =========================================================
// Barra de filtros: rango de fechas, granularidad y base
// =========================================================
function FiltrosReporte({
  preset,
  onPreset,
  personalizado,
  onPersonalizado,
  onAplicarPersonalizado,
  granularidad,
  onGranularidad,
  base,
  onBase,
  cargando
}) {

  return (

    <div className="analytics-filters">

      <div className="analytics-presets" role="tablist" aria-label="Rango de fechas">
        {PRESETS.map(p => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={preset === p.id}
            className={preset === p.id ? "analytics-chip active" : "analytics-chip"}
            onClick={() => onPreset(p.id)}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      {preset === "custom" && (

        <form
          className="analytics-custom-range"
          onSubmit={e => {
            e.preventDefault();
            onAplicarPersonalizado();
          }}
        >
          <label>
            Desde
            <input
              type="date"
              value={personalizado.desde}
              max={personalizado.hasta || undefined}
              onChange={e => onPersonalizado({ ...personalizado, desde: e.target.value })}
              required
            />
          </label>

          <label>
            Hasta
            <input
              type="date"
              value={personalizado.hasta}
              min={personalizado.desde || undefined}
              onChange={e => onPersonalizado({ ...personalizado, hasta: e.target.value })}
              required
            />
          </label>

          <button type="submit" className="analytics-apply" disabled={cargando}>
            Aplicar
          </button>
        </form>

      )}

      <div className="analytics-selects">

        <label>
          Agrupar por
          <select value={granularidad} onChange={e => onGranularidad(e.target.value)}>
            <option value="auto">Automático</option>
            <option value="dia">Día</option>
            <option value="semana">Semana</option>
            <option value="mes">Mes</option>
          </select>
        </label>

        <label>
          Ventas
          <select value={base} onChange={e => onBase(e.target.value)}>
            <option value="pagados">Solo pagadas</option>
            <option value="todos">Todas (excepto canceladas)</option>
          </select>
        </label>

      </div>

    </div>
  );
}

export default FiltrosReporte;
