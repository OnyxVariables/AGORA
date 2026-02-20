import "./Main.css";

const Main = ({
  nombre,
  value,
  colorFondo,
  colorTitulo,
  imagen,
  isSelected,
  onSelect,
}) => {
  return (
    <article className="card" style={{ background: colorFondo }}>
      <div className="info">
        <h2 style={{ background: colorTitulo }}>{nombre}</h2>
        <div className="voto">
          <p>VOTAR: </p>
          <div className="votos">
            <label className="cyber-checkbox">
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
      <figure>
        <img src={imagen} alt={`Logo ${nombre}`} />
      </figure>
    </article>
  );
};

export default Main;
