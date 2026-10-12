import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Calendar,
  CalendarDays,
  Laptop,
  MessageCircle,
  Wrench,
} from "lucide-react";
import dayjs from "dayjs";

import CommonButton from "../../../../components/common/widgets/CommonButton";
import StatCard from "../../components/StatCard";
import RepairRequests from "../../components/RepairRequests";
import MessageShop from "../../components/MessageShop";
import PageHeader from "../../components/PageHeader";
import DashboardPage from "../../components/DashboardPage";

import { getCustomerOverview } from "../../../../api/repair_requests";
import type { CustomerOverview as OverviewData } from "../../../../types/repair_requests";
import { useEvents } from "../../../../context/EventContext";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  RECEIVED: "Received",
  DIAGNOSING: "Diagnosing",
  REPAIRING: "Repairing",
  COMPLETED: "Completed",
  RELEASED: "Released",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

const APPT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  NO_SHOW: "No show",
};

export default function CustomerOverview() {
  const navigate = useNavigate();
  const { subscribe } = useEvents();

  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribe("new-message", () => {
      getCustomerOverview().then((res) => {
        if (res) setData(res);
      });
    });
  }, [subscribe]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await getCustomerOverview();
      if (cancelled) return;
      setData(result);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeRequest = data?.active_request ?? null;
  const nextAppointment = data?.next_appointment ?? null;
  const lastMessage = data?.last_message ?? null;
  const unreadMessages = data?.unread_messages ?? 0;
  const computerCount = data?.computer_count ?? 0;
  const recentRequests = data?.recent_requests ?? [];

  // formatted appointment string
  let appointmentValue = "No upcoming";
  let appointmentDetail = "Book when ready";
  let appointmentMuted = "";
  if (nextAppointment) {
    const d = dayjs(nextAppointment.scheduled_date);
    const t = dayjs(`2000-01-01T${nextAppointment.scheduled_time}`).format("h:mm A");
    appointmentValue = `${d.format("MM/DD/YYYY")} - ${t}`;
    appointmentDetail = APPT_STATUS_LABEL[nextAppointment.status] ?? nextAppointment.status;
    appointmentMuted = nextAppointment.computer_name;
  }

  return (
    <DashboardPage maxWidth="1240px" className="bg-[#f7f9fc] dark:bg-[#0f1724]">
      <PageHeader
        eyebrow="Computer repair customer portal"
        title="Your computer repair overview"
        description="Keep your computer requests, appointments, and shop conversations together."
        action={
          <div className="flex gap-2">
            <CommonButton
              className="flex items-center gap-2 px-4 py-2"
              variant="outline"
              onClick={() => navigate("/dashboard/appointments")}
            >
              <Calendar size={14} />
              Appointments
            </CommonButton>
            <CommonButton
              className="flex items-center gap-2 px-4 py-2"
              onClick={() => navigate("/dashboard/messages")}
            >
              <MessageCircle size={14} />
              Message the shop
            </CommonButton>
          </div>
        }
      />

      {/* Statistics */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active request"
          value={activeRequest ? activeRequest.repair_number : "—"}
          icon={Wrench}
          variant="blue"
          detail={
            activeRequest
              ? STATUS_LABEL[activeRequest.status] ?? activeRequest.status
              : "No active repair"
          }
          detailMuted={activeRequest?.computer_name ?? ""}
        />

        <StatCard
          label="Next appointment"
          value={appointmentValue}
          icon={CalendarDays}
          variant="orange"
          detail={appointmentDetail}
          detailMuted={appointmentMuted}
        />

        <StatCard
          label="Unread messages"
          value={String(unreadMessages)}
          icon={MessageCircle}
          variant="cyan"
          detail={unreadMessages > 0 ? "New messages" : "All caught up"}
          onClick={() => navigate("/dashboard/messages")}
        />

        <StatCard
          label="Computer records"
          value={String(computerCount)}
          icon={Laptop}
          variant="blue"
        />
      </div>

      {/* Lower content */}
      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <RepairRequests requests={recentRequests} loading={loading} />
        <MessageShop lastMessage={lastMessage} loading={loading} />
      </div>
    </DashboardPage>
  );
}
