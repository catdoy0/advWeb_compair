export type ComputerType = "LAPTOP" | "DESKTOP" | "OTHER";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export interface CreateRepairRequestPayload {
  customer_id?: number;
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

export interface NextAppointmentPage {
  appointment: Appointment | null;
  has_next: boolean;
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
  preferred_date?: string;
  preferred_time?: string;
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
  error?: string;
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
  checked_out: boolean;

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


export interface CustomerDevice {
  id: number;
  computer_name: string;
  computer_type: ComputerType;
  serial_number: string | null;
  created_at: string;

  repair_request_id: number | null;
  repair_number: string | null;
  repair_status: RepairQueueStatus | null;
  estimate_amount: number | null;
  receipt_available?: boolean;
}

export interface TeamDevice extends CustomerDevice {
  customer_id: number;
  customer_name: string;
  customer_email: string;
}


export interface WorkspaceSummary {
  assigned_devices: number;
  diagnosing: number;
  parts_on_hand: number;
  completed_today: number;
}

export interface AssignedRepair {
  id: number;
  repair_number: string;
  status: RepairQueueStatus;
  reported_problem: string;
  created_at: string;
  computer_name: string;
  customer_id: number;
  customer_name: string;
  due_date: string | null;
  due_time: string | null;
  parts_used_count: number;
}

export interface WorkspaceResponse {
  summary: WorkspaceSummary;
  items: AssignedRepair[];
}


export interface CustomerOverviewActiveRequest {
  repair_number: string;
  status: RepairQueueStatus;
  computer_name: string;
  reported_problem: string;
}

export interface CustomerOverviewAppointment {
  scheduled_date: string;
  scheduled_time: string;
  status: AppointmentStatus;
  computer_name: string;
}

export interface CustomerOverviewLastMessage {
  content: string;
  created_at: string;
  sender_name: string;
  is_from_team: boolean;
}

export interface CustomerOverviewRecentRequest {
  id: number;
  repair_number: string;
  status: RepairQueueStatus;
  created_at: string;
  reported_problem: string;
  computer_name: string;
}

export interface CustomerOverview {
  active_request: CustomerOverviewActiveRequest | null;
  next_appointment: CustomerOverviewAppointment | null;
  unread_messages: number;
  computer_count: number;
  last_message: CustomerOverviewLastMessage | null;
  recent_requests: CustomerOverviewRecentRequest[];
}
