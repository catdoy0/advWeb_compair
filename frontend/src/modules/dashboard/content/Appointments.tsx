import { useAuth } from "../../../context/AuthContext";
import { dummySession } from "../../../dummyData";
import CustomerAppointments from "./appointments/CustomerAppointments";
import TeamAppointments from "./appointments/TeamAppointments";

export default function Appointments() {
  const { session } = useAuth();
  const currentUser = (session ?? dummySession).user;

  if (currentUser.role === "CUSTOMER") {
    return <CustomerAppointments />;
  }

  return <TeamAppointments />;
}
