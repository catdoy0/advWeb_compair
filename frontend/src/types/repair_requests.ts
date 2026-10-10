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


export type RepairQueueStatus =
  | "PENDING"
  | "RECEIVED"
  | "DIAGNOSING"
  | "REPAIRING"
  | "COMPLETED"
  | "RELEASED"
  | "CANCELLED"
  | "REJECTED"

export interface RepairQueueItem {
  id: number;
  repair_number: string;
  created_at: string;
  status: RepairQueueStatus;
  reported_problem: string;
  computer_name: string;
  customer_id: number;
  customer_name: string;
  technician_id: number | null;
  technician_name: string | null;
  estimate_amount: number | null;
}

export interface RepairQueueResponse {
  items: RepairQueueItem[];
  counts: Record<string, number>;
}


export interface RepairDetail {
  id: number;
  repair_number: string;
  status: RepairQueueStatus;
  created_at: string;
  updated_at: string | null;

  computer_name: string;
  computer_type: string;
  serial_number: string | null;

  requested_service: string;
  reported_problem: string;
  contact_detail: string | null;

  customer_id: number;
  customer_name: string;
  customer_email: string;

  technician_id: number | null;
  technician_name: string | null;

  diagnosis: string | null;
  estimate_amount: number | null;
  final_amount: number | null;

  appointment_date: string | null;
  appointment_time: string | null;
}


export interface RepairNote {
  id: number;
  note: string;
  created_at: string;
  author_id: number;
  author_name: string;
  author_role: string;
}

export interface RepairPartUsage {
  id: number;
  part_id: number;
  part_name: string;
  part_sku: string;
  quantity_used: number;
  unit_price: number;
  line_total: number;
  work_note: string | null;
  created_at: string;
}
