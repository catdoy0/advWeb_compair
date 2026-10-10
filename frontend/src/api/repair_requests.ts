import { apiFetch } from "./auth";
import type {
  Appointment,
  AppointmentCountsByDay,
  CreateRepairRequestPayload,
  RepairDetail,
  RepairNote,
  RepairPartUsage,
  RepairQueueResponse,
  RepairRequestCreated,
} from "../types/repair_requests";

export async function createRepairRequest(
  payload: CreateRepairRequestPayload,
): Promise<RepairRequestCreated | null> {
  const res = await apiFetch("repair-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return await res.json();
}


export async function listAppointments(
  onDate: string,
): Promise<Appointment[]> {
  const res = await apiFetch(`appointments?on_date=${onDate}`, {
    method: "GET",
  });
  if (!res.ok) return [];
  return await res.json();
}


export async function getAppointmentWeekCounts(
  start: string,
  end: string,
): Promise<AppointmentCountsByDay> {
  const res = await apiFetch( `appointments/week?start=${start}&end=${end}`,
    { method: "GET" },
  );
  if (!res.ok) return {};
  return await res.json();
}


export async function getNextAppointmentDate(): Promise<string | null> {
  const res = await apiFetch("appointments/next", { method: "GET" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.date;
}


export async function listRepairQueue(
  status?: string,
  search: string = "",
): Promise<RepairQueueResponse> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search.trim()) params.set("search", search.trim());

  const query = params.toString();
  const res = await apiFetch(`repair-requests${query ? `?${query}` : ""}`, {
    method: "GET",
  });

  if (!res.ok) return { items: [], counts: {} };
  return await res.json();
}


export async function getRepairDetail(id: number): Promise<RepairDetail | null> {
  const res = await apiFetch(`repair-requests/${id}`, { method: "GET" });
  if (!res.ok) return null;
  return await res.json();
}


export async function listRepairNotes(id: number): Promise<RepairNote[]> {
  const res = await apiFetch(`repair-requests/${id}/notes`, { method: "GET" });
  if (!res.ok) return [];
  return await res.json();
}

export async function addRepairNote(
  id: number,
  note: string,
): Promise<{ ok: boolean; message: string }> {
  const res = await apiFetch(`repair-requests/${id}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });

  if (!res.ok) {
    let message = "Failed to add note.";
    try {
      const data = await res.json();
      if (data.detail) message = data.detail;
    } catch { /* no body */ }
    return { ok: false, message };
  }
  return { ok: true, message: "Note added." };
}

export async function listRepairParts(id: number): Promise<RepairPartUsage[]> {
  const res = await apiFetch(`repair-requests/${id}/parts`, { method: "GET" });
  if (!res.ok) return [];
  return await res.json();
}

export async function addRepairPart(
  id: number,
  payload: { part_id: number; quantity_used: number; work_note?: string | null },
): Promise<{ ok: boolean; message: string; row?: RepairPartUsage }> {
  const res = await apiFetch(`repair-requests/${id}/parts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Failed to add part.";
    try {
      const data = await res.json();
      if (data.detail) message = data.detail;
    } catch { /* no body */ }
    return { ok: false, message };
  }

  const row = await res.json();
  return { ok: true, message: "Part added.", row };
}

export async function removeRepairPart(
  requestId: number,
  repairPartId: number,
): Promise<boolean> {
  const res = await apiFetch(
    `repair-requests/${requestId}/parts/${repairPartId}`,
    { method: "DELETE" },
  );
  return res.ok;
}


export async function advanceRepairStatus(
  id: number,
): Promise<{ ok: boolean; status: string | null; message: string }> {
  const res = await apiFetch(`repair-requests/${id}/advance`, {
    method: "POST",
  });

  if (!res.ok) {
    let message = "Failed to advance status.";
    try {
      const data = await res.json();
      if (data.detail) message = data.detail;
    } catch {
      /* no body */
    }
    return { ok: false, status: null, message };
  }

  const data = await res.json();
  return { ok: true, status: data.status, message: "Status updated." };
}


export async function rejectRepair(
  id: number,
): Promise<{ ok: boolean; status: string | null; message: string }> {
  const res = await apiFetch(`repair-requests/${id}/reject`, {
    method: "POST",
  });

  if (!res.ok) {
    let message = "Failed to reject repair.";
    try {
      const data = await res.json();
      if (data.detail) message = data.detail;
    } catch {
      /* no body */
    }
    return { ok: false, status: null, message };
  }

  const data = await res.json();
  return { ok: true, status: data.status, message: "Repair rejected." };
}


export async function updateEstimate(
  id: number,
  amount: number,
): Promise<{ ok: boolean; message: string }> {
  const res = await apiFetch(`repair-requests/${id}/estimate`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });

  if (!res.ok) {
    let message = "Failed to update estimate.";
    try {
      const data = await res.json();
      if (data.detail) message = data.detail;
    } catch {
      /* no body */
    }
    return { ok: false, message };
  }
  return { ok: true, message: "Estimate updated." };
}
