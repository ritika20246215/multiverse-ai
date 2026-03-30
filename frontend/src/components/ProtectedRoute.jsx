import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-slate-200">Loading your universe...</div>;
  }

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;
