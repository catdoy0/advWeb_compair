import type { ConversationPage, Message } from "../types/messages";
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
export async function listConversations(
  search = "",
  offset = 0,
): Promise<ConversationPage> {
  const params = new URLSearchParams({ search, offset: String(offset), limit: "10" });
  const res = await apiFetch(`${CHAT}/?${params}`, { method: "GET" });
  if (!res.ok) {
    return { items: [], has_more: false, total_count: 0, unread_total: 0 };
  }
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
  limit = 15,
): Promise<Message[]> {
  const params = new URLSearchParams({ limit: String(limit) });
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

export async function deleteMessage(
  conversationId: number,
  messageId: number,
): Promise<boolean> {
  const res = await apiFetch(`${CHAT}/${conversationId}/messages/${messageId}`, {
    method: "DELETE",
  });
  return res.ok;
}


export async function markConversationRead(
  conversationId: number,
): Promise<boolean> {
  const res = await apiFetch(`conversations/${conversationId}/read`, {
    method: "POST",
  });
  return res.ok;
}

export async function markAllConversationsRead(): Promise<boolean> {
  try {
    const res = await apiFetch(`${CHAT}/read-all`, { method: "POST" });
    return res.ok;
  } catch {
    return false;
  }
}
