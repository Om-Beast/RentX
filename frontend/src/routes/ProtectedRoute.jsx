/**
 * ProtectedRoute.jsx — LEGACY, unused file.
 *
 * The active protected route is defined inline in AppRoutes.jsx using useAuth().
 * This file is kept for reference but NOT imported anywhere.
 *
 * The correct token key is 'rentx_token' (not 'token').
 * AuthContext handles auth state — components should use useAuth() hook.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * @deprecated Use the ProtectedRoute defined in AppRoutes.jsx instead.
 * This file is not imported anywhere and can be safely deleted.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
}