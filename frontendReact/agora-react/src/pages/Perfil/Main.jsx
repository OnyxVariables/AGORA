import { useState } from "react";
import "./Main.css";
import { TarjetIcon, AddressIcon, FingerIcon } from "../../icons";
import Particles from "../../components/Particles/Particles";
import { useEffect } from "react";

function Main() {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/me", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setNickname(data.nickname || "Sin nickname");
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await fetch("/sanctum/csrf-cookie", {
        credentials: "include",
      });

      const xsrfToken = decodeURIComponent(
        document.cookie
          .split("; ")
          .find(row => row.startsWith("XSRF-TOKEN="))
          ?.split("=")[1] ?? ""
      );

      if (!xsrfToken) {
        setError("No se pudo obtener el token CSRF");
        return;
      }

      const res = await fetch("/api/nickname", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": xsrfToken,
        },
        body: JSON.stringify({ nickname: input }),
      });

      if (!res.ok) {
        setError("Error al guardar el nickname");
        return;
      }

      setNickname(input);
      setInput("");
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el backend");
    }
  };

  if (!user) return null;

  return (
    <div className="layout-usuario">

      <div style={{ width: '100%', height: '100%', position: 'fixed', inset: 0, zIndex: -1 }}>
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

      <main className="contenedorUsuario">

        <section className="tarjeta">
          <h2>Datos del Usuario</h2>
          <div className="info">
            <p><span>Nombre:</span> {user.nombre}</p>
            <p><span>Apellidos:</span> {user.apellidos}</p>
            <p><span>DNI:</span> {user.dni}</p>
            <p><span>Nickname: </span><span id="nicknameMostrado"> {nickname}</span></p>
            <TarjetIcon />
          </div>
        </section>

        <section className="tarjeta">
          <h2>Datos de Empadronamiento</h2>
          <div className="info">
            <p><span>Municipio:</span> {user.municipio}</p>
            <p><span>Provincia:</span> {user.provincia}</p>
            <p><span>Comunidad autónoma:</span> {user.comunidad}</p>
            <p><span>Nación:</span> {user.nacion}</p>
            <AddressIcon />
          </div>
        </section>

        <section className="tarjeta">
          <h2>Ponte un nickname</h2>
          <form className="formulario" onSubmit={handleSubmit}>
            <input type="text" placeholder=" xxxxxxxx" value={input} onChange={(e) => setInput(e.target.value)} />
            <button type="submit">Enviar</button>
            <FingerIcon />
          </form>
          {error && <p style={{ color: "red", marginTop: "1em" }}>{error}</p>}
        </section>

      </main>
    </div>
  );
}

export default Main;
