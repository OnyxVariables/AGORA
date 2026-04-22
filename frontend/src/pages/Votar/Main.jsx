import "./Main.css";

const Main = ({
  nombre,
  value,
  imagen,
  colores,
  isSelected,
  onSelect,
}) => {
  return (
    <article className="card vote-card" style={{ background: colores.fondo }}>
      <div className="info vote-card__info">
        <h2 className="vote-card__title" style={{ background: colores.titulo }}>{nombre}</h2>
        <div className="voto vote-card__vote">
          <p>VOTAR: </p>
          <div className="votos vote-card__vote-options">
            <label className="cyber-checkbox vote-card__checkbox">
              <input
                type="checkbox"
                name="partido"
                value={value}
                checked={isSelected}
                onChange={onSelect}
              />
              <span className="cyber-checkbox__mark">
                <div className="cyber-checkbox__box">
                  <svg className="cyber-checkbox__check" viewBox="0 0 12 10">
                    <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
                  </svg>
                </div>
                <div className="cyber-checkbox__particles">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className={`particle-${i + 1}`}></div>
                  ))}
                </div>
                <div className="cyber-checkbox__effects">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="cyber-checkbox__spark"></div>
                  ))}
                </div>
              </span>
            </label>
          </div>
        </div>
      </div>
      <figure className="vote-card__media">
        <img src={imagen} alt={`Logo ${nombre}`} />
      </figure>
    </article>
  );
};

export default Main;
