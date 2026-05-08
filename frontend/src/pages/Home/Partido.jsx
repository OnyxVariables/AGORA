function Partido({ nombre, descripcion, img, estilos, inactive = false }) {
  return (
    <main className="home parties">
      <article
        className={`partido parties__card ${inactive ? "parties__card--inactive" : ""}`}
        style={{ background: estilos.fondo }}
      >
        <div className="parties__content">
          <h2 className="parties__title" style={{ background: estilos.titulo }}>
            {nombre}
            {inactive && (
              <span className="parties__inactive-badge" title="Partido inactivo">
                Inactivo
              </span>
            )}
          </h2>
          <p className="parties__description">{descripcion}</p>
        </div>

        <figure className="parties__media">
          <img src={img} alt={nombre} />
        </figure>
      </article>
    </main>
  );
}

export default Partido;
