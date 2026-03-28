import { Link } from "react-router-dom";
import Particles from "../../components/Particles/Particles";
import "./Main.css";

export default function Main() {
  return (
    <main className="mainError">
      {/* FONDO DE PARTICULAS */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <Particles
          particleColors={["#d4a0ff", "#a066ff", "#6a00d4"]}
          particleCount={10000}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={false}
          alphaParticles={true}
          disableRotation={true}
        />
      </div>

      {/* section 1 */}
      <section className="error">
        <article className="errorMessage">
          <h1>404 – Aquí no hay nada que votar</h1>
          <h2>Este bloque está más vacío que una urna sin elecciones</h2>
          <h3>
            Mejor vuelve al inicio y sigue votando con blockchain, sin trampas y
            sin papeletas perdidas.
          </h3>
          <Link to="/">Ir a la página de inicio</Link>
        </article>
        <article className="errorImg">
          <picture>
            <img src="/img/error404.png" alt="Blockchain" />
          </picture>
        </article>
      </section>
    </main>
  );
}
