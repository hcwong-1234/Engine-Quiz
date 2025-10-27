// src/components/PrivateRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider"; // keep this path consistent

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Debug (safe): inside the component, using defined vars
  // console.log("PrivateRoute running", { loading, hasUser: !!user });

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="animate-pulse text-slate-600">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
