import { createContext, useContext, useEffect, useState } from "react";
import { getXsrfToken } from "../../services/xsrf";
import { popupError, toastSuccess } from "../../services/alerts";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "../../config/api";

const AuthContext = createContext();
const SESSION_STORAGE_KEYS_TO_CLEAR = [
  "agora_seen_active_votations",
  "agora_seen_finisihed_votations",
  "agora_seed_pending_votations",
];

export const AuthProvider = ({ children }) => {
  // El rol se queda aquí, si es null no hay sesión (tras comprobar cookie en el servidor)
  const [userRole, setUserRole] = useState(null);
  // Evita redirigir a / antes de restaurar la sesión Sanctum tras un F5
  const [authReady, setAuthReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      try {
        const res = await fetch(
          `${API_CONFIG.baseURL}${API_CONFIG.endpoints.ME}`,
          { credentials: "include" },
        );
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          const rid = data.roleId;
          if (rid === 1 || rid === 2) {
            setUserRole(Number(rid));
          }
        }
      } catch (e) {
        console.debug("No se pudo restaurar sesión:", e);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    };
    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = (role) => setUserRole(role);

  const logout = async () => {
    try {
      const xsrfToken = await getXsrfToken();

      if (!xsrfToken) {
        popupError("No se pudo cerrar sesión de forma segura");
        console.log("No se pudo obtener el token CSRF");
        return;
      }

      const res = await fetch(API_CONFIG.endpoints.LOGOUT, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-XSRF-TOKEN": xsrfToken,
        },
      });

      if (!res.ok) {
        popupError("Error al cerrar sesión en el servidor");
        return;
      }

      SESSION_STORAGE_KEYS_TO_CLEAR.forEach((key) => {
        localStorage.removeItem(key);
      });
      setUserRole(null);
      setAuthReady(true);
      toastSuccess("Sesión cerrada");
      navigate("/"); //Con esto la pagina no recarga, con la redirección sí

    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      popupError("Error al cerrar sesión");
    }
  };

  return (
    <AuthContext.Provider value={{ userRole, authReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);