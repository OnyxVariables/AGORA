import { useState } from "react";
import PartidoCard from "./Main";
import "./Main.css";
import Particles from "../../components/Particles/Particles";
import { popupError, toastSuccess, popupConfirm } from "../../services/alerts";
import { useParties } from "../../data/partidos";
import { getXsrfToken } from "../../services/xsrf";
import { keccak256, toUtf8Bytes } from "ethers";
import { API_CONFIG } from "../../config/api";

// Genera 256 bits seguros
function generarCodigo() {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function Partidos() {
  const { partidos, loading } = useParties();
  const [selection, setSelection] = useState(null);

  const toggleSelection = (currentValue) => {
    setSelection((previousValue) =>
      previousValue === currentValue ? null : currentValue,
    );
  };

  //Datos completos de usuario
  const getUser = async () => {
    try {
      const res = await fetch(API_CONFIG.endpoints.ME, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        popupError(data.error);
        return null;
      }

      return data; //Aqui incluye nickname y municipality
    } catch (err) {
      console.log(err);
      popupError("Servicio no disponible");
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selection) {
      popupError("Selecciona un partido para votar");
      return;
    }

    // Cojo el usuario 
    const user = await getUser();

    if (!user?.nickname) {
      popupError("Es necesario un nickname para votar");
      return;
    }


    // Cojo la votación activa
    const resVotation = await fetch(API_CONFIG.endpoints.VOTATION_ACTIVE, {
      credentials: "include",
    });
    if (!resVotation.ok) {
      popupError("No se pudo obtener la votación activa");
      return;
    }
    const votationData = await resVotation.json();

    const votationId = Number(votationData.id);
    const partido = partidos.find((p) => p.value === selection);
    if (!partido) {
      popupError("Partido no válido");
      return;
    }

    const isConfirmed = await popupConfirm(
      `Desea votar a ${partido.nombre}`,
      "Esta acción es irreversible",
    );

    if (!isConfirmed) return;
    
    try {
      const xsrfToken = await getXsrfToken();
      if (!xsrfToken) {
        popupError("No se pudo enviar el voto");
        console.log("No se pudo obtener el token CSRF");
        return;
      }

      //Genero codigo y hash
      const codigo = generarCodigo();
      const input = user.nickname + codigo + String(votationId);
      const voteHash = keccak256(toUtf8Bytes(input));

      if (!user.municipalityId) {
        popupError("No se pudo determinar el municipio del usuario");
        return;
      }

      const res = await fetch(API_CONFIG.endpoints.VOTE, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": xsrfToken,
        },
        body: JSON.stringify({
          partyId: partido.id,
          municipalityId: user.municipalityId,
          votationId: votationId,
          voteHash: voteHash,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        popupError(data.error);
        return;
      }

      await popupConfirm(
        `Voto registrado correctamente.
        Tu código de verificación es: ${codigo}
        GUARDA ESTE CÓDIGO.
        Es la única forma de consultar tu voto.`,
        "Código de verificación"
      );
      toastSuccess(data.message);
    } catch (err) {
      console.error(err);
      popupError("Servicio no disponible");
    }
  };

  if (loading) {
    return <main className="background">Cargando partidos...</main>;
  }

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
