import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import dayjs, { type Dayjs } from "dayjs";

import CommonButton from "../../../components/common/widgets/CommonButton";
import DataTable, {
  type DataTableColumn,
} from "../../../components/common/widgets/DataTable";
import type { Status } from "../../../components/common/widgets/StatusBox";
import StatusBox from "../../../components/common/widgets/StatusBox";
import PageHeader from "../components/PageHeader";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";
import CreateRepairRequestModal from "../modals/CreateRepairRequestModal";

import {
  listAppointments,
  getAppointmentWeekCounts,
  getNextAppointmentDate,
} from "../../../api/repair_requests";
import type { Appointment as ApiAppointment } from "../../../types/repair_requests";

// ---------- helpers ----------

function toStatusEnum(status: string): Status {
  const map: Record<string, Status> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    CANCELLED: "Cancelled",
    COMPLETED: "Completed",
  };
  return map[status] ?? "Pending";
}

function formatTime(t: string): string {
  // "14:30:00" → "2:30 PM"
  return dayjs(`2000-01-01T${t}`).format("h:mm A");
}

function getWeekDays(reference: Dayjs): { day: string; date: Dayjs }[] {
  const start = reference.startOf("week"); // Sunday (dayjs default)
  return Array.from({ length: 7 }, (_, i) => {
    const d = start.add(i, "day");
    return { day: d.format("ddd").toUpperCase(), date: d };
  });
}

// ---------- page ----------

export default function Appointments() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [weekReference, setWeekReference] = useState<Dayjs>(dayjs());
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [ready, setReady] = useState(false);

  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [countsByDay, setCountsByDay] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const weekDays = getWeekDays(weekReference);
  const weekStart = weekDays[0].date.format("YYYY-MM-DD");
  const weekEnd = weekDays[6].date.format("YYYY-MM-DD");

  // on mount: jump to earliest upcoming appointment, if any
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const iso = await getNextAppointmentDate();
      if (cancelled) return;

      if (iso) {
        const d = dayjs(iso);
        setSelectedDate(d);
        setWeekReference(d);
      }

      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // reload appointments + week counts whenever the day or week changes
  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    (async () => {
      setLoading(true);

      const [dayAppointments, weekCounts] = await Promise.all([
        listAppointments(selectedDate.format("YYYY-MM-DD")),
        getAppointmentWeekCounts(weekStart, weekEnd),
      ]);

      if (cancelled) return;

      setAppointments(dayAppointments);
      setCountsByDay(weekCounts);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, selectedDate, weekStart, weekEnd]);

  async function refresh() {
    const [dayAppointments, weekCounts] = await Promise.all([
      listAppointments(selectedDate.format("YYYY-MM-DD")),
      getAppointmentWeekCounts(weekStart, weekEnd),
    ]);
    setAppointments(dayAppointments);
    setCountsByDay(weekCounts);
  }

  const handlePreviousWeek = () => {
    setWeekReference((w) => w.subtract(7, "day"));
  };

  const handleNextWeek = () => {
    setWeekReference((w) => w.add(7, "day"));
  };

  const columns: DataTableColumn<ApiAppointment>[] = [
    {
      key: "scheduled_time",
      label: "Time",
      className: "w-[16%]",
      render: (a) => formatTime(a.scheduled_time),
    },
    {
      key: "computer_name",
      label: "Computer",
      className: "w-[32%]",
    },
    {
      key: "requested_service",
      label: "Service",
      className: "w-[32%]",
    },
    {
      key: "status",
      label: "Status",
      className: "w-[20%]",
      render: (a) => <StatusBox status={toStatusEnum(a.status)} />,
    },
  ];

  const nextAppointment = appointments[0];

  return (
    <DashboardPage>
      <CreateRepairRequestModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onUpdated={refresh}
      />

      <PageHeader
        eyebrow="Operations / schedule"
        title="Appointments"
        description="Make the day predictable for customers and technicians with a shared repair schedule."
        action={
          <CommonButton
            className="flex items-center gap-2 px-4 py-2"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus size={15} />
            New computer repair request
          </CommonButton>
        }
      />

      <DashboardPanel className="mt-6">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="text-[14px] font-bold text-[#102c50] dark:text-white">
              Your appointment week
            </h2>
            <p className="mt-1 text-[11px] text-slate-400">
              Only appointments linked to your account are shown.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreviousWeek}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-[#f1f5f9] hover:text-[#2870e8] dark:hover:bg-[#182536]"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={handleNextWeek}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-[#f1f5f9] hover:text-[#2870e8] dark:hover:bg-[#182536]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 px-5 pb-5 pt-4">
          {weekDays.map((wd) => {
            const iso = wd.date.format("YYYY-MM-DD");
            const isSelected = selectedDate.format("YYYY-MM-DD") === iso;
            const count = countsByDay[iso] ?? 0;

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDate(wd.date)}
                className={`min-h-[96px] rounded-md border p-2 text-left transition-colors ${
                  isSelected
                    ? "border-[#a8c8ff] bg-[#eef4ff] dark:border-[#2870e8] dark:bg-[#172a42]"
                    : "border-[#d8e0eb] bg-[#f8fafc] hover:border-[#b9c7d8] hover:bg-white dark:border-slate-700 dark:bg-[#151f2d] dark:hover:bg-[#182536]"
                }`}
              >
                <p className="text-[9px] font-bold text-slate-400">
                  {wd.day}
                </p>
                <p className="mt-2 text-[17px] font-bold text-[#102c50] dark:text-white">
                  {wd.date.date()}
                </p>
                {count > 0 && (
                  <p className="mt-3 text-[10px] font-semibold text-[#2870e8]">
                    {count} appointment{count !== 1 ? "s" : ""}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </DashboardPanel>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
        <DashboardPanel
          title="Your appointments"
          description="Your computer repair appointments only."
          headerAction={
            <span className="rounded bg-[#e7f6ef] px-2 py-1 text-[10px] font-bold text-[#159a63]">
              {appointments.length} appointment
              {appointments.length !== 1 ? "s" : ""}
            </span>
          }
        >
          {loading ? (
            <p className="px-5 py-8 text-center text-[11px] text-slate-400">
              Loading...
            </p>
          ) : (
            <DataTable
              columns={columns}
              data={appointments}
              emptyMessage="No appointments scheduled for this day."
            />
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Your next appointment"
          description="Only your computer repair booking details."
        >
          {nextAppointment ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 p-5">
              <div>
                <p className="text-[10px] text-slate-400">Time</p>
                <p className="mt-1 text-[12px] font-bold text-[#102c50] dark:text-white">
                  {formatTime(nextAppointment.scheduled_time)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Status</p>
                <p className="mt-1 text-[12px] font-bold text-[#102c50] dark:text-white">
                  {toStatusEnum(nextAppointment.status)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Computer</p>
                <p className="mt-1 text-[12px] font-bold text-[#102c50] dark:text-white">
                  {nextAppointment.computer_name}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Service</p>
                <p className="mt-1 text-[12px] font-bold text-[#102c50] dark:text-white">
                  {nextAppointment.requested_service}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center px-5 py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef4ff] text-[#2870e8]">
                <CalendarDays size={17} />
              </div>
              <p className="mt-3 text-[12px] font-semibold text-[#102c50] dark:text-white">
                No upcoming appointment
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Your next repair appointment will appear here.
              </p>
            </div>
          )}
        </DashboardPanel>
      </div>
    </DashboardPage>
  );
}
