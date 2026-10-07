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
  };
}


export interface SignUpPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirm_password: string;
}
