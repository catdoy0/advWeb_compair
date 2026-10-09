import { useEffect, useState } from "react";

import type { GetUser, TotalUsers } from "../types/administration";
import { getUsers, getTotalUsers, setUserActive, editUser, resetPassword } from "../api/administration";
import { toAccount } from "../modules/dashboard/content/administration/accountUtils";
import type {
  Account,
  AccountFilter,
} from "../modules/dashboard/content/administration/types";
import { useLoading } from "../context/LoadingContext";

const PAGE_SIZE = 10;

const FILTER_TO_ROLE: Record<AccountFilter, string> = {
  "All accounts": "",
  "Customer": "CUSTOMER",
  "Technician": "TECHNICIAN",
  "Staff": "STAFF",
  "Administrator": "ADMIN",
  "Super Admin": "SUPER_ADMIN",
};

export function useAccountsAdmin() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totals, setTotals] = useState<TotalUsers | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] =
    useState<AccountFilter>("All accounts");

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GetUser | null>(null);

  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageModalMessage, setMessageModalMessage] = useState("");

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

  const reload = async () => {
    const role = FILTER_TO_ROLE[activeFilter];

    const [usersRes, totalsRes] = await Promise.all([
      getUsers(PAGE_SIZE, page, search, role),
      getTotalUsers(),
    ]);

    setAccounts((usersRes ?? []).map(toAccount));
    setTotals(totalsRes);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (filter: AccountFilter) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const handleEditClick = (account: Account) => {
    setSelectedUser(account.raw);
    setEditModalOpen(true);
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleSuspendClick = (account: Account) => {
    setSelectedAccount(account);
    setSuspendModalOpen(true);
  };

  const handleSuspendClose = () => {
    setSuspendModalOpen(false);
    setSelectedAccount(null);
  };

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
          ? {
              ...a,
              status: nextActive ? "Active" : "Suspended",
              raw: { ...a.raw, is_active: nextActive },
            }
          : a,
      ),
    );
  };

  const totalAccounts = totals?.total_accounts ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalAccounts / PAGE_SIZE));
  const customerCount = totals?.customer_total ?? 0;
  const technicianCount = totals?.technician_total ?? 0;
  const staffCount = totals?.staff_total ?? 0;
  const administratorCount = totals?.administrator_total ?? 0;

  return {
    // data
    accounts,
    totals,
    loading,
    totalAccounts,
    totalPages,
    customerCount,
    technicianCount,
    staffCount,
    administratorCount,

    // query state
    search,
    page,
    activeFilter,
    setPage,

    // suspend modal
    suspendModalOpen,
    selectedAccount,
    handleSuspendClick,
    handleSuspendClose,
    handleSuspendConfirm,

    // edit modal
    editModalOpen,
    selectedUser,
    handleEditClick,
    handleEditClose,
    reload,

    // message modal
    messageModalOpen,
    messageModalMessage,
    setMessageModalOpen,

    // handlers
    handleSearchChange,
    handleFilterChange,
  };
}

export function useEditAccountForm(user: GetUser, onUpdated: () => void) {
  const { setLoading } = useLoading();
  const [firstName, setFirstName] = useState(user.first_name ?? "");
  const [lastName, setLastName] = useState(user.last_name ?? "");
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.is_active);

  const [baseline, setBaseline] = useState({
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
    email: user.email,
    role: user.role,
  });

  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageModalMessage, setMessageModalMessage] = useState("");

  const dirty =
    firstName !== baseline.firstName ||
    lastName !== baseline.lastName ||
    email !== baseline.email ||
    role !== baseline.role;

  const handleSave = async () => {
    if (!dirty) return;

    const updated: GetUser = {
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      email,
      role,
      is_active: isActive,
      last_sign_in: user.last_sign_in,
    };

    const result = await editUser(updated);

    setMessageModalMessage(result.message);
    setMessageModalOpen(true);

    if (!result.ok) return;

    onUpdated();
    setBaseline({ firstName, lastName, email, role });
  };

  const handleToggleActive = async () => {
    const nextActive = !isActive;

    const result = await setUserActive(user.id, nextActive);

    if (!result.ok) {
      setMessageModalMessage(result.message);
      setMessageModalOpen(true);
      return;
    }

    setIsActive(nextActive);
    onUpdated();
  };

  const handleResetPassword = async () => {
    setLoading(true);
    const result = await resetPassword(user.id);

    if (!result.ok) {
      setMessageModalMessage(result.message);
      setMessageModalOpen(true);
      return;
    }

    setMessageModalMessage(
      `New password for ${user.email}:\n\n${result.password}\n\n`,
    );
    setLoading(false);
    setMessageModalOpen(true);
  }

  return {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    role,
    setRole,
    isActive,
    dirty,
    handleSave,

    handleToggleActive,
    handleResetPassword,

    messageModalOpen,
    setMessageModalOpen,
    messageModalMessage,
  };
}
