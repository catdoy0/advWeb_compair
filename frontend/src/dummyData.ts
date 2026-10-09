import type { UserSession } from "./types/auth";

/**
 * just set up database instead of using dummyData
 * ask AI or something idc
 **/
export const dummySession: UserSession = {
  user: {
    id: "67",
    email: "dummy@dummy.com",
    firstName: "lorem",
    lastName: "imsum",
    role: "CUSTOMER",
  },
};
