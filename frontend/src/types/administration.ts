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
