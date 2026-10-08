import { moneda, numero } from "../formato";

// =========================================================
// Ranking de productos con mayor rotación
// =========================================================
function RankingProductos({ ranking, limite, onLimite, ordenarPor, onOrdenarPor }) {

  const productos = ranking.productos;
  const campoBarra = ordenarPor === "ingresos" ? "participacionIngresos" : "participacionUnidades";
  const maximo = Math.max(...productos.map(p => p[campoBarra]), 1);

  return (

    <section className="analytics-card analytics-card-wide">

      <header className="analytics-card-header">

        <div>
          <h3>Productos más vendidos</h3>
          <span>Top {limite} por {ordenarPor === "ingresos" ? "monto recaudado" : "unidades vendidas"}</span>
        </div>

        <div className="analytics-ranking-controls">

          <div className="analytics-toggle" role="group" aria-label="Ordenar ranking">
            <button
              type="button"
              className={ordenarPor === "unidades" ? "active" : ""}
              onClick={() => onOrdenarPor("unidades")}
            >
              Unidades
            </button>
            <button
              type="button"
              className={ordenarPor === "ingresos" ? "active" : ""}
              onClick={() => onOrdenarPor("ingresos")}
            >
              Ingresos
            </button>
          </div>

          <div className="analytics-toggle" role="group" aria-label="Cantidad de productos">
            {[5, 10].map(n => (
              <button
                key={n}
                type="button"
                className={limite === n ? "active" : ""}
                onClick={() => onLimite(n)}
              >
                Top {n}
              </button>
            ))}
          </div>

        </div>

      </header>

      {productos.length === 0 ? (

        <div className="analytics-empty">No hay ventas de productos en este rango.</div>

      ) : (

        <div className="analytics-table-wrap">

          <table className="analytics-table">

            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th className="num">Unidades</th>
                <th className="num">Monto recaudado</th>
                <th className="num">Pedidos</th>
                <th className="share">Participación</th>
              </tr>
            </thead>

            <tbody>
              {productos.map(p => (
                <tr key={p.productoId}>
                  <td>
                    <span className={`analytics-rank rank-${p.posicion}`}>{p.posicion}</span>
                  </td>
                  <td className="analytics-product-name">{p.nombre}</td>
                  <td className="num">{numero(p.unidades)}</td>
                  <td className="num">{moneda(p.ingresos)}</td>
                  <td className="num">{numero(p.pedidos)}</td>
                  <td className="share">
                    <div className="analytics-share">
                      <div
                        className="analytics-share-bar"
                        style={{ width: `${(p[campoBarra] / maximo) * 100}%` }}
                      />
                      <span>{p[campoBarra]}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>

        </div>

      )}

    </section>
  );
}

export default RankingProductos;
