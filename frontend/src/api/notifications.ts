import { apiFetch } from "./auth";
import type { Notification } from "../types/notifications";

const PATH = "notifications";

export async function listNotifications(limit = 30): Promise<Notification[]> {
  const res = await apiFetch(`${PATH}?limit=${limit}`, { method: "GET" });
  if (!res.ok) return [];
  return await res.json();
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiFetch(`${PATH}/unread-count`, { method: "GET" });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? 0;
}

export async function markNotificationRead(id: number): Promise<boolean> {
  const res = await apiFetch(`${PATH}/${id}/read`, { method: "POST" });
  return res.ok;
}

export async function markAllNotificationsRead(): Promise<boolean> {
  const res = await apiFetch(`${PATH}/read-all`, { method: "POST" });
  return res.ok;
}
