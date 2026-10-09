export type ComputerType = "LAPTOP" | "DESKTOP" | "OTHER";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export interface CreateRepairRequestPayload {
  computer_name: string;
  computer_type: ComputerType;
  serial_number?: string | null;
  contact_detail?: string | null;
  requested_service: string;
  reported_problem: string;
  preferred_date: string; // "YYYY-MM-DD"
  preferred_time: string; // "HH:MM:SS"
}

export interface RepairRequestCreated {
  repair_request_id: number;
  repair_number: string;
  appointment_id: number;
  conversation_id: number;
}

export interface Appointment {
  id: number;
  scheduled_date: string;
  scheduled_time: string;
  status: AppointmentStatus;
  repair_request_id: number;
  repair_number: string;
  requested_service: string;
  computer_name: string;
  computer_type: ComputerType;

  // team view only
  customer_id?: number;
  customer_name?: string;
}

export type AppointmentCountsByDay = Record<string, number>;
