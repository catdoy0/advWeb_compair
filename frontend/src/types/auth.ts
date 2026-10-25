export type Role =
| "SUPER_ADMIN"
| "ADMIN"
| "STAFF"
| "TECHNICIAN"
| "CUSTOMER";

export interface UserSession {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    hasPassword: boolean;
    avatarUrl?: string | null;
    avatar_url?: string | null;
    nameChangeAvailableAt?: string | null;
  };
}

export interface StoreSettings {
  email: string;
  number: string;
  available_times: string[];
  available_days: number[];
}


export interface SignUpPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirm_password: string;
}
