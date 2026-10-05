import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

import { useAuth } from "../../context/AuthContext";
import { dashboardSectionsByRole } from "../../modules/dashboard/DashboardNav";
import { ROUTES } from "../../routes";

export default function RoleGuard({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { pathname } = useLocation();

  if (!session) return <Navigate to={ROUTES.AUTHPAGE} replace />;

  const allowedPaths = dashboardSectionsByRole[session.user.role]
    .flatMap((section) => section.items.map((item) => item.href))
    .filter(Boolean);

  if (!allowedPaths.includes(pathname)) {
    return <Navigate to={allowedPaths[0] ?? ROUTES.AUTHPAGE} replace />;
  }

  return <>{children}</>;
}
