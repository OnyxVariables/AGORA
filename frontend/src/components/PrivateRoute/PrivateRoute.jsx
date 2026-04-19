import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../PrivateRoute/AuthContext";

const PrivateRoute = ({ roleRequired }) => {
  const { userRole, authReady } = useAuth();

  if (!authReady) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "40vh",
          opacity: 0.85,
        }}
      >
        Cargando sesión…
      </div>
    );
  }

  if (!userRole) return <Navigate to="/" replace />;
  if (userRole !== roleRequired) return <Navigate to="/" replace />;
  return <Outlet />;
};

export default PrivateRoute;
