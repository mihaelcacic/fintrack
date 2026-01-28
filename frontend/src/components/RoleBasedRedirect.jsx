import { useAuth } from "../auth/AuthContext";
import { Navigate } from "react-router-dom";

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "ROLE_ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default RoleBasedRedirect;
