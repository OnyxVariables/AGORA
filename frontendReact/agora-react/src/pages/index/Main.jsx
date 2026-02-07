import Particles from "../../components/Particles/Particles";
import "./Main.css";
import { useNavigate } from "react-router-dom";
import { popupError, toastSuccess } from "../../services/alerts";

export default function Main() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/login-cert", {
        method: "GET",
        credentials: "include", // para sesion
        headers: {
          "Content-Type": "application/json",
        },
      });

      //Error respuesta mala
      if (!res.ok) {
        popupError("Acceso denegado");
        return;
      }

      const data = await res.json();
      const role = data.roleId;

      //Error si role  no es 1 o 2 (para contemplar todos los casos)
      if (!role || (role !== 1 && role !== 2)) {
        popupError("No se ha podido verificar el acceso");
        return;
      }
      localStorage.setItem("userRole", role);

      await toastSuccess("Acceso verificado");

      // Redirigo según rol
      if (role === 1) navigate("/CRUDVotations");
      if (role === 2) navigate("/Home");
    } catch (err) {
      popupError("Servicio no disponible");
    }
  };

  return (
    <main className="index">
      {/* FONDO DE PARTICULAS */}
      <div
        style={{
          width: "100%",
          height: "100vh",
          position: "absolute",
          pointerEvents: "none",
        }}
      >
        <Particles
          particleColors={["#d4a0ff", "#a066ff", "#6a00d4"]}
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
        <button type="button" onClick={handleLogin}>
          INGRESAR
        </button>
      </section>
    </main>
  );
}
