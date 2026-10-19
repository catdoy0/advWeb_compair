export interface GetUser {
  id: number;
  first_name?: string;
  last_name?: string;
  email: string;
  role: string;
  created_at?: string;
  is_active: boolean;
  last_sign_in?: string;
}

export interface TotalUsers {
  total_accounts: number
  customer_total: number
  technician_total: number
  staff_total: number
  administrator_total: number
}

export interface CustomerDirectoryItem {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  is_active: boolean;
  created_at: string;
  last_sign_in: string | null;
  device_count: number;
  repair_count: number;
}

export interface CustomerDirectorySummary {
  total_customers: number;
  active_customers: number;
  returning_customers: number;
  devices_on_record: number;
}

export interface CustomerDirectoryResponse {
  items: CustomerDirectoryItem[];
  total: number;
  summary: CustomerDirectorySummary;
}

export interface AdminOverviewRepair {
  id: number;
  repair_number: string;
  status: string;
  requested_service: string;
  computer_name: string;
  customer_name: string;
}

export interface AdminOverviewScheduleItem extends AdminOverviewRepair {
  time: string;
  repair_request_id: number;
}

export interface AdminOverviewAttentionItem extends AdminOverviewRepair {
  reported_problem: string;
  preferred_date: string;
  preferred_time: string;
  technician_name: string | null;
}

export interface AdminOverviewRecentRepair {
  id: number;
  repair_number: string;
  status: string;
  activity_at: string;
  customer_name: string;
  computer_name: string;
}

export interface AdminOverviewMessage {
  conversation_id: number;
  customer_name: string;
  repair_number: string | null;
  preview: string;
  last_message_at: string;
  unread_count: number;
}

export interface AdminOverviewData {
  date: string;
  repair_counts: Record<string, number>;
  estimated_service_value: number;
  schedule: AdminOverviewScheduleItem[];
  in_motion: AdminOverviewRepair[];
  needs_attention: AdminOverviewAttentionItem[];
  recent_repairs: AdminOverviewRecentRepair[];
  messages: AdminOverviewMessage[];
  unread_messages: number;
}
