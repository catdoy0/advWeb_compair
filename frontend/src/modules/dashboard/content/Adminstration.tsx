import { useEffect, useState } from "react";
import { Download, RotateCcw } from "lucide-react";

import CommonButton from "../../../components/common/widgets/CommonButton";
import DataTable, {
  type DataTableColumn,
} from "../../../components/common/widgets/DataTable";
import PageHeader from "../components/PageHeader";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";

import { getUsers, getTotalUsers, setUserActive } from "../../../api/administration";
import type { GetUser, TotalUsers } from "../../../types/administration";
import AreYouSureModal from "../../../components/common/modals/AreYouSureModal";
import AccountActions from "./administration/AccountActions";
import AccountFilterButton from "./administration/AccountFilterButton";
import SummaryCard from "./administration/SummaryCard";
import { toAccount } from "./administration/accountUtils";
import type { Account, AccountFilter } from "./administration/types";
import EditAccountModal from "./administration/EditAccountModal";

export default function Adminstration() {
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GetUser | null>(null);

  const [activeFilter, setActiveFilter] =
    useState<AccountFilter>("All accounts");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totals, setTotals] = useState<TotalUsers | null>(null);
  const [loading, setLoading] = useState(true);



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
        <span
          className={`inline-flex rounded px-2 py-1 text-[9px] font-bold ${
account.status === "Active"
? "bg-[#e6f5ef] text-[#15946a]"
: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
}`}
        >
          {account.status}
        </span>
      ),
    },
    { key: "lastSignIn", label: "Last sign in" },
    {
      key: "actions",
      label: "Actions",
      render: (account) => (
        <AccountActions
          account={account}
          onEdit={(a) => {
            setSelectedUser(a.raw);
            setEditModalOpen(true);
          }}
          onSuspend={(a) => {
            setSelectedAccount(a);
            setSuspendModalOpen(true);
          }}
        />
      ),
    },
  ];

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
      <AreYouSureModal
        open={suspendModalOpen}
        onClose={() => {
          setSuspendModalOpen(false);
          setSelectedAccount(null);
        }}
        onConfirm={async () => {
          if (!selectedAccount) return;

          const nextActive = selectedAccount.raw.is_active === false; // true if currently suspended → unsuspend
          await setUserActive(selectedAccount.raw.id, nextActive);

          setAccounts((prev) =>
            prev.map((a) =>
              a.raw.id === selectedAccount.raw.id
                ? {
                  ...a,
                  status: nextActive ? "Active" : "Suspended",
                  raw: { ...a.raw, is_active: nextActive },
                }
                : a,
            ),
          );

          setSuspendModalOpen(false);
          setSelectedAccount(null);
        }}
        header={
          selectedAccount?.raw.is_active === false
            ? `Unsuspend ${selectedAccount?.name ?? ""}`
            : `Suspend ${selectedAccount?.name ?? ""}`
        }
        description={
          selectedAccount?.raw.is_active === false
            ? "They will be able to sign in again once access is restored."
            : "They will no longer be able to sign in until access is restored."
        }
      />

      <EditAccountModal
        key={selectedUser?.id ?? "none"}
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onUpdated={() => {
          getUsers(10, 1, "").then((res) => {
            if (res) setAccounts(res.map(toAccount));
          });
        }}
      />

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
