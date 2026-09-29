import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";
import { ROUTES } from "../routes";


interface ProtectedRouteProps {
  skip?: boolean;
  children: ReactNode;
}

/**
 * Checks auth session first before showing page
 **/
export default function ProtectedRoute({skip = false, children}: ProtectedRouteProps) {
  const { session, loading } = useAuth();


  if (session || loading || skip) return  <>{children}</>
  if (!session && !skip) return <Navigate to={ROUTES.LANDINGPAGE} replace />;
}
