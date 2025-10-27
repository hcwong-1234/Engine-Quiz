import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; // or your spinner
  if (user) return <Navigate to="/main" replace />;
  return children;
}
