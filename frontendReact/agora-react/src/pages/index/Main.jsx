import Particles from "../../components/Particles/Particles";
import "./Main.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Main() {
  const navigate = useNavigate();
  
  const Toast = Swal.mixin({
    toast: true,
    showConfirmButton: false,
    position: 'bottom-end',
    timer: 2000,
    timerProgressBar: true,
    width: '200px',
    padding: '0.5em',
  });
  
  const Popup = Swal.mixin({
    toast: false,
    confirmButtonColor: "#3d0091",
    allowOutsideClick: true,
    allowEscapeKey: true,
    customClass: {
      popup: 'custom-popup',
      container: "custom-backdrop"
    }
  });

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
        Popup.fire({
          title: "Acceso denegado",
          icon: "error"
        });
        return;
      }

      const data = await res.json();
      const role = data.roleId;

      //Error si role  no es 1 o 2 (para contemplar todos los casos)
      if (!role || (role !== 1 && role !== 2)) {
        Popup.fire({
          title: "No se ha podido verificar el acceso",
          icon: "error"
        });
        return;
      }
      localStorage.setItem("userRole", role);

      await Toast.fire({
        icon: "success",
        title: "Acceso verificado",
      });

      // Redirigo según rol
      if (role === 1) navigate("/CRUDVotations");
      if (role === 2) navigate("/Home");
    } catch (err) {
      Popup.fire({
        title: "Servicio no disponible",
        icon: "error"
      });
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
