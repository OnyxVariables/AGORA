function Partido({ nombre, descripcion, img, estilos }) {
  return (
    <main className="home parties">
      <article className="partido parties__card" style={{ background: estilos.fondo }}>
        <div className="parties__content">
          <h2 className="parties__title" style={{ background: estilos.titulo }}>{nombre}</h2>
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
