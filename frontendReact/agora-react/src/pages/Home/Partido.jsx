function Partido({ nombre, descripcion, img, clase }) {
  return (
    <article className={`partido ${clase}`}>
      <div>
        <h2>{nombre}</h2>
        <p>{descripcion}</p>
      </div>
      <figure>
        <img src={img} alt={nombre} />
      </figure>
    </article>
  );
}

export default Partido;