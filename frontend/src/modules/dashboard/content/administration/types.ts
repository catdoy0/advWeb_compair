export type AccountRole = "Customer" | "Technician" | "Staff" | "Administrator";

export interface Account {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  status: "Active" | "Suspended";
  lastSignIn: string;
}

export type AccountFilter = "All accounts" | AccountRole;
