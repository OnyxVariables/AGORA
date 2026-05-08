import Particles from "../../components/Particles/Particles";
import Tooltip from "../../components/Tooltip/Tooltip";
import Partido from "./Partido";
import "./Main.css";
import { usePartiesCatalog } from "../../data/partidos";

function Main() {
  const { partidos, loading } = usePartiesCatalog();

  return (
    <main className="main-partidos parties-list">
      {/* FONDO PARTICLES */}
      <div
        style={{
          width: "100%",
          height: "100vh",
          position: "fixed",
          inset: 0,
          zIndex: -1,
        }}
      >
        <Particles
          particleColors={["#d4a0ff", "#a066ff", "#6a00d4"]}
          particleCount={5000}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={false}
          alphaParticles={true}
          disableRotation={true}
        />
      </div>

      {loading && <p className="parties-list__status">Cargando partidos…</p>}

      {!loading && partidos.length === 0 && (
        <p className="parties-list__status">No hay partidos registrados.</p>
      )}

      {!loading &&
        partidos.map((p) => (
          <Partido
            key={p.id}
            nombre={p.nombre}
            descripcion={p.descripcion}
            img={p.imagen}
            estilos={{
              fondo: p.colores.fondo,
              titulo: p.colores.titulo,
            }}
            inactive={!p.active}
          />
        ))}
    </main>
  );
}

export default Main;