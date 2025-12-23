import Particles from "../../components/Particles/Particles";
import "./Main.css";

export default function Main() {
  return (
    <main className="index">

      {/* FONDO DE PARTICULAS */}
      <div style={{ width: '100%', height: '100vh', position: 'absolute', pointerEvents: "none" }}>
        <Particles
        particleColors={['#d4a0ff', '#a066ff', '#6a00d4']}
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
      <section className="section1">
        <figure>
          <img src="/img/LogoAgora.png" alt="Logo" />
          <h1>Agora</h1>
        </figure>
      </section>

      {/* section 2 */}
      <section className="section2">
        <h2>¿Listo para votar?</h2>
        <p>Ingrese su certificado digital</p>
        <button type="button">INGRESAR</button>
      </section>
    </main>
  );
}