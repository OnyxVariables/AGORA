import { useState } from "react";
import PartidoCard from "./Main";
import "./Main.css";
import Particles from "../../components/Particles/Particles";

const partidos = [
  { id: 1, nombre: "PP", value: "PP", colorFondo: "#5eadf8", colorTitulo: "#1d5ea8", imagen: "img/PP.jpg" },
  { id: 2, nombre: "PSOE", value: "PSOE", colorFondo: "#fd7671", colorTitulo: "#b3201e", imagen: "img/PSOE.png" },
  { id: 3, nombre: "PODEMOS", value: "PODEMOS", colorFondo: "#d57bfc", colorTitulo: "#6d2d8e", imagen: "img/Podemos.png" },
  { id: 4, nombre: "C’s", value: "CS", colorFondo: "#ffb347", colorTitulo: "#d97900", imagen: "img/Ciudadanos.png" },
  { id: 5, nombre: "VOX", value: "VOX", colorFondo: "#8cfa80", colorTitulo: "#4aa63b", imagen: "img/VOX.png" },
  { id: 6, nombre: "ehbildu", value: "ehbildu", colorFondo: "#00d0b3", colorTitulo: "#008b79ff", imagen: "img/ehbildu.png" },
  { id: 7, nombre: "compromís", value: "compromis", colorFondo: "#ef8518", colorTitulo: "#ad5700ff", imagen: "img/Compromís.png" },
  { id: 8, nombre: "CC", value: "cc", colorFondo: "#f3ff52ff", colorTitulo: "#a2aa33ff", imagen: "img/coalicionCanaria.png" },
  { id: 9, nombre: "junts", value: "junst", colorFondo: "#20c0b2", colorTitulo: "#158b82ff", imagen: "img/junts.png" },
  { id: 10, nombre: "Más Madrid", value: "madrid", colorFondo: "#54efa5", colorTitulo: "#3aac75ff", imagen: "img/masMadrid.png" },
]; //Si quisiera meter mas partidos los meto aqui

// TODO(srvariable): Refactor functions in another file
function readXsrfToken() {
  return decodeURIComponent(
    document.cookie
      .split("; ")
      .find(row => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1]
    ?? ""
  );
}

async function getXsrfToken() {
  // If we already have the token, return it, no need to fetch again
  const xsrfToken = readXsrfToken();
  if (xsrfToken) {
    return xsrfToken;
  }

  await fetch("/sanctum/csrf-cookie", {
    credentials: "include",
  });

  return readXsrfToken();;
}

function Partidos() {
  const [selection, setSelection] = useState();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const toggleSelection = (currentValue) => {
    setSelection((previousValue) => (previousValue === currentValue ? null : currentValue));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selection) {
      setError("Selecciona un partido antes de enviar tu voto.");
      return;
    }

    try {
      const xsrfToken = await getXsrfToken();
      if (!xsrfToken) {
        setError("No se pudo obtener el token CSRF");
        return;
      }

      const res = await fetch("/api/vote", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": xsrfToken,
        },
        body: JSON.stringify({
          vote: {
            partyId: partidos.find(p => p.value === selection).id,
            votationId: 1, // TODO(srvariable): Think about a way to know votationId dynamically
          }
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess(data.message);
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el backend");
    }
  }

  return (
    <main className="background">
      {/* FONDO DE PARTICULAS */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: -1 }}>
        <Particles
          particleColors={['#d4a0ff', '#a066ff', '#6a00d4']}
          particleCount={20000}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={false}
          alphaParticles={true}
          disableRotation={true}
        />
      </div>
      <div className="grid-partidos">
        {partidos.map((partido) => (
          <PartidoCard
            key={partido.value}
            {...partido}
            isSelected={selection === partido.value}
            onSelect={() => { toggleSelection(partido.value) }} />
        ))}
      </div>
      <div className="submit">
        <button className="enviar" onClick={handleSubmit}>Enviar</button>
      </div>
      {error && <p style={{ color: "red", marginTop: "1em" }}>{error}</p>}
      {success && <p style={{ color: "green", marginTop: "1em" }}>{success}</p>}
    </main>
  );
}

export default Partidos;
