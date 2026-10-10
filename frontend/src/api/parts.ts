import { apiFetch } from "./auth";
import type {
  CreatePartPayload,
  InventorySummary,
  Part,
  UpdatePartPayload,
} from "../types/parts";

const PATH = "parts";

export async function listParts(
  search: string = "",
  category: string = "",
  lowStockOnly: boolean = false,
): Promise<Part[]> {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (category) params.set("category", category);
  if (lowStockOnly) params.set("low_stock_only", "true");

  const query = params.toString();
  const res = await apiFetch(`${PATH}${query ? `?${query}` : ""}`, {
    method: "GET",
  });
  if (!res.ok) return [];
  return await res.json();
}

export async function listCategories(): Promise<string[]> {
  const res = await apiFetch(`${PATH}/categories`, { method: "GET" });
  if (!res.ok) return [];
  return await res.json();
}

export async function getInventorySummary(): Promise<InventorySummary> {
  const res = await apiFetch(`${PATH}/summary`, { method: "GET" });
  if (!res.ok) {
    return { total_skus: 0, needs_reorder: 0, units_on_hand: 0, stock_value: 0 };
  }
  return await res.json();
}

export async function createPart(
  payload: CreatePartPayload,
): Promise<{ ok: boolean; message: string }> {
  const res = await apiFetch(PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Failed to create part.";
    try {
      const data = await res.json();
      if (data.detail) message = data.detail;
    } catch {
      // no body
    }
    return { ok: false, message };
  }

  return { ok: true, message: "Part created." };
}

export async function updatePart(
  partId: number,
  payload: UpdatePartPayload,
): Promise<{ ok: boolean; message: string }> {
  const res = await apiFetch(`${PATH}/${partId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Failed to update part.";
    try {
      const data = await res.json();
      if (data.detail) message = data.detail;
    } catch {
      // no body
    }
    return { ok: false, message };
  }

  return { ok: true, message: "Part updated." };
}

export async function restockPart(
  partId: number,
  amount: number,
): Promise<{ ok: boolean; message: string }> {
  const res = await apiFetch(`${PATH}/${partId}/restock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });

  if (!res.ok) {
    let message = "Failed to restock part.";
    try {
      const data = await res.json();
      if (data.detail) message = data.detail;
    } catch {
      // no body
    }
    return { ok: false, message };
  }

  return { ok: true, message: `Added ${amount} to stock.` };
}

export async function deactivatePart(
  partId: number,
): Promise<{ ok: boolean; message: string }> {
  const res = await apiFetch(`${PATH}/${partId}`, { method: "DELETE" });

  if (!res.ok) {
    return { ok: false, message: "Failed to remove part." };
  }

  return { ok: true, message: "Part removed." };
}
