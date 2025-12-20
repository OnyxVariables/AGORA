function Partido({ nombre, descripcion, img, clase }) {
  return (
      <main className="home">
        {/* FONDO DE PARTICULAS */}
        <article className={`partido ${clase}`}>
          <div>
            <h2>{nombre}</h2>
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