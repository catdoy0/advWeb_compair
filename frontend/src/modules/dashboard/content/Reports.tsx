import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Download } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import Papa from "papaparse";

import CommonButton from "../../../components/common/widgets/CommonButton";
import DataTable, { type DataTableColumn } from "../../../components/common/widgets/DataTable";
import { getServiceReport } from "../../../api/repair_requests";
import type { ServiceReportData } from "../../../types/repair_requests";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../../components/ui/chart";
import PageHeader from "../components/PageHeader";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";

const SERVICE_COLORS = [
  "bg-[#2870e8] dark:bg-[#60a5fa]",
  "bg-[#15946a] dark:bg-[#34d399]",
  "bg-[#102c50] dark:bg-[#93c5fd]",
  "bg-[#b45309] dark:bg-[#fbbf24]",
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonth(value: string): string {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" })
    .format(new Date(year, month - 1, 1));
}

function downloadCsv(rows: string[][], filename: string) {
  const csv = Papa.unparse(rows);
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

const chartConfig = {
  income: {
        label: "Estimated service value",
    color: "#2870e8",
  },
};

type ServiceHistoryRow = ServiceReportData["service_history"][number];

const serviceHistoryColumns: DataTableColumn<ServiceHistoryRow>[] = [
  { key: "period", label: "Period", className: "w-[20%]" },
  { key: "received", label: "Requests received", className: "w-[20%]" },
  { key: "completed", label: "Completed", className: "w-[15%]" },
  { key: "released", label: "Released", className: "w-[15%]" },
  {
    key: "value",
    label: "Estimated value",
    className: "text-right",
    render: (row) => <span className="font-bold">{formatCurrency(row.value)}</span>,
  },
];

// ---------- Page Component ----------

export default function Reports() {
  const now = new Date();
  const latestMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(latestMonth);
  const [report, setReport] = useState<ServiceReportData | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [monthPickerPosition, setMonthPickerPosition] = useState({ top: 0, left: 0 });
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const monthPopoverRef = useRef<HTMLDivElement>(null);

  const loadReport = useCallback(async (showRefreshing: boolean, month = selectedMonth) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const result = await getServiceReport(month);
      if (!result) {
        setError("Unable to load service report.");
        return;
      }
      setReport((current) => JSON.stringify(current) === JSON.stringify(result) ? current : result);
      setError("");
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    void loadReport(true);
  }, [loadReport]);

  useEffect(() => {
    if (!monthPickerOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!monthPickerRef.current?.contains(target) && !monthPopoverRef.current?.contains(target)) {
        setMonthPickerOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMonthPickerOpen(false);
    };
    const repositionOnViewportChange = () => {
      const rect = monthPickerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = 192;
      setMonthPickerPosition({
        top: rect.bottom + 4,
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      });
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", repositionOnViewportChange);
    window.addEventListener("scroll", repositionOnViewportChange);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", repositionOnViewportChange);
      window.removeEventListener("scroll", repositionOnViewportChange);
    };
  }, [monthPickerOpen]);

  const currentMonth = formatMonth(selectedMonth);
  const incomeData = report?.monthly_figures.map(({ month, income }) => ({ month, income })) ?? [];
  const monthlyFigures = report?.monthly_figures ?? [];
  const serviceMix = report?.service_mix.map((item, index) => ({
    ...item,
    color: SERVICE_COLORS[index % SERVICE_COLORS.length],
  })) ?? [];
  const serviceHistory = report?.service_history ?? [];
  const monthOptions = Array.from({ length: 120 }, (_, offset) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const value = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    return { value, label: formatMonth(value) };
  });

  const toggleMonthPicker = () => {
    if (monthPickerOpen) {
      setMonthPickerOpen(false);
      return;
    }
    const rect = monthPickerRef.current?.getBoundingClientRect();
    if (rect) {
      const width = 192;
      setMonthPickerPosition({
        top: rect.bottom + 4,
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      });
    }
    setMonthPickerOpen(true);
  };

  const downloadReport = () => {
    if (!report) return;
    downloadCsv([
      ["Service report", currentMonth],
      ["Requests completed", String(report.summary.completed_requests)],
      ["Requests received", String(report.summary.received_requests)],
      ["Average turnaround days", report.summary.average_turnaround_days == null ? "Not available" : String(report.summary.average_turnaround_days)],
      ["Cancelled requests", String(report.summary.cancelled_requests)],
      ["Rejected requests", String(report.summary.rejected_requests)],
      ["Estimated service value", report.summary.estimated_service_value.toFixed(2)],
      [],
      ["Service mix", "Requests", "Percent"],
      ...report.service_mix.map((item) => [item.label, String(item.count), `${item.percent}%`]),
      [],
      ["Month", "Estimated service value"],
      ...report.monthly_figures.map((item) => [item.period, item.income.toFixed(2)]),
      [],
      ["Period", "Requests received", "Completed", "Released", "Estimated value"],
      ...report.service_history.map((row) => [
        row.period,
        String(row.received),
        String(row.completed),
        String(row.released),
        row.value.toFixed(2),
      ]),
    ], `service-report-detail-${report.current_month}.csv`);
  };

  return (
    <DashboardPage maxWidth="1240px" className="bg-[#f7f9fc] dark:bg-[#0f1724]">
      <PageHeader
        eyebrow="Manage / Reporting"
        title="Service reporting"
        description="Turn repair history into a simple view of workload, service mix, and estimated value."
        action={
          <CommonButton
            onClick={downloadReport}
            disabled={!report}
            className="flex items-center gap-2 px-4 py-2"
          >
            <Download size={14} />
            Download report
          </CommonButton>
        }
      />

      {error && <p role="alert" className="mt-4 text-[11px] text-red-600 dark:text-red-400">{error}</p>}

      {/* Top Stats Row */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-[#d8e0eb] bg-white p-5 dark:border-slate-700 dark:bg-[#111c2b]">
          <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
            Requests completed
          </p>
          <p className="mt-3 text-[32px] font-bold text-[#102c50] dark:text-white">
            {report?.summary.completed_requests ?? "—"}
          </p>
          <p className="mt-1 text-[10px] font-bold text-[#15946a]">
            <span className="font-medium text-slate-500">{currentMonth}</span>
          </p>
        </div>

        <div className="rounded-lg border border-[#d8e0eb] bg-white p-5 dark:border-slate-700 dark:bg-[#111c2b]">
          <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
            Average turnaround
          </p>
          <p className="mt-3 text-[32px] font-bold text-[#102c50] dark:text-white">
            {report?.summary.average_turnaround_days == null ? "—" : `${report.summary.average_turnaround_days}d`}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            From request creation to release
          </p>
        </div>

        <div className="rounded-lg border border-[#d8e0eb] bg-white p-5 dark:border-slate-700 dark:bg-[#111c2b]">
          <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
            Rejection rate
          </p>
          <p className="mt-3 text-[32px] font-bold text-[#102c50] dark:text-white">
            {report
              ? `${report.summary.received_requests === 0 ? 0 : Math.round((report.summary.rejected_requests / report.summary.received_requests) * 100)}%`
              : "—"}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            {report
              ? `${report.summary.rejected_requests} rejected of ${report.summary.received_requests} requests received`
              : "For the selected month"}
          </p>
        </div>
      </div>

      {/* Middle Row: Service Mix & Estimated Value */}
      <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-[1.8fr_1fr]">
        <DashboardPanel
          title={`Service mix - ${currentMonth}`}
          description=""
          contentClassName="p-5 pt-0"
        >
          <div className="space-y-4 pt-4">
            {serviceMix.map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <p className="w-32 shrink-0 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {item.label}
                </p>
                <div className="flex-1">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#f1f5f9] dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
                <p className="w-8 shrink-0 text-right text-[11px] text-slate-500">
                  {item.percent}%
                </p>
              </div>
            ))}
            {report && serviceMix.length === 0 && <p className="text-[11px] text-slate-400">No repair requests this month.</p>}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Estimated service value"
          description="Based on logged repair work"
          contentClassName="p-5 pt-0 flex flex-col justify-center"
        >
          <div className="pt-4">
            <p className="text-[32px] font-bold text-[#102c50] dark:text-white">
              {report ? formatCurrency(report.summary.estimated_service_value) : "—"}
            </p>
            <button onClick={() => document.getElementById("monthly-service-history")?.scrollIntoView({ behavior: "smooth" })} className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#2870e8] hover:underline">
              View ledger <ArrowRight size={12} />
            </button>
          </div>
        </DashboardPanel>
      </div>

      {/* Chart Row: Income by month */}
      <div className="mt-4">
        <DashboardPanel
          title="Estimated service value by month"
          description="Recorded repair estimates grouped by the month each request was created."
          headerAction={
            <span className="rounded bg-[#e6f5ef] px-2.5 py-1 text-[10px] font-bold text-[#15946a] dark:bg-[#1d4775] dark:text-[#00d68f]">
              {monthlyFigures.length}-month view
            </span>
          }
          contentClassName="p-5"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            {/* Area Chart */}
            <div className="min-w-0">
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <AreaChart
                  data={incomeData}
                  margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2870e8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2870e8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5edf7" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₱${value / 1000}k`}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    domain={[0, "auto"]}
                  />
                  <ChartTooltip
                    cursor={{ stroke: "#2870e8", strokeWidth: 1, strokeDasharray: "4 4" }}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#2870e8"
                    strokeWidth={2}
                    fill="url(#fillIncome)"
                    dot={{ r: 4, fill: "#fff", stroke: "#2870e8", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#2870e8", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ChartContainer>
            </div>

            {/* Monthly Figures List */}
            <div className="border-t border-[#e5edf7] pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 dark:border-slate-700">
              <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>Monthly figures</span>
                <span>Estimated</span>
              </div>
              <div className="space-y-2">
                {monthlyFigures.map((fig) => (
                  <div
                    key={fig.period}
                    className="flex items-center justify-between border-b border-[#f1f5f9] pb-2 text-[11px] dark:border-slate-800"
                  >
                    <span className="text-slate-500">{fig.period}</span>
                    <span className="font-bold text-[#102c50] dark:text-white">
                      {formatCurrency(fig.income)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DashboardPanel>
      </div>

      {/* Bottom Row: Monthly Service History Table */}
      <div className="mt-4">
        <div id="monthly-service-history" />
        <DashboardPanel
          title="Monthly service history"
          description="Monthly request volume and recorded estimates from repair history."
          headerAction={
            <div ref={monthPickerRef} className="relative">
              <CommonButton
                variant="outline"
                type="button"
                onClick={toggleMonthPicker}
                aria-label="Select report month"
                aria-haspopup="listbox"
                aria-expanded={monthPickerOpen}
                className="flex items-center gap-2 border-[#d4ddea] px-3 py-1.5 text-[11px]"
              >
                {currentMonth}
              </CommonButton>
              {monthPickerOpen && createPortal(
                <div
                  ref={monthPopoverRef}
                  role="listbox"
                  aria-label="Select report month"
                  style={{ top: monthPickerPosition.top, left: monthPickerPosition.left }}
                  className="fixed z-[100] max-h-64 w-48 overflow-y-auto rounded-lg border border-[#d8e0eb] bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-[#111c2b]"
                >
                  {monthOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={option.value === selectedMonth}
                      onClick={() => {
                        setSelectedMonth(option.value);
                        setReport(null);
                        setMonthPickerOpen(false);
                      }}
                      className={`w-full rounded px-3 py-2 text-left text-[11px] transition-colors ${option.value === selectedMonth
                        ? "bg-[#eaf1ff] font-semibold text-[#2870e8] dark:bg-[#172a42] dark:text-[#8ec5ff]"
                        : "text-slate-600 hover:bg-[#f8fafc] dark:text-slate-300 dark:hover:bg-slate-800"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              , document.body)}
            </div>
          }
          contentClassName="p-0"
        >
          <DataTable
            columns={serviceHistoryColumns}
            data={serviceHistory}
            onRefresh={() => loadReport(true)}
            onPoll={() => loadReport(false)}
            refreshing={refreshing}
            emptyMessage="No repair history available."
          />
        </DashboardPanel>
      </div>
    </DashboardPage>
  );
}
