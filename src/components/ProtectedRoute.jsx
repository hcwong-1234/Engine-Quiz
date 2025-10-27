import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Spinner() {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-transparent" />
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
