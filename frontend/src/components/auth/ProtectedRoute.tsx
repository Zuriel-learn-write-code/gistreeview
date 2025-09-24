import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const user = localStorage.getItem("user");
  const userRole = user ? JSON.parse(user).role : null;

  if (!user) {
    // Not logged in, redirect to login page
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    // Role not authorized, redirect to home page
    return <Navigate to="/404" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
