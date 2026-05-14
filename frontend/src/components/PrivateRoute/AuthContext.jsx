import { createContext, useContext, useEffect, useState } from "react";
import { getXsrfToken } from "../../services/xsrf";
import { popupError, toastSuccess } from "../../services/alerts";
import { useLocation, useNavigate } from "react-router-dom";
import { API_CONFIG } from "../../config/api";
import { AUTH_DISABLED, resolveRoleFromPathname } from "../../config/runtime";

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
  const location = useLocation();

  const derivedRole = AUTH_DISABLED ? resolveRoleFromPathname(location.pathname) : userRole;
  const ready = AUTH_DISABLED ? true : authReady;

  useEffect(() => {
    if (AUTH_DISABLED) {
      return undefined;
    }

    let cancelled = false;
    const restoreSession = async () => {
      try {
        const res = await fetch(
          `${API_CONFIG.baseURL}${API_CONFIG.endpoints.ME}`,
          {
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          },
        );
        if (cancelled) return;
        const raw = await res.text();
        if (cancelled) return;
        // Evita SyntaxError si nginx/Laravel devuelve HTML (500, SPA fallback, redirect).
        if (raw.trimStart().startsWith("<")) {
          console.debug(
            "Sesión: respuesta HTML en lugar de JSON. Revisar nginx /api y logs Laravel. Status:",
            res.status,
          );
          return;
        }
        if (!res.ok) {
          return;
        }
        let data;
        try {
          data = JSON.parse(raw);
        } catch (e) {
          console.debug("No se pudo restaurar sesión:", e);
          return;
        }
        const rid = data.roleId;
        if (rid === 1 || rid === 2) {
          setUserRole(Number(rid));
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

  const login = (role) => {
    if (!AUTH_DISABLED) {
      setUserRole(role);
    }
  };

  const logout = async () => {
    SESSION_STORAGE_KEYS_TO_CLEAR.forEach((key) => {
      localStorage.removeItem(key);
    });

    if (AUTH_DISABLED) {
      toastSuccess("Modo inseguro activo");
      navigate("/");
      return;
    }

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
    <AuthContext.Provider value={{ userRole: derivedRole, authReady: ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);