import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PartidoCard from "./Main";
import "./Main.css";
import Particles from "../../components/Particles/Particles";
import { popupError, toastSuccess, popupConfirm, Popup, toastTiny } from "../../services/alerts";
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
  const navigate = useNavigate();
  const [activeVotation, setActiveVotation] = useState(null);
  const [votationLoading, setVotationLoading] = useState(true);
  const { partidos, loading } = useParties(activeVotation?.id ?? false);
  const [selection, setSelection] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadActiveVotation = async () => {
      try {
        const res = await fetch(API_CONFIG.endpoints.VOTATION_ACTIVE, {
          credentials: "include",
        });
        if (cancelled) return;
        if (res.status === 404) {
          // 404 indica explícitamente "sin votación activa": redirigimos a /home
          // para evitar dejar al usuario en una página sin acción posible.
          Popup.fire({
            icon: "info",
            title: "No hay votación activa disponible",
            text: "Te llevamos a la página principal.",
            timer: 2200,
            showConfirmButton: false,
          }).finally(() => {
            navigate("/home", { replace: true });
          });
          setVotationLoading(false);
          return;
        }
        if (!res.ok) {
          popupError("No se pudo obtener la votación activa");
          setVotationLoading(false);
          return;
        }
        const data = await res.json();
        setActiveVotation(data);
      } catch (err) {
        console.log(err);
        if (!cancelled) {
          popupError("Servicio no disponible");
        }
      } finally {
        if (!cancelled) {
          setVotationLoading(false);
        }
      }
    };
    void loadActiveVotation();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

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
      Popup.fire({
        icon: "error",
        title: "Es necesario un nickname para votar",
        confirmButtonText: "Ir a perfil",
      }).then(() => {
        navigate("/perfil");
      });
      return;
    }


    if (!activeVotation) {
      popupError("No hay votación activa disponible");
      return;
    }

    const votationId = Number(activeVotation.id);
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

      await Popup.fire({
        icon: "success",
        title: "Código de verificación",
        html: `<div style="text-align:center;">
          <div style="font-size:1.2em;font-weight:bold;margin-bottom:1em;word-break:break-all;">${codigo}</div>
          <div style="font-size:0.9em;color:#666;margin-top:0.5em;">GUARDA ESTE CÓDIGO<br/>Es la única forma de consultar tu voto</div>
        </div>`,
        showConfirmButton: true,
        showCancelButton: false,
        confirmButtonText: "Copiar",
        confirmButtonColor: "#3d0091",
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then((result) => {
        if (result.isConfirmed) {
          navigator.clipboard.writeText(codigo);
          toastTiny("Copiado");
        }
      });
      toastSuccess(data.message);
    } catch (err) {
      console.error(err);
      popupError("Servicio no disponible");
    }
  };

  if (votationLoading) {
    return <main className="background voting-page">Cargando votación...</main>;
  }

  if (!activeVotation) {
    return <main className="background voting-page">No hay votación activa disponible</main>;
  }

  if (loading) {
    return <main className="background voting-page">Cargando partidos...</main>;
  }

  return (
    <main className="background voting-page">
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
          particleCount={5000}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={false}
          alphaParticles={true}
          disableRotation={true}
        />
      </div>
      {partidos.length === 0 && (
        <p className="voting-page__empty">No hay partidos disponibles para esta votación.</p>
      )}
      {partidos.length > 0 && (
        <div className="grid-partidos voting-page__grid">
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
      )}
      <div className="submit voting-page__submit">
        <button className="enviar voting-page__submit-button" onClick={handleSubmit}>
          Enviar
        </button>
      </div>
    </main>
  );
}

export default Partidos;
