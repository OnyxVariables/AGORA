function Partido({ nombre, descripcion, img, estilos }) {
  return (
    <main className="home">
      <article className="partido" style={{ background: estilos.fondo }}>
        <div>
          <h2 style={{ background: estilos.titulo }}>{nombre}</h2>
          <p>{descripcion}</p>
        </div>

        <figure>
          <img src={img} alt={nombre} />
        </figure>
      </article>
    </main>
  );
}

export default Partido;
