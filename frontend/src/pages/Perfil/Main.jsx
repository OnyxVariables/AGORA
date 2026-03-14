import { useState } from "react";
import "./Main.css";
import { TarjetIcon, AddressIcon, FingerIcon } from "../../icons";
import Particles from "../../components/Particles/Particles";
import { useEffect } from "react";
import { popupError, toastSuccess } from "../../services/alerts";
import { getXsrfToken } from "../../services/xsrf";
import { API_CONFIG } from "../../config/api";

function Main() {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [input, setInput] = useState("");

  useEffect(() => {
    fetch(API_CONFIG.endpoints.ME, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setNickname(data.nickname || "");
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (nickname.length > 0) {
      popupError("El nickname ya está establecido");
      return;
    }

    if (input.trim() === "") {
      return;
    }

    try {
      const xsrfToken = await getXsrfToken();
      if (!xsrfToken) {
        popupError("No se pudo actualizar el nickname");
        console.log("No se pudo obtener el token CSRF");
        return;
      }

      const res = await fetch(API_CONFIG.endpoints.NICKNAME, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": xsrfToken,
        },
        body: JSON.stringify({ nickname: input }),
      });

      const data = await res.json();

      if (!res.ok) {
        popupError(data.error);
        return;
      }

      setNickname(input);
      setInput("");
      toastSuccess(data.message);
    } catch (err) {
      console.error(err);
      popupError("Servicio no disponible");
    }
  };

  if (!user) return null;

  return (
    <div className="layout-usuario">
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "fixed",
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

      <main className="contenedorUsuario">
        <section className="tarjeta">
          <h2>Datos del Usuario</h2>
          <div className="info">
            <p>
              <span>Nombre:</span> {user.nombre}
            </p>
            <p>
              <span>Apellidos:</span> {user.apellidos}
            </p>
            <p>
              <span>DNI:</span> {user.dni}
            </p>
            <p>
              <span>Nickname: </span>
              <span id="nicknameMostrado"> {nickname || "Sin nickname"}</span>
            </p>
            <TarjetIcon />
          </div>
        </section>

        <section className="tarjeta">
          <h2>Datos de Empadronamiento</h2>
          <div className="info">
            <p>
              <span>Municipio:</span> {user.municipio}
            </p>
            <p>
              <span>Provincia:</span> {user.provincia}
            </p>
            <p>
              <span>Comunidad autónoma:</span> {user.comunidad}
            </p>
            <p>
              <span>Nación:</span> {user.nacion}
            </p>
            <AddressIcon />
          </div>
        </section>

        <section className="tarjeta">
          <h2>Ponte un nickname</h2>
          <form className="formulario" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder=" xxxxxxxx"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit">Enviar</button>
            <FingerIcon />
          </form>
        </section>
      </main>
    </div>
  );
}

export default Main;
