import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

import { useAuth } from "../../context/AuthContext";
import { dashboardSectionsByRole } from "../../modules/dashboard/DashboardNav";
import { ROUTES } from "../../routes";

export default function RoleGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) return null;

  const role = session?.user?.role ?? "CUSTOMER";

  const allowedPaths = dashboardSectionsByRole[role]
    .flatMap((section) => section.items.map((item) => item.href))
    .filter(Boolean);

  if (!allowedPaths.includes(pathname)) {
    return <Navigate to={allowedPaths[0] ?? ROUTES.AUTHPAGE} replace />;
  }

  return <>{children}</>;
}
