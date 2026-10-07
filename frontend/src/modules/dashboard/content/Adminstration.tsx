import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, RotateCcw, Search } from "lucide-react";

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
import MessageModal from "../../../components/common/modals/MessageModal";

const PAGE_SIZE = 10;

const FILTER_TO_ROLE: Record<AccountFilter, string> = {
  "All accounts": "",
  "Customer": "CUSTOMER",
  "Technician": "TECHNICIAN",
  "Staff": "STAFF",
  "Administrator": "ADMIN",
  "Super Admin": "SUPER_ADMIN",
};

export default function Adminstration() {
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageModalMessage, setMessageModalMessage] = useState("");

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GetUser | null>(null);

  const [activeFilter, setActiveFilter] = useState<AccountFilter>("All accounts");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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

    const timer = setTimeout(async () => {
      const role = FILTER_TO_ROLE[activeFilter];

      const [usersRes, totalsRes] = await Promise.all([
        getUsers(PAGE_SIZE, page, search, role),
        getTotalUsers(),
      ]);

      if (cancelled) return;

      setAccounts((usersRes ?? []).map(toAccount));
      setTotals(totalsRes);
      setLoading(false);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, page, activeFilter]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (filter: AccountFilter) => {
    setActiveFilter(filter);
    setPage(1);
  };



  // useEffect(() => {
  //   let cancelled = false;
  //
  //   (async () => {
  //     setLoading(true);
  //     const [usersRes, totalsRes] = await Promise.all([
  //       getUsers(10, 1, ""),
  //       getTotalUsers(),
  //     ]);
  //     if (cancelled) return;
  //
  //     setAccounts((usersRes ?? []).map(toAccount));
  //     setTotals(totalsRes);
  //     setLoading(false);
  //   })();
  //
  //   return () => {
  //     cancelled = true;
  //   };
  // }, []);


const totalAccounts = totals?.total_accounts ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalAccounts / PAGE_SIZE));
  const customerCount = totals?.customer_total ?? 0;
  const technicianCount = totals?.technician_total ?? 0;
  const staffCount = totals?.staff_total ?? 0;
  const administratorCount = totals?.administrator_total ?? 0;

  const handleSuspendConfirm = async () => {
    if (!selectedAccount) return;

    const targetId = selectedAccount.raw.id;
    const nextActive = selectedAccount.raw.is_active === false;

    const result = await setUserActive(targetId, nextActive);

    setSuspendModalOpen(false);
    setSelectedAccount(null);

    setMessageModalMessage(result.message);
    setMessageModalOpen(true);

    if (!result.ok) return;

    setAccounts((prev) =>
      prev.map((a) =>
        a.raw.id === targetId
          ? { ...a, status: nextActive ? "Active" : "Suspended", raw: { ...a.raw, is_active: nextActive } }
          : a,
      ),
    );
  };

  return (
    <DashboardPage
      maxWidth="1240px"
      className="flex-1 bg-[#f7f9fc] dark:bg-[#0f1724]"
    >
      <MessageModal
        open={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        title={messageModalMessage || "Operation Successful"}
      />

      <AreYouSureModal
        open={suspendModalOpen}
        onClose={() => {
          setSuspendModalOpen(false);
          setSelectedAccount(null);
        }}
        onConfirm={handleSuspendConfirm}
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

      <PageHeader
        eyebrow="Manage / Access"
        title="Account administration"
        description="Manage access, review account status, and keep recoverable workspace backups."
      />

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <SummaryCard
          label="Managed accounts"
          value={totalAccounts || ""}
          detail={`${accounts.filter((a) => a.status === "Active").length} active accounts`}
        />

        <SummaryCard
          label="Customer accounts"
          value={customerCount || ""}
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
        {/* Search */}
        <div className="px-5 pt-3 mb-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by first name, last name, or email"
              className="h-10 w-xs rounded-md border border-[#cfd9e8] bg-white pl-9 pr-3 text-[12px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white"
            />
          </div>
        </div>

        <div className="border-b border-[#d8e0eb] px-5 pb-2 dark:border-slate-700">
          <div className="flex gap-1 overflow-x-auto">
            <AccountFilterButton
              label="All accounts"
              count={totalAccounts}
              active={activeFilter === "All accounts"}
              onClick={() => handleFilterChange("All accounts")}
            />
            <AccountFilterButton
              label="Customers"
              count={customerCount}
              active={activeFilter === "Customer"}
              onClick={() => handleFilterChange("Customer")}
            />
            <AccountFilterButton
              label="Technicians"
              count={technicianCount}
              active={activeFilter === "Technician"}
              onClick={() => handleFilterChange("Technician")}
            />
            <AccountFilterButton
              label="Staff"
              count={staffCount}
              active={activeFilter === "Staff"}
              onClick={() => handleFilterChange("Staff")}
            />
            <AccountFilterButton
              label="Administrators"
              count={administratorCount}
              active={activeFilter === "Administrator"}
              onClick={() => handleFilterChange("Administrator")}
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
              data={accounts}
              emptyMessage="No accounts found for this role."
            />
          )}
        <div className="flex justify-center border-t border-[#e8eef7] px-5 py-3 dark:border-slate-700">

          <div className="flex gap-2 items-center">
            <CommonButton
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1.5 border-[#d4ddea] px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={13} />
            </CommonButton>
            <div className="flex flex-col text-xs text-slate-500 dark:text-slate-400">
              <p> Page </p>
              <p> {page} of {totalPages} </p>
            </div>

            <CommonButton
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
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
