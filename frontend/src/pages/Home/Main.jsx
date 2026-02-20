import Particles from "../../components/Particles/Particles";
import Partido from "./Partido";
import "./Main.css";
import { PARTIDOS } from "../../data/partidos";

function Main() {
  return (
    <main className="main-partidos">
      {/* FONDO PARTICLES */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0,
          zIndex: -1,
        }}
      >
        <Particles
          particleColors={["#d4a0ff", "#a066ff", "#6a00d4"]}
          particleCount={50000} //Queda bonito asi pero tarda un poco más en cargar
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={false}
          alphaParticles={true}
          disableRotation={true}
        />
      </div>

      {PARTIDOS.map((p) => (
        <Partido
          key={p.id}
          nombre={p.nombre}
          descripcion={p.descripcion}
          img={p.imagen}
          estilos={{
            fondo: p.colores.fondo,
            titulo: p.colores.titulo,
          }}
        />
      ))}

    </main>
  );
}

export default Main;
