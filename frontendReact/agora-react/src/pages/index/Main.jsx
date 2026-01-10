import Particles from "../../components/Particles/Particles";
import "./Main.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Main() {

  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("https://localhost/api/login-cert", {
        method: "GET",
        credentials: "include", // para sesion
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al autenticar");
        return;
      }

      const data = await res.json();
      const role = data.roleId;

      localStorage.setItem("userRole", role);

      // Redirigo según rol
      if (role === 1) navigate("/CRUDVotations");
      if (role === 2) navigate("/Home");
    } catch (err) {
      setError("Error de conexión con el backend");
    }
  };

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
        <button type="button" onClick={handleLogin}>INGRESAR</button>
        {error && <p style={{ color: "red", marginTop: "1em" }}>{error}</p>}
      </section>
    </main>
  );
}
