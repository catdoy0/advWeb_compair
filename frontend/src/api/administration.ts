import type { GetUser, TotalUsers } from "../types/administration";
import { API_URL } from "./config";

const ADMINISTRATION = "administration"


export async function getUsers(howMany: number = 10, page: number = 1, search: string = "", role: string = ""): Promise<GetUser[] | null>{
  const res = await fetch(`${API_URL}/${ADMINISTRATION}/get-users?how_many=${howMany}&page=${page}&search=${search}&role=${role}`, {
    method: "GET",
    credentials: "include",
  });
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


export async function editUser(
  user: GetUser,
): Promise<{ ok: boolean; message: string }> {
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
