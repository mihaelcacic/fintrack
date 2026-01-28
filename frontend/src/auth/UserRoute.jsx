import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

const UserRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is admin, redirect to admin page
  if (user && user.role === "ROLE_ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  // Check if user exists and has regular user role
  if (!user || user.role !== "ROLE_USER") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default UserRoute;
