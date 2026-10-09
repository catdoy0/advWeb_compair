export interface Conversation {
  id: number;
  customer_id: number;
  repair_request_id: number | null;
  last_message_at: string;
  customer_name: string | null;
  customer_email: string | null;
  repair_number: string | null;
  device_label: string | null;
  preview: string | null;
  unread_count: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string | null;
  sender_role: string;
  content: string;
  created_at: string;
}
