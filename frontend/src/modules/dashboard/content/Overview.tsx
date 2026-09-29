import { useAuth } from "../../../context/AuthContext";

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
  const role = session?.user.role ?? "UNKNOWN";

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Hello World</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Overview content for role: {role}
      </p>
    </div>
  );
}
