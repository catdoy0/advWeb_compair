import { API_URL } from "./config";
import type { Conversation, Message } from "../types/messages";

const CHAT = "conversations";

// export async function listConversations(): Promise<Conversation[]> {
//   const res = await fetch(`${API_URL}/${CHAT}/`, {
//     method: "GET",
//     credentials: "include",
//   });
//   if (!res.ok) return [];
//   return await res.json();
// }
export async function listConversations(): Promise<Conversation[]> {
  const res = await apiFetch(CHAT, { method: "GET" });
  if (!res.ok) return [];
  return await res.json();
}

// export async function listMessages(
//   conversationId: number,
//   beforeId?: number,
// ): Promise<Message[]> {
//   const params = new URLSearchParams({ limit: "50" });
//   if (beforeId !== undefined) params.set("before_id", String(beforeId));
//
//   const res = await fetch(
//     `${API_URL}/${CHAT}/${conversationId}/messages?${params}`,
//     {
//       method: "GET",
//       credentials: "include",
//     },
//   );
//   if (!res.ok) return [];
//   return await res.json();
// }
export async function listMessages(
  conversationId: number,
  beforeId?: number,
): Promise<Message[]> {
  const params = new URLSearchParams({ limit: "50" });
  if (beforeId !== undefined) params.set("before_id", String(beforeId));

  const res = await apiFetch(`${CHAT}/${conversationId}/messages?${params}`, {
    method: "GET",
  });
  if (!res.ok) return [];
  return await res.json();
}

// export async function sendMessage(
//   conversationId: number,
//   content: string,
// ): Promise<Message | null> {
//   const res = await fetch(`${API_URL}/${CHAT}/${conversationId}/messages`, {
//     method: "POST",
//     credentials: "include",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ content }),
//   });
//   if (!res.ok) return null;
//   return await res.json();
// }
export async function sendMessage(
  conversationId: number,
  content: string,
): Promise<Message | null> {
  const res = await apiFetch(`${CHAT}/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) return null;
  return await res.json();
}



export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = `${API_URL}/${path}`;
  const opts: RequestInit = { credentials: "include", ...options };

  let res = await fetch(url, opts);

  if (res.status === 401) {
    const refreshed = await fetch(`${API_URL}/auth/session`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshed.ok) {
      res = await fetch(url, opts);
    }
  }

  return res;
}
