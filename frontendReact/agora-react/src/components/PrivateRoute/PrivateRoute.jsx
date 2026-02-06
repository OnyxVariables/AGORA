import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = ({ roleRequired }) => {
  const userRole = parseInt(localStorage.getItem("userRole")); // ROL
  if (!userRole) return <Navigate to="/" />; // No autenticado
  if (userRole !== roleRequired) return <Navigate to="/" />; // Rol incorrecto
  return <Outlet />;
};

export default PrivateRoute;
