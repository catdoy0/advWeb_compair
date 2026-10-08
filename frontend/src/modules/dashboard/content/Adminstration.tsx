import { ChevronLeft, ChevronRight, Download, RotateCcw, Search } from "lucide-react";

import CommonButton from "../../../components/common/widgets/CommonButton";
import DataTable, { type DataTableColumn } from "../../../components/common/widgets/DataTable";
import PageHeader from "../components/PageHeader";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";

import AreYouSureModal from "../../../components/common/modals/AreYouSureModal";
import MessageModal from "../../../components/common/modals/MessageModal";
import AccountActions from "./administration/AccountActions";
import AccountFilterButton from "./administration/AccountFilterButton";
import SummaryCard from "./administration/SummaryCard";
import EditAccountModal from "./administration/EditAccountModal";
import type { Account } from "./administration/types";
import { useAccountsAdmin } from "../../../hooks/administration";

const accountColumns = (
  onEdit: (account: Account) => void,
  onSuspend: (account: Account) => void,
): DataTableColumn<Account>[] => [
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
            ? "bg-[#e6f5ef] dark:bg-[#1d4775] text-[#15946a] dark:text-[#00d68f]"
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
        onEdit={onEdit}
        onSuspend={onSuspend}
      />
    ),
  },
];

export default function Adminstration() {
  const admin = useAccountsAdmin();

  const columns = accountColumns(admin.handleEditClick, admin.handleSuspendClick);

  return (
    <DashboardPage maxWidth="1240px" className="flex-1 bg-[#f7f9fc] dark:bg-[#0f1724]">
      <MessageModal
        open={admin.messageModalOpen}
        onClose={() => admin.setMessageModalOpen(false)}
        title={admin.messageModalMessage || "Operation Successful"}
      />

      <AreYouSureModal
        open={admin.suspendModalOpen}
        onClose={admin.handleSuspendClose}
        onConfirm={admin.handleSuspendConfirm}
        header={
          admin.selectedAccount?.raw.is_active === false
            ? `Unsuspend ${admin.selectedAccount?.name ?? ""}`
            : `Suspend ${admin.selectedAccount?.name ?? ""}`
        }
        description={
          admin.selectedAccount?.raw.is_active === false
            ? "They will be able to sign in again once access is restored."
            : "They will no longer be able to sign in until access is restored."
        }
      />

      <EditAccountModal
        key={admin.selectedUser?.id ?? "none"}
        open={admin.editModalOpen}
        onClose={admin.handleEditClose}
        user={admin.selectedUser}
        onUpdated={admin.reload}
      />

      <PageHeader
        eyebrow="Manage / Access"
        title="Account administration"
        description="Manage access, review account status, and keep recoverable workspace backups."
      />

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <SummaryCard
          label="Managed accounts"
          value={admin.totalAccounts || ""}
          detail={`${admin.accounts.filter((a) => a.status === "Active").length} active accounts`}
        />

        <SummaryCard
          label="Customer accounts"
          value={admin.customerCount || ""}
          detail="Customer portal access"
        />

        <SummaryCard
          label="Latest backup"
          value="None"
          detail="Create a recoverable workspace copy"
          valueText
        />
      </div>

      <DashboardPanel
        className="mt-5"
        title="Account management"
        description="Filter users by role, then grant, suspend, restore, or reset access without deleting account history."
        headerClassName="items-start border-0 px-5 pb-0 pt-3"
        contentClassName=""
      >
        <div className="px-5 pt-3 mb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={admin.search}
              onChange={(e) => admin.handleSearchChange(e.target.value)}
              placeholder="Search by first name, last name, or email"
              className="h-10 w-xs rounded-md border border-[#cfd9e8] bg-white pl-9 pr-3 text-[12px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white"
            />
          </div>
        </div>

        <div className="border-b border-[#d8e0eb] px-5 pb-2 dark:border-slate-700">
          <div className="flex gap-1 overflow-x-auto">
            <AccountFilterButton
              label="All accounts"
              count={admin.totalAccounts}
              active={admin.activeFilter === "All accounts"}
              onClick={() => admin.handleFilterChange("All accounts")}
            />
            <AccountFilterButton
              label="Customers"
              count={admin.customerCount}
              active={admin.activeFilter === "Customer"}
              onClick={() => admin.handleFilterChange("Customer")}
            />
            <AccountFilterButton
              label="Technicians"
              count={admin.technicianCount}
              active={admin.activeFilter === "Technician"}
              onClick={() => admin.handleFilterChange("Technician")}
            />
            <AccountFilterButton
              label="Staff"
              count={admin.staffCount}
              active={admin.activeFilter === "Staff"}
              onClick={() => admin.handleFilterChange("Staff")}
            />
            <AccountFilterButton
              label="Administrators"
              count={admin.administratorCount}
              active={admin.activeFilter === "Administrator"}
              onClick={() => admin.handleFilterChange("Administrator")}
            />
          </div>
        </div>

        {admin.loading ? (
          <div className="px-5 py-8 text-center text-[11px] text-slate-400">
            Loading accounts…
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={admin.accounts}
            emptyMessage="No accounts found for this role."
          />
        )}

        <div className="flex justify-center border-t border-[#e8eef7] px-5 py-3 dark:border-slate-700">
          <div className="flex gap-2 items-center">
            <CommonButton
              variant="outline"
              onClick={() => admin.setPage((p) => Math.max(1, p - 1))}
              disabled={admin.page <= 1}
              className="flex items-center gap-1.5 border-[#d4ddea] px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={13} />
            </CommonButton>

            <div className="flex flex-col text-xs text-slate-500 dark:text-slate-400">
              <p>Page</p>
              <p>{admin.page} of {admin.totalPages}</p>
            </div>

            <CommonButton
              variant="outline"
              onClick={() => admin.setPage((p) => Math.min(admin.totalPages, p + 1))}
              disabled={admin.page >= admin.totalPages}
              className="flex items-center gap-1.5 border-[#d4ddea] px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight size={13} />
            </CommonButton>
          </div>
        </div>
      </DashboardPanel>

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
