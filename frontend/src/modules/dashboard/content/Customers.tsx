import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Laptop, RefreshCw, Search, UsersRound, Wrench } from "lucide-react";

import { getCustomers } from "../../../api/administration";
import type { CustomerDirectoryResponse, CustomerDirectoryItem } from "../../../types/administration";
import CommonButton from "../../../components/common/widgets/CommonButton";
import DataTable, { type DataTableColumn } from "../../../components/common/widgets/DataTable";
import PageHeader from "../components/PageHeader";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";
import SummaryCard from "./administration/SummaryCard";
import { setIfChanged } from "../../../utils/setIfChanged";

const PAGE_SIZE = 10;

function formatDate(value: string | null | undefined): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function customerName(customer: CustomerDirectoryItem): string {
  return [customer.first_name, customer.last_name].filter(Boolean).join(" ") || customer.email;
}

export default function Customers() {
  const [data, setData] = useState<CustomerDirectoryResponse | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const result = await getCustomers(page, PAGE_SIZE, search.trim());
      if (cancelled) return;
      setData(result);
      setError(!result);
      setLoading(false);
    }, search ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [page, search, refreshTick]);

  const customers = data?.items ?? [];
  const summary = data?.summary;
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const columns: DataTableColumn<CustomerDirectoryItem>[] = [
    {
      key: "customer",
      label: "Customer",
      className: "min-w-[220px]",
      sortValue: (customer) => customerName(customer),
      render: (customer) => (
        <>
          <p className="font-semibold text-[#102c50] dark:text-white">{customerName(customer)}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">{customer.email} · CUS-{String(customer.id).padStart(4, "0")}</p>
        </>
      ),
    },
    {
      key: "device_count",
      label: "Devices",
      className: "w-[12%]",
      render: (customer) => <span>{customer.device_count}</span>,
    },
    {
      key: "repair_count",
      label: "Repair requests",
      className: "w-[16%]",
      render: (customer) => <span>{customer.repair_count}</span>,
    },
    {
      key: "created_at",
      label: "Customer since",
      className: "w-[16%]",
      render: (customer) => <span className="text-slate-500 dark:text-slate-400">{formatDate(customer.created_at)}</span>,
    },
    {
      key: "last_sign_in",
      label: "Last sign in",
      className: "w-[16%]",
      render: (customer) => <span className="text-slate-500 dark:text-slate-400">{formatDate(customer.last_sign_in)}</span>,
    },
    {
      key: "is_active",
      label: "Account",
      className: "w-[12%]",
      render: (customer) => (
        <span className={`inline-flex rounded px-2 py-1 text-[9px] font-bold ${customer.is_active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
        }`}>
          {customer.is_active ? "Active" : "Suspended"}
        </span>
      ),
    },
  ];

  return (
    <DashboardPage maxWidth="1240px" className="flex-1 bg-[#f7f9fc] dark:bg-[#0f1724]">
      <PageHeader
        eyebrow="Directory / customers"
        title="Customer directory"
        description="View customer accounts alongside their registered devices and repair history."
        action={
          <CommonButton
            variant="outline"
            className="flex items-center gap-2 px-4 py-2"
            onClick={() => setRefreshTick((tick) => tick + 1)}
            disabled={loading}
          >
            <RefreshCw size={14} />
            Refresh
          </CommonButton>
        }
      />

      {error && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>Could not load customer data. Check your connection and try again.</span>
          <button onClick={() => setRefreshTick((tick) => tick + 1)} className="font-semibold hover:underline">Retry</button>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Customer accounts"
          value={summary?.total_customers ?? "—"}
          detail="Registered customer profiles"
        />
        <SummaryCard
          label="Returning customers"
          value={summary?.returning_customers ?? "—"}
          detail="More than one repair request"
        />
        <SummaryCard
          label="Devices on record"
          value={summary?.devices_on_record ?? "—"}
          detail="Registered to customer accounts"
        />
        <SummaryCard
          label="Active accounts"
          value={summary?.active_customers ?? "—"}
          detail="Customers sign in today"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search customer name or email"
            className="h-10 w-full rounded-md border border-[#d8e0eb] bg-white pl-9 pr-3 text-[11px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white"
          />
        </div>
      </div>

      <DashboardPanel
        className="mt-4"
        title="Customers"
        description={`${data?.total ?? 0} customer accounts`}
        headerClassName="items-start border-0 px-5 pb-0 pt-4"
      >
        {loading ? (
          <p className="px-5 py-10 text-center text-[11px] text-slate-400">Loading customers…</p>
        ) : (
          <DataTable
            columns={columns}
            data={customers}
            onRefresh={() => setRefreshTick((tick) => tick + 1)}
            onPoll={async () => {
              const result = await getCustomers(page, PAGE_SIZE, search.trim());
              if (result) setIfChanged(setData, result);
            }}
            refreshing={loading}
            emptyMessage={search ? "No customers match your search." : "No customer accounts yet."}
          />
        )}

        <div className="flex items-center justify-center gap-3 border-t border-[#e8eef7] px-5 py-3 dark:border-slate-700">
          <CommonButton
            variant="outline"
            aria-label="Previous page"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || loading}
            className="flex items-center gap-1 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={13} />
          </CommonButton>
          <span className="text-xs text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
          <CommonButton
            variant="outline"
            aria-label="Next page"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || loading}
            className="flex items-center gap-1 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight size={13} />
          </CommonButton>
        </div>
      </DashboardPanel>

      <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400">
        <UsersRound size={13} /> Customer counts come from registered accounts.
        <Laptop size={13} className="ml-2" /> Device totals reflect linked customer records.
        <Wrench size={13} className="ml-2" /> Repair totals reflect linked requests.
      </div>
    </DashboardPage>
  );
}
