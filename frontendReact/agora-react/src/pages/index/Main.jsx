import "./Main.css";

export default function Main() {
  return (
    <main>
      {/* section 1 */}
      <section className="section1">
        <figure>
          <img src="/img/LogoAgora.png" alt="Logo" />
          <h1>AGORA</h1>
        </figure>
      </section>

      {/* section 2 */}
      <section className="section2">
        <h2>¿Listo para votar?</h2>
        <p>Ingrese su certificado digital</p>
        <button type="button">INGRESAR</button>
      </section>

      {/* footer */}
      <footer>
        <div className="spinner">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </footer>
    </main>
  );
}