import type { GetUser } from "../../../../types/administration";

export type AccountRole = "Customer" | "Technician" | "Staff" | "Administrator" | "Super Admin";

export interface Account {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  status: "Active" | "Suspended";
  lastSignIn: string;
  raw: GetUser;
}

export type AccountFilter = "All accounts" | AccountRole;
