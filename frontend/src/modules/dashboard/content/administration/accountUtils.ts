import type { GetUsers } from "../../../../types/administration";
import type { Account, AccountRole } from "./types";

const ROLE_LABEL: Record<string, AccountRole> = {
  CUSTOMER: "Customer",
  TECHNICIAN: "Technician",
  STAFF: "Staff",
  ADMIN: "Administrator",
  SUPER_ADMIN: "Administrator",
};

function formatLastSignIn(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === new Date().toDateString()) return `Today, ${time}`;

  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function toAccount(user: GetUsers): Account {
  return {
    id: `USR-${String(user.id).padStart(3, "0")}`,
    name: [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email,
    email: user.email,
    role: ROLE_LABEL[user.role] ?? "Customer",
    status: user.is_active ? "Active" : "Suspended",
    lastSignIn: formatLastSignIn(user.last_sign_in),
  };
}
