import { apiFetch } from "./auth";
import type {
  Appointment,
  AppointmentCountsByDay,
  CreateRepairRequestPayload,
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
