import { apiFetch } from "./auth";
import type {
  Appointment,
  AppointmentCountsByDay,
  CreateRepairRequestPayload,
  CustomerDevice,
  CustomerOverview,
  RepairDetail,
  RepairNote,
  RepairPartUsage,
  RepairQueueResponse,
  RepairRequestCreated,
  NextAppointmentPage,
  WorkspaceResponse,
  TeamDevice,
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


export async function getNextAppointment(offset = 0): Promise<NextAppointmentPage> {
  const res = await apiFetch(`appointments/next?offset=${offset}`, { method: "GET" });
  if (!res.ok) return { appointment: null, has_next: false };
  return await res.json();
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

  if (!res.ok) {
    let error = "Unable to load repair requests.";
    try {
      const data = await res.json();
      if (data.detail) error = data.detail;
    } catch { /* no response body */ }
    return { items: [], counts: {}, error };
  }
  return await res.json();
}


export async function assignRepairTechnician(
  repairRequestId: number,
  technicianId: number | null,
): Promise<{ ok: boolean; message: string }> {
  const res = await apiFetch(`repair-requests/${repairRequestId}/technician`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ technician_id: technicianId }),
  });
  if (!res.ok) {
    let message = "Failed to update technician assignment.";
    try {
      const data = await res.json();
      if (data.detail) message = data.detail;
    } catch { /* no response body */ }
    return { ok: false, message };
  }
  return { ok: true, message: technicianId === null ? "Technician unassigned." : "Technician assigned." };
}


export async function unassignTechnicianRepairs(
  technicianId: number,
): Promise<{ ok: boolean; message: string }> {
  const res = await apiFetch(`repair-requests/technicians/${technicianId}/unassign`, {
    method: "PATCH",
  });
  if (!res.ok) {
    let message = "Failed to unassign technician repairs.";
    try {
      const data = await res.json();
      if (data.detail) message = data.detail;
    } catch { /* no response body */ }
    return { ok: false, message };
  }
  return { ok: true, message: "Technician repairs unassigned." };
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


export async function listMyDevices(): Promise<CustomerDevice[]> {
  const res = await apiFetch("repair-requests/my-devices", { method: "GET" });
  if (!res.ok) return [];
  return await res.json();
}


export async function listTeamDevices(): Promise<TeamDevice[]> {
  const res = await apiFetch("repair-requests/devices", { method: "GET" });
  if (!res.ok) return [];
  return await res.json();
}


export async function getWorkspace(): Promise<WorkspaceResponse | null> {
  const res = await apiFetch("repair-requests/workspace", { method: "GET" });
  if (!res.ok) return null;
  return await res.json();
}


export async function getCustomerOverview(): Promise<CustomerOverview | null> {
  const res = await apiFetch("repair-requests/overview", { method: "GET" });
  if (!res.ok) return null;
  return await res.json();
}


export interface POSRecentRepair {
  id: number;
  repair_number: string;
  status: string;
}

export interface POSRepairSearchResult extends POSRecentRepair {
  computer_name: string;
  customer_name: string;
}

export interface POSRepairSearchPage {
  items: POSRepairSearchResult[];
  total: number;
  page: number;
  page_size: number;
}

export async function getRepairByNumber(
  repairNumber: string,
): Promise<RepairDetail | null> {
  const res = await apiFetch(
    `repair-requests/by-number/${encodeURIComponent(repairNumber.trim())}`,
    { method: "GET" },
  );
  if (!res.ok) return null;
  return await res.json();
}

export async function listPosRecent(): Promise<POSRecentRepair[]> {
  const res = await apiFetch("repair-requests/pos-recent", { method: "GET" });
  if (!res.ok) return [];
  return await res.json();
}

export async function searchPosRepairs(
  search: string,
  page: number,
  pageSize: number,
): Promise<POSRepairSearchPage> {
  const params = new URLSearchParams({
    search,
    page: String(page),
    page_size: String(pageSize),
  });
  const res = await apiFetch(`repair-requests/pos-search?${params}`, { method: "GET" });
  if (!res.ok) {
    throw new Error("Unable to search repairs.");
  }
  return await res.json();
}

export async function checkoutRepair(
  id: number,
): Promise<{ ok: boolean; message: string; receipt: Blob | null }> {
  const res = await apiFetch(`repair-requests/${id}/checkout`, {
    method: "POST",
  });

  if (!res.ok) {
    let message = "Failed to check out repair.";
    try {
      const data = await res.json();
      if (data.detail) message = data.detail;
    } catch {
      /* no body */
    }
    return { ok: false, message, receipt: null };
  }

  const receipt = await getRepairReceipt(id, true);
  return {
    ok: true,
    message: receipt
      ? "Repair released. Receipt downloaded."
      : "Repair released, but the receipt could not be downloaded. It is available in My Devices.",
    receipt,
  };
}

export async function getRepairReceipt(
  repairRequestId: number,
  download = false,
): Promise<Blob | null> {
  try {
    const query = download ? "?download=true" : "";
    const res = await apiFetch(
      `repair-requests/${repairRequestId}/receipt${query}`,
      { method: "GET" },
    );
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}
