import { useAuth } from "../../../context/AuthContext";
import CustomerOverview from "./customer/CustomerOverview";

import { dummySession } from "../../../dummyData";



/**
 * Overview content for the dashboard.
 *
 * Role variants: when a role needs a different Overview, branch here
 * rather than in DashboardPage — e.g.:
 *
 *   if (role === "TECHNICIAN") return <TechnicianOverview />;
 *   if (role === "ADMIN") return <AdminOverview />;
 *
 * For now every role sees the same placeholder.
 */
export default function Overview() {

  const { session } = useAuth();

 const currentSession = session ?? dummySession;

  const { user } = currentSession;

  const role = user?.role;

  if (role === "CUSTOMER") {
    return <CustomerOverview />;
  }

  if (role === "TECHNICIAN") {
    return <TechnicianOverview />;
  }

  if (role === "STAFF") {
    return <StaffOverview />;
  }

  if (role === "ADMIN") {
    return <AdminOverview />;
  }

  return null;
}
