import type { Conversation, Message } from "../types/messages";
import { apiFetch } from "./auth";

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
  const res = await apiFetch(`${CHAT}/`, { method: "GET" });
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
