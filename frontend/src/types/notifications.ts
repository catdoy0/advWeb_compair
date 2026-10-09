export type NotificationType =
  | "NEW_REPAIR_REQUEST"
  | "REPAIR_STATUS_CHANGED"
  | "APPOINTMENT_CONFIRMED";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  reference_id: number | null;
  is_read: boolean;
  created_at: string;
}
