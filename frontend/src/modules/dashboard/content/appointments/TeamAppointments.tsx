import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import dayjs, { type Dayjs } from "dayjs";

import DataTable, {
  type DataTableColumn,
} from "../../../../components/common/widgets/DataTable";
import type { Status } from "../../../../components/common/widgets/StatusBox";
import StatusBox from "../../../../components/common/widgets/StatusBox";
import PageHeader from "../../components/PageHeader";
import DashboardPage from "../../components/DashboardPage";
import DashboardPanel from "../../components/DashboardPanel";

import {
  listAppointments,
  getAppointmentWeekCounts,
  getNextAppointmentDate,
} from "../../../../api/repair_requests";
import type { Appointment as ApiAppointment } from "../../../../types/repair_requests";

// ---------- slot capacity config ----------

const MORNING_CAPACITY = 3;
const AFTERNOON_CAPACITY = 3;
const MORNING_CUTOFF_HOUR = 12;

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
  return dayjs(`2000-01-01T${t}`).format("h:mm A");
}

function getWeekDays(reference: Dayjs): { day: string; date: Dayjs }[] {
  const start = reference.startOf("week");
  return Array.from({ length: 7 }, (_, i) => {
    const d = start.add(i, "day");
    return { day: d.format("ddd").toUpperCase(), date: d };
  });
}

function slotCounts(appointments: ApiAppointment[]) {
  let morning = 0;
  let afternoon = 0;

  for (const a of appointments) {
    const hour = Number(a.scheduled_time.split(":")[0]);
    if (hour < MORNING_CUTOFF_HOUR) morning++;
    else afternoon++;
  }

  return { morning, afternoon };
}

// ---------- page ----------

export default function TeamAppointments() {
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
      className: "w-[13%]",
      render: (a) => formatTime(a.scheduled_time),
    },
    {
      key: "customer_name",
      label: "Customer",
      className: "w-[24%]",
      render: (a) => a.customer_name || "—",
    },
    {
      key: "computer_name",
      label: "Computer",
      className: "w-[25%]",
    },
    {
      key: "requested_service",
      label: "Service",
      className: "w-[23%]",
    },
    {
      key: "status",
      label: "Status",
      className: "w-[15%]",
      render: (a) => <StatusBox status={toStatusEnum(a.status)} />,
    },
  ];

  const isToday = selectedDate.isSame(dayjs(), "day");
  const bookingsTitle = isToday
    ? "Today's bookings"
    : `${selectedDate.format("dddd")}'s bookings`;
  const bookingsSubtitle = selectedDate.format("dddd, MMMM D");

  const { morning, afternoon } = slotCounts(appointments);
  const totalBooked = morning + afternoon;
  const totalCapacity = MORNING_CAPACITY + AFTERNOON_CAPACITY;
  const openSlots = Math.max(0, totalCapacity - totalBooked);

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Operations / schedule"
        title="Appointments"
        description="Make the day predictable for customers and technicians with a shared repair schedule."
      />

      <DashboardPanel className="mt-6">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="text-[14px] font-bold text-[#102c50] dark:text-white">
              {weekDays[0].date.format("MMMM D")}–{weekDays[6].date.format("D, YYYY")}
            </h2>
            <p className="mt-1 text-[11px] text-slate-400">
              Appointments are shown in your shop's local time.
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
        {/* Bookings */}
        <DashboardPanel
          title={bookingsTitle}
          description={bookingsSubtitle}
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

        {/* Availability */}
        <DashboardPanel
          title="Availability"
          description={`Remaining slots ${isToday ? "today" : "on this day"}`}
        >
          <div className="p-5">
            <div className="flex items-baseline gap-1">
              <p className="text-[28px] font-bold text-[#102c50] dark:text-white">
                {openSlots}/{totalCapacity}
              </p>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Open appointment slots
            </p>

            <div className="mt-6 space-y-5">
              <SlotBar
                label="Morning"
                booked={morning}
                capacity={MORNING_CAPACITY}
                tone="blue"
              />
              <SlotBar
                label="Afternoon"
                booked={afternoon}
                capacity={AFTERNOON_CAPACITY}
                tone="green"
              />
            </div>
          </div>
        </DashboardPanel>
      </div>
    </DashboardPage>
  );
}

// ---------- SlotBar ----------

function SlotBar({
  label,
  booked,
  capacity,
  tone,
}: {
  label: string;
  booked: number;
  capacity: number;
  tone: "blue" | "green";
}) {
  const pct = capacity === 0 ? 0 : Math.min(100, (booked / capacity) * 100);

  const fillClass =
    tone === "blue"
      ? "bg-[#2870e8]"
      : "bg-[#15946a]";

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-[#102c50] dark:text-white">
          {label}
        </p>
        <p className="text-[11px] text-slate-400">
          {booked}/{capacity}
        </p>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#e6ebf2] dark:bg-[#182536]">
        <div
          className={`h-full rounded-full transition-all ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
