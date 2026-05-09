import Particles from "../../components/Particles/Particles";
import "./Main.css";
import { useNavigate } from "react-router-dom";
import { popupError, toastSuccess } from "../../services/alerts";
import { useAuth } from "../../components/PrivateRoute/AuthContext";
import { AUTH_CONFIG } from "../../config/auth";

export default function Main() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      // FIX: Content-Type en GET: fuerza preflight CORS y suele romper cross-origin (agorachain.es → auth.agorachain.es).
      const res = await fetch(AUTH_CONFIG.endpoints.CERTIFICATE, {
        method: "GET",
        credentials: "include",
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

      // Uso el contexto en lugar de localStorage
      login(role);
      // localStorage.setItem("userRole", role);

      toastSuccess("Acceso verificado");

      // Redirigo según rol
      role === 1 ? navigate("/CRUDVotations") : navigate("/Home");
    } catch (err) {
      console.error("login-cert:", err);
      popupError("Servicio no disponible");
    }
  };

  return (
    <main className="index landing">
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
      <section className="section1 landing__hero">
        <figure>
          <img src="/img/LogoAgora.png" alt="Logo" />
          <h1>Agora</h1>
        </figure>
      </section>

      {/* section 2 */}
      <section className="section2 landing__access">
        <h2>¿Listo para votar?</h2>
        <p>Ingrese su certificado digital</p>
        <button type="button" onClick={handleLogin}>
          INGRESAR
        </button>
      </section>
    </main>
  );
}
