import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";
import { ROUTES } from "../routes";
import LoadingScreen from "./common/LoadingScreen";

/**
 * checks if theres already a session
 */
export default function PublicRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();


  if (loading) return <LoadingScreen/>

  if (!session) return <>{children}</>
  else if (session.user.role) return <Navigate to={ROUTES.DASHBOARD.ROOT} replace />;
  else return <>{children}</>
}
