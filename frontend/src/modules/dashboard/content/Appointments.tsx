import { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

import CommonButton from "../../../components/common/widgets/CommonButton";
import DataTable, {
  type DataTableColumn,
} from "../../../components/common/widgets/DataTable";

import type { Status } from "../../../components/common/widgets/StatusBox";
import StatusBox from "../../../components/common/widgets/StatusBox";

interface Appointment {
  id: string;
  time: string;
  computer: string;
  service: string;
  status: Status;
}

interface AppointmentDay {
  day: string;
  date: number;
  appointments: number;
}

const weekDays: AppointmentDay[] = [
  {
    day: "SUN",
    date: 13,
    appointments: 0,
  },
  {
    day: "MON",
    date: 14,
    appointments: 1,
  },
  {
    day: "TUE",
    date: 15,
    appointments: 0,
  },
  {
    day: "WED",
    date: 16,
    appointments: 0,
  },
  {
    day: "THU",
    date: 17,
    appointments: 0,
  },
  {
    day: "FRI",
    date: 18,
    appointments: 0,
  },
  {
    day: "SAT",
    date: 19,
    appointments: 0,
  },
];

const appointments: Appointment[] = [
  {
    id: "APT-1001",
    time: "11:00",
    computer: 'MacBook Pro 14"',
    service: "Initial diagnosis",
    status: "Confirmed",
  },
];

const appointmentColumns: DataTableColumn<Appointment>[] = [
  {
    key: "time",
    label: "Time",
    className: "w-[16%]",
  },
  {
    key: "computer",
    label: "Computer",
    className: "w-[32%]",
  },
  {
    key: "service",
    label: "Service",
    className: "w-[32%]",
  },
  {
    key: "status",
    label: "Status",
    className: "w-[20%]",
    render: (appointment) => (
      <StatusBox status={appointment.status} />
    ),
  },
];

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState(14);


  const nextAppointment = appointments[0];

  const handlePreviousWeek = () => {
    console.log("Previous week");
  };

  const handleNextWeek = () => {
    console.log("Next week");
  };

  return (
    <main className="flex-1 bg-[#f7f9fc] dark:bg-[#0f1724]">
      <div className="mx-auto max-w-[1240px] p-5 lg:p-7">
        {/* Header */}
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2870e8]">
              Operations / schedule
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#102c50] dark:text-white">
              Appointments
            </h1>

            <p className="mt-1 max-w-[700px] text-[12px] leading-5 text-slate-500 dark:text-slate-400">
              Make the day predictable for customers and technicians with a
              shared repair schedule.
            </p>
          </div>

          <CommonButton className="flex items-center gap-2 self-start px-4 py-2 xl:self-auto">
            <Plus size={15} />
            New computer repair request
          </CommonButton>
        </div>

        {/* Appointment week */}
        <section className="mt-6 rounded-lg border border-[#d8e0eb] bg-white dark:border-slate-700 dark:bg-[#111c2b]">
          {/* Week header */}
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

          {/* Week days */}
          <div className="grid grid-cols-7 gap-2 px-5 pb-5 pt-4">
            {weekDays.map((day) => {
              const isSelected = selectedDate === day.date;

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`min-h-[96px] rounded-md border p-2 text-left transition-colors ${
                    isSelected
                      ? "border-[#a8c8ff] bg-[#eef4ff] dark:border-[#2870e8] dark:bg-[#172a42]"
                      : "border-[#d8e0eb] bg-[#f8fafc] hover:border-[#b9c7d8] hover:bg-white dark:border-slate-700 dark:bg-[#151f2d] dark:hover:bg-[#182536]"
                  }`}
                >
                  <p className="text-[9px] font-bold text-slate-400">
                    {day.day}
                  </p>

                  <p className="mt-2 text-[17px] font-bold text-[#102c50] dark:text-white">
                    {day.date}
                  </p>

                  {day.appointments > 0 && (
                    <p className="mt-3 text-[10px] font-semibold text-[#2870e8]">
                      {day.appointments} appointment
                      {day.appointments !== 1 ? "s" : ""}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Appointments + next appointment */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
          {/* Appointments table */}
          <section className="overflow-hidden rounded-lg border border-[#d8e0eb] bg-white dark:border-slate-700 dark:bg-[#111c2b]">
            <div className="flex items-center justify-between border-b border-[#d8e0eb] px-5 py-4 dark:border-slate-700">
              <div>
                <h2 className="text-[14px] font-bold text-[#102c50] dark:text-white">
                  Your appointments
                </h2>

                <p className="mt-1 text-[11px] text-slate-400">
                  Your computer repair appointments only.
                </p>
              </div>

              <span className="rounded bg-[#e7f6ef] px-2 py-1 text-[10px] font-bold text-[#159a63]">
                {appointments.length} appointment
                {appointments.length !== 1 ? "s" : ""}
              </span>
            </div>

            <DataTable
              columns={appointmentColumns}
              data={
                selectedDate === 14
                  ? appointments
                  : []
              }
              emptyMessage="No appointments scheduled for this day."
            />
          </section>

          {/* Next appointment */}
          <section className="overflow-hidden rounded-lg border border-[#d8e0eb] bg-white dark:border-slate-700 dark:bg-[#111c2b]">
            <div className="border-b border-[#d8e0eb] px-5 py-4 dark:border-slate-700">
              <h2 className="text-[14px] font-bold text-[#102c50] dark:text-white">
                Your next appointment
              </h2>

              <p className="mt-1 text-[11px] text-slate-400">
                Only your computer repair booking details.
              </p>
            </div>

            {nextAppointment ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 p-5">
                <div>
                  <p className="text-[10px] text-slate-400">Time</p>

                  <p className="mt-1 text-[12px] font-bold text-[#102c50] dark:text-white">
                    {nextAppointment.time}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400">Status</p>

                  <p className="mt-1 text-[12px] font-bold text-[#102c50] dark:text-white">
                    {nextAppointment.status}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400">Computer</p>

                  <p className="mt-1 text-[12px] font-bold text-[#102c50] dark:text-white">
                    {nextAppointment.computer}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400">Service</p>

                  <p className="mt-1 text-[12px] font-bold text-[#102c50] dark:text-white">
                    {nextAppointment.service}
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
          </section>
        </div>
      </div>
    </main>
  );
}
