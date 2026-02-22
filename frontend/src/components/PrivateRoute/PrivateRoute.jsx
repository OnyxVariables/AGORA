import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../PrivateRoute/AuthContext";

const PrivateRoute = ({ roleRequired }) => {
  const { userRole } = useAuth();
  // const userRole = parseInt(localStorage.getItem("userRole")); // ROL
  if (!userRole) return <Navigate to="/" />; // No autenticado
  if (userRole !== roleRequired) return <Navigate to="/" />; // Rol incorrecto
  return <Outlet />;
};

export default PrivateRoute;
