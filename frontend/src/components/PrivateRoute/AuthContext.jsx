import { createContext, useContext, useState } from "react";
import { getXsrfToken } from "../../services/xsrf";
import { popupError, toastSuccess } from "../../services/alerts";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // El rol se queda aquí, si es null no hay sesión.
  const [userRole, setUserRole] = useState(null);

  const login = (role) => setUserRole(role);
  
  const logout = async () => {
    try {
      const xsrfToken = await getXsrfToken();

      if (!xsrfToken) {
        popupError("No se pudo cerrar sesión de forma segura");
        console.log("No se pudo obtener el token CSRF");
        return;
      }

      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-XSRF-TOKEN": xsrfToken,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        popupError("Error al cerrar sesión en el servidor");
        return;
      }

      setUserRole(null);
      window.location.href = "/";
      toastSuccess("Sesión cerrada");

    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      popupError("Error al cerrar sesión");
    }
  };

  return (
    <AuthContext.Provider value={{ userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);