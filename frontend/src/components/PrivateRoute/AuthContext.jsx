import { createContext, useContext, useState } from "react";
import { getXsrfToken } from "../../services/xsrf";
import { popupError, toastSuccess } from "../../services/alerts";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // El rol se queda aquí, si es null no hay sesión.
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

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
        popupError("Error al cerrar sesión en el servidor");
        return;
      }

      setUserRole(null);
      toastSuccess("Sesión cerrada");
      navigate("/"); //Con esto la pagina no recarga, con la redirección sí

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