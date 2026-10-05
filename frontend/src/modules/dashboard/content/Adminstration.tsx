import { useEffect, useState } from "react";
import {
  Archive,
  Download,
  RotateCcw,
  UserPlus,
} from "lucide-react";

import CommonButton from "../../../components/common/widgets/CommonButton";
import DataTable, {
  type DataTableColumn,
} from "../../../components/common/widgets/DataTable";
import PageHeader from "../components/PageHeader";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";

import { getUsers, getTotalUsers } from "../../../api/administration";
import type { GetUsers, TotalUsers } from "../../../types/administration";

type AccountRole = "Customer" | "Technician" | "Staff" | "Administrator";

interface Account {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  status: "Active" | "Suspended";
  lastSignIn: string;
}

const ROLE_LABEL: Record<string, AccountRole> = {
  CUSTOMER: "Customer",
  TECHNICIAN: "Technician",
  STAFF: "Staff",
  ADMIN: "Administrator",
  SUPER_ADMIN: "Administrator",
};

function formatLastSignIn(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";

  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const sameDay = d.toDateString() === new Date().toDateString();
  if (sameDay) return `Today, ${time}`;

  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toAccount(u: GetUsers): Account {
  const name =
    [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email;

  return {
    id: `USR-${String(u.id).padStart(3, "0")}`,
    name,
    email: u.email,
    role: ROLE_LABEL[u.role] ?? "Customer",
    status: u.is_active ? "Active" : "Suspended",
    lastSignIn: formatLastSignIn(u.last_sign_in),
  };
}

const accountColumns: DataTableColumn<Account>[] = [
  {
    key: "account",
    label: "Account",
    render: (account) => (
      <>
        <p className="text-[11px] font-bold text-[#102c50] dark:text-white">
          {account.name}
        </p>
        <p className="mt-0.5 text-[9px] text-slate-400">
          {account.email} · {account.id}
        </p>
      </>
    ),
  },
  { key: "role", label: "Role" },
  {
    key: "status",
    label: "Status",
    render: (account) => (
      <span className="inline-flex rounded bg-[#e6f5ef] px-2 py-1 text-[9px] font-bold text-[#15946a]">
        {account.status}
      </span>
    ),
  },
  { key: "lastSignIn", label: "Last sign in" },
  {
    key: "actions",
    label: "Actions",
    render: () => <AccountActions />,
  },
];

type AccountFilter = "All accounts" | AccountRole;

export default function Adminstration() {
  const [activeFilter, setActiveFilter] =
    useState<AccountFilter>("All accounts");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totals, setTotals] = useState<TotalUsers | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [usersRes, totalsRes] = await Promise.all([
        getUsers(10, 1, ""),
        getTotalUsers(),
      ]);
      if (cancelled) return;

      setAccounts((usersRes ?? []).map(toAccount));
      setTotals(totalsRes);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAccounts =
    activeFilter === "All accounts"
      ? accounts
      : accounts.filter((account) => account.role === activeFilter);

  const totalAccounts = totals?.total_accounts ?? 0;
  const customerCount = totals?.customer_total ?? 0;
  const technicianCount = totals?.technician_total ?? 0;
  const staffCount = totals?.staff_total ?? 0;
  const administratorCount = totals?.administrator_total ?? 0;

  return (
    <DashboardPage
      maxWidth="1240px"
      className="flex-1 bg-[#f7f9fc] dark:bg-[#0f1724]"
    >
      {/* Header */}
      <PageHeader
        eyebrow="Manage / Access"
        title="Account administration"
        description="Manage access, review account status, and keep recoverable workspace backups."
      />

      {/* Statistics */}
      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <SummaryCard
          label="Managed accounts"
          value={totalAccounts}
          detail={`${accounts.filter((a) => a.status === "Active").length} active accounts`}
        />

        <SummaryCard
          label="Customer accounts"
          value={customerCount}
          detail="Customer portal access"
        />

        <SummaryCard
          label="Latest backup"
          value="None"
          detail="Create a recoverable workspace copy"
          valueText
        />
      </div>

      {/* Account management */}
      <DashboardPanel
        className="mt-5"
        title="Account management"
        description="Filter users by role, then grant, suspend, restore, or reset access without deleting account history."
        headerClassName="items-start border-0 px-5 pb-0 pt-3"
        contentClassName=""
        headerAction={
          <CommonButton className="flex shrink-0 items-center gap-2 px-4 py-2">
            Create account
            <UserPlus size={14} />
          </CommonButton>
        }
      >
        <div className="border-b border-[#d8e0eb] px-5 pb-2 dark:border-slate-700">
          <div className="flex gap-1 overflow-x-auto">
            <AccountFilterButton
              label="All accounts"
              count={totalAccounts}
              active={activeFilter === "All accounts"}
              onClick={() => setActiveFilter("All accounts")}
            />
            <AccountFilterButton
              label="Customers"
              count={customerCount}
              active={activeFilter === "Customer"}
              onClick={() => setActiveFilter("Customer")}
            />
            <AccountFilterButton
              label="Technicians"
              count={technicianCount}
              active={activeFilter === "Technician"}
              onClick={() => setActiveFilter("Technician")}
            />
            <AccountFilterButton
              label="Staff"
              count={staffCount}
              active={activeFilter === "Staff"}
              onClick={() => setActiveFilter("Staff")}
            />
            <AccountFilterButton
              label="Administrators"
              count={administratorCount}
              active={activeFilter === "Administrator"}
              onClick={() => setActiveFilter("Administrator")}
            />
          </div>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-center text-[11px] text-slate-400">
            Loading accounts…
          </div>
        ) : (
          <DataTable
            columns={accountColumns}
            data={filteredAccounts}
            emptyMessage="No accounts found for this role."
          />
        )}
      </DashboardPanel>

      {/* Backups */}
      <DashboardPanel
        className="mt-8"
        title="Workspace backups"
        description="Create a point-in-time copy before major changes."
        headerClassName="flex-col items-start px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
        headerAction={
          <div className="flex gap-2">
            <CommonButton
              variant="outline"
              className="flex items-center gap-2 border-[#d4ddea] px-4 py-2"
              disabled
            >
              <RotateCcw size={14} />
              Restore backup
            </CommonButton>

            <CommonButton className="flex items-center gap-2 px-4 py-2">
              <Download size={14} />
              Create backup
            </CommonButton>
          </div>
        }
      >
        <div className="flex min-h-[210px] flex-col items-center justify-center text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef4ff] text-[#2870e8]">
            <Download size={16} />
          </div>

          <h3 className="mt-4 text-[14px] font-bold text-[#102c50] dark:text-white">
            No backups yet
          </h3>

          <p className="mt-1 text-[11px] text-slate-400">
            Create one before changing account access or inventory.
          </p>
        </div>
      </DashboardPanel>
    </DashboardPage>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  valueText = false,
}: {
  label: string;
  value: number | string;
  detail: string;
  valueText?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#d8e0eb] bg-white px-4 py-4 dark:border-slate-700 dark:bg-[#111c2b]">
      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p
        className={`mt-4 font-semibold text-[#102c50] dark:text-white ${
          valueText ? "text-[19px]" : "text-[27px]"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
    </div>
  );
}

function AccountFilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-[11px] font-semibold transition-colors ${
        active
          ? "bg-[#eef4ff] text-[#2870e8] ring-1 ring-[#cfe0ff]"
          : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
      }`}
    >
      {label}

      <span
        className={
          active
            ? "text-[#7da9ee]"
            : "text-slate-400"
        }
      >
        {count}
      </span>
    </button>
  );
}

function AccountActions() {
  return (
    <div className="flex items-center gap-5 whitespace-nowrap">
          <button
            type="button"
            className="text-[10px] font-semibold text-[#2870e8] hover:underline"
          >
            Suspend
          </button>

          <button
            type="button"
            className="text-[10px] font-semibold text-[#2870e8] hover:underline"
          >
            Reset password
          </button>

          <button
            type="button"
            className="flex items-center gap-1.5 text-[10px] font-semibold text-[#2870e8] hover:underline"
          >
            <Archive size={13} />
            Archive
          </button>
    </div>
  );
}
