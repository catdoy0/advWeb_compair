import type {
  AdminOverviewData,
  CustomerDirectoryResponse,
  GetUser,
  TotalUsers,
} from "../types/administration";
import { API_URL } from "./config";
import { apiFetch } from "./auth";

const ADMINISTRATION = "administration"

export interface ActivityLogEntry {
  id: number;
  actor_id: number | null;
  actor_name: string;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  description: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface DatabaseSnapshot {
  id: string;
  label: string;
  kind: "manual" | "pre_restore" | string;
  created_at: string;
  created_by: { id: number; name: string; email: string } | null;
  size_bytes: number;
  sha256: string;
  format: string;
  archived_at?: string | null;
  archived_by?: { id: number; name: string; email: string } | null;
}

export async function getDatabaseSnapshots(): Promise<{ items: DatabaseSnapshot[] | null; error: string }> {
  try {
    const res = await apiFetch(`${ADMINISTRATION}/backups`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { items: null, error: data.detail ?? "Unable to load database snapshots." };
    }
    const data = await res.json();
    return { items: data.items ?? [], error: "" };
  } catch {
    return { items: null, error: "Unable to contact the server." };
  }
}

export async function createDatabaseSnapshot(label: string): Promise<{
  snapshot: DatabaseSnapshot | null;
  error: string;
}> {
  try {
    const res = await apiFetch(`${ADMINISTRATION}/backups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok
      ? { snapshot: data as DatabaseSnapshot, error: "" }
      : { snapshot: null, error: data.detail ?? "Unable to create snapshot." };
  } catch {
    return { snapshot: null, error: "Unable to contact the server." };
  }
}

export async function restoreDatabaseSnapshot(id: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await apiFetch(`${ADMINISTRATION}/backups/${encodeURIComponent(id)}/restore`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    return res.ok
      ? { ok: true, message: data.message ?? "Snapshot restored." }
      : { ok: false, message: data.detail ?? "Unable to restore snapshot." };
  } catch {
    return { ok: false, message: "Unable to contact the server." };
  }
}

export async function archiveDatabaseSnapshot(id: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await apiFetch(`${ADMINISTRATION}/backups/${encodeURIComponent(id)}/archive`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    return res.ok
      ? { ok: true, message: data.message ?? "Snapshot archived." }
      : { ok: false, message: data.detail ?? "Unable to archive snapshot." };
  } catch {
    return { ok: false, message: "Unable to contact the server." };
  }
}

export async function downloadDatabaseSnapshot(id: string): Promise<{ blob: Blob | null; error: string }> {
  try {
    const res = await apiFetch(`${ADMINISTRATION}/backups/${encodeURIComponent(id)}/download`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { blob: null, error: data.detail ?? "Unable to download snapshot." };
    }
    return { blob: await res.blob(), error: "" };
  } catch {
    return { blob: null, error: "Unable to contact the server." };
  }
}

export async function getActivityLogs(
  search: string,
  page: number,
  pageSize = 20,
): Promise<ArchivePage<ActivityLogEntry> | null> {
  const params = new URLSearchParams({ search, page: String(page), page_size: String(pageSize) });
  try {
    const res = await apiFetch(`${ADMINISTRATION}/activity-logs?${params}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getAdminOverview(onDate: string): Promise<AdminOverviewData | null> {
  try {
    const res = await apiFetch(`${ADMINISTRATION}/overview?on_date=${encodeURIComponent(onDate)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getCustomers(
  page: number,
  pageSize: number,
  search: string,
): Promise<CustomerDirectoryResponse | null> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    search,
  });
  try {
    const res = await apiFetch(`${ADMINISTRATION}/customers?${params}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}


export async function getUsers(howMany: number = 10, page: number = 1, search: string = "", role: string = ""): Promise<GetUser[] | null>{
  const params = new URLSearchParams({
    how_many: String(howMany),
    page: String(page),
    search,
    role,
  });
  const res = await apiFetch(`${ADMINISTRATION}/get-users?${params}`);
  if (!res.ok) return null;
  return await res.json();
}


export async function getTotalUsers(): Promise<TotalUsers | null>{
  const res = await fetch(`${API_URL}/${ADMINISTRATION}/get-total-users`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) return null;
  return await res.json();
}


export async function setUserActive( userId: number, isActive: boolean,): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(
    `${API_URL}/${ADMINISTRATION}/set-user-active?user_id=${userId}&is_active=${isActive}`,
    { method: "POST", credentials: "include" },
  );

  if (!res.ok) {
    let message = "Failed to update user status.";

    try {
      const data = await res.json();
      if (data.detail) message = data.detail;
    } catch {
      // response had no body, use default
    }

    return { ok: false, message };
  }

  return {
    ok: true,
    message: isActive ? "Account unsuspended." : "Account suspended.",
  };
}


export async function editUser( user: GetUser,): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_URL}/${ADMINISTRATION}/edit-user`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });

  if (!res.ok) {
    let message = "Failed to update user.";

    try {
      const data = await res.json();
      if (data.detail) message = data.detail;
    } catch {
      // no body, keep default
    }

    return { ok: false, message };
  }

  return { ok: true, message: "Changes saved." };
}

export async function resetPassword(
  userId: number,
): Promise<{ ok: boolean; password: string; message: string }> {
  const res = await fetch(
    `${API_URL}/${ADMINISTRATION}/reset-user-password?user_id=${userId}`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  const data = await res.json();

  if (!res.ok) {
    return { ok: false, password: "", message: data.detail ?? "Failed to reset password." };
  }

  return { ok: true, password: data.password, message: "Password reset." };
}

export interface ArchivePage<T> {
  items: T[];
  total: number;
}

export interface ArchivedConversation {
  id: number;
  customer_id: number;
  repair_request_id: number | null;
  archived_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  repair_number: string | null;
  repair_status: string;
  computer_name: string | null;
  preview: string | null;
}

export interface ArchivedAccount {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_sign_in: string | null;
  archived_at: string;
}

async function archiveAction(path: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await apiFetch(`${ADMINISTRATION}/${path}`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    return res.ok
      ? { ok: true, message: data.message ?? "Updated." }
      : { ok: false, message: data.detail ?? "Unable to update archive." };
  } catch {
    return { ok: false, message: "Unable to contact the server." };
  }
}

async function getArchivePage<T>(kind: "messages" | "accounts", search: string, page: number): Promise<ArchivePage<T> | null> {
  const params = new URLSearchParams({ search, page: String(page), page_size: "10" });
  try {
    const res = await apiFetch(`${ADMINISTRATION}/archive/${kind}?${params}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export const getArchivedMessages = (search: string, page: number) =>
  getArchivePage<ArchivedConversation>("messages", search, page);
export const getArchivedAccounts = (search: string, page: number) =>
  getArchivePage<ArchivedAccount>("accounts", search, page);
export const archiveConversation = (id: number) => archiveAction(`archive/messages/${id}`);
export const restoreConversation = (id: number) => archiveAction(`archive/messages/${id}/restore`);
export const archiveAccount = (id: number) => archiveAction(`archive/accounts/${id}`);
export const restoreAccount = (id: number) => archiveAction(`archive/accounts/${id}/restore`);
