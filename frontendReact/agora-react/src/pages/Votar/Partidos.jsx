import { useState } from "react";
import PartidoCard from "./Main";
import "./Main.css";
import Particles from "../../components/Particles/Particles";
import { popupError, toastSuccess, popupConfirm } from "../../services/alerts";
import { PARTIDOS } from "../../data/partidos";
import { getXsrfToken } from "../../services/xsrf";

const partidos = PARTIDOS.map((p) => ({
  id: p.id,
  nombre: p.nombre,
  value: p.value,
  colorFondo: p.colores.fondo,
  colorTitulo: p.colores.titulo,
  imagen: p.imagen,
}));

function Partidos() {
  const [selection, setSelection] = useState();

  const toggleSelection = (currentValue) => {
    setSelection((previousValue) =>
      previousValue === currentValue ? null : currentValue,
    );
  };

  const hasNickname = async () => {
    try {
      const res = await fetch("/api/me", {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        popupError(data.error);
        return;
      }

      return data?.nickname?.length > 0;
    } catch (err) {
      console.log(err);
      popupError("Servicio no disponible");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selection) {
      popupError("Selecciona un partido para votar");
      return;
    }

    if (!(await hasNickname())) {
      popupError("Es necesario un nickname para votar");
      return;
    }

    await popupConfirm(
      `Desea votar a ${partidos.find((p) => p.value === selection).nombre}`,
      "Esta acción es irreversible",
    );

    try {
      const xsrfToken = await getXsrfToken();
      if (!xsrfToken) {
        popupError("No se pudo enviar el voto");
        console.log("No se pudo obtener el token CSRF");
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
            partyId: partidos.find((p) => p.value === selection).id,
            votationId: 1, // TODO(srvariable): Think about a way to know votationId dynamically
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        popupError(data.error);
        return;
      }

      toastSuccess(data.message);
    } catch (err) {
      console.error(err);
      popupError("Servicio no disponible");
    }
  };

  return (
    <main className="background">
      {/* FONDO DE PARTICULAS */}
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
            onSelect={() => {
              toggleSelection(partido.value);
            }}
          />
        ))}
      </div>
      <div className="submit">
        <button className="enviar" onClick={handleSubmit}>
          Enviar
        </button>
      </div>
    </main>
  );
}

export default Partidos;
