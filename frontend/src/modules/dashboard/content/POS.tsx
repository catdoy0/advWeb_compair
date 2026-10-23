import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import dayjs from "dayjs";

import CommonButton from "../../../components/common/widgets/CommonButton";
import MessageModal from "../../../components/common/modals/MessageModal";
import PageHeader from "../components/PageHeader";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";

import {
  checkoutRepair,
  getRepairByNumber,
  searchPosRepairs,
} from "../../../api/repair_requests";
import type { RepairDetail } from "../../../types/repair_requests";
import type { POSRepairSearchResult } from "../../../api/repair_requests";

const POS_PAGE_SIZE = 6;
const SEARCH_DEBOUNCE_MS = 400;

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
  RECEIVED: "bg-[#eef4ff] text-[#2870e8] dark:bg-[#172a42] dark:text-[#8ec5ff]",
  DIAGNOSING: "bg-[#fef3c7] text-[#b45309] dark:bg-[#3a2a0f] dark:text-[#fbbf24]",
  REPAIRING: "bg-[#dbeafe] text-[#1d4ed8] dark:bg-[#1e3a8a] dark:text-[#93c5fd]",
  COMPLETED: "bg-[#e6f5ef] text-[#15946a] dark:bg-[#1d4775] dark:text-[#00d68f]",
  RELEASED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  RECEIVED: "Received",
  DIAGNOSING: "Diagnosing",
  REPAIRING: "Repairing",
  COMPLETED: "Completed",
  RELEASED: "Released",
};

const COMPUTER_TYPE_LABEL: Record<string, string> = {
  LAPTOP: "Laptop",
  DESKTOP: "Desktop",
  OTHER: "Other",
};

function formatMoney(value: number | null): string {
  if (value === null) return "₱0";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDue(date: string | null, time: string | null): string {
  if (!date || !time) return "—";
  const d = dayjs(date);
  const t = dayjs(`2000-01-01T${time}`).format("h:mm A");
  if (d.isSame(dayjs(), "day")) return `Today, ${t}`;
  return `${d.format("MMM D")}, ${t}`;
}

function downloadReceipt(blob: Blob, repairNumber: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${repairNumber}_receipt.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function POS() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [repairs, setRepairs] = useState<POSRepairSearchResult[]>([]);
  const [repairCount, setRepairCount] = useState(0);
  const [page, setPage] = useState(1);
  const [resultsPage, setResultsPage] = useState(1);
  const [selected, setSelected] = useState<RepairDetail | null>(null);
  const [lookingUp, setLookingUp] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const searchRequestSequence = useRef(0);
  const lastSearchTerm = useRef("");
  const [completedSearchTerm, setCompletedSearchTerm] = useState<string | null>(null);
  const [searchError, setSearchError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const resultsMatchQuery = completedSearchTerm === query.trim();

  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageModalMessage, setMessageModalMessage] = useState("");


  useEffect(() => {
    const trimmed = query.trim();
    const requestId = ++searchRequestSequence.current;
    const searchChanged = lastSearchTerm.current !== trimmed;
    lastSearchTerm.current = trimmed;
    const debounceDelay = searchChanged && trimmed ? SEARCH_DEBOUNCE_MS : 0;

    const timeout = window.setTimeout(async () => {
      if (requestId !== searchRequestSequence.current) return;
      setLookingUp(true);
      try {
        const result = await searchPosRepairs(trimmed, page, POS_PAGE_SIZE);
        if (requestId !== searchRequestSequence.current) return;
        setRepairs(result.items);
        setRepairCount(result.total);
        setResultsPage(page);
        setCompletedSearchTerm(trimmed);
        setSearchError("");
        const lastPage = Math.max(1, Math.ceil(result.total / POS_PAGE_SIZE));
        if (page > lastPage) setPage(lastPage);
      } catch {
        if (requestId === searchRequestSequence.current) {
          setSearchError("Unable to search repairs. Please try again.");
        }
      } finally {
        if (requestId === searchRequestSequence.current) setLookingUp(false);
      }
    }, debounceDelay);

    return () => window.clearTimeout(timeout);
  }, [query, page, refreshTick]);

  async function handleQuickPick(repairNumber: string) {
    const requestId = ++searchRequestSequence.current;
    setLookingUp(true);
    try {
      const data = await getRepairByNumber(repairNumber);
      if (requestId !== searchRequestSequence.current) return;
      if (data === null) {
        setSearchError(`Could not load ${repairNumber}. Try selecting it again.`);
        return;
      }
      setSelected(data);
    } catch {
      if (requestId === searchRequestSequence.current) {
        setSearchError(`Unable to load ${repairNumber}. Please try again.`);
      }
    } finally {
      if (requestId === searchRequestSequence.current) setLookingUp(false);
    }
  }

  function handleRemove() {
    searchRequestSequence.current += 1;
    setLookingUp(false);
    setSelected(null);
    setQuery("");
  }

  function handleQueryChange(value: string) {
    searchRequestSequence.current += 1;
    setLookingUp(false);
    setSearchError("");
    setSelected(null);
    setPage(1);
    setQuery(value.toUpperCase());
  }

  function handleGoToRepairDetail() {
    if (!selected) return;
    navigate(`/dashboard/repair-queue?id=${selected.id}`);
  }

  async function handleCheckout() {
    if (!selected) return;

    const amount = selected.final_amount ?? selected.estimate_amount;
    if (amount === null || amount <= 0) {
      setMessageModalMessage("Add a repair total before checking out.");
      setMessageModalOpen(true);
      return;
    }

    setCheckingOut(true);
    try {
      const result = await checkoutRepair(selected.id);

      if (result.ok) {
        setSelected({ ...selected, status: "RELEASED" });
        if (result.receipt) downloadReceipt(result.receipt, selected.repair_number);
        setRefreshTick((tick) => tick + 1);
      }
      setMessageModalMessage(result.message);
      setMessageModalOpen(true);
    } catch {
      setMessageModalMessage("Unable to complete checkout. Please try again.");
      setMessageModalOpen(true);
    } finally {
      setCheckingOut(false);
    }
  }

  // `selected` widened to allow status mutation
  const total = selected?.final_amount ?? selected?.estimate_amount ?? null;

  return (
    <DashboardPage maxWidth="1240px" className="bg-[#f7f9fc] dark:bg-[#0f1724]">
      <MessageModal
        open={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        title={messageModalMessage}
      />

      <PageHeader
        eyebrow="Front desk / checkout"
        title="Repair checkout"
        description="Look up a repair request to review its service total and prepare the customer handoff."
      />

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        {/* Look up */}
        <DashboardPanel
          title="Find a repair"
          description="Look up the request before preparing the customer handoff."
          headerClassName="py-3"
        >
          <div className="p-5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Repair ID
            </label>
            <div className="relative mt-1.5">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="e.g. CP-1042"
                className="h-11 w-full rounded-md border border-[#cfd9e8] bg-white pl-9 pr-3 font-mono text-[12px] text-[#102c50] outline-none placeholder:font-sans placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white"
              />
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              Search by repair ID, customer, or device.
            </p>

            {searchError && (
              <p className="mt-5 text-[10px] text-red-500 dark:text-red-300">
                {searchError}
              </p>
            )}
            {repairs.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-2">
                {repairs.map((repair) => (
                  <button
                    key={repair.id}
                    type="button"
                    onClick={() => handleQuickPick(repair.repair_number)}
                    disabled={lookingUp || !resultsMatchQuery}
                    className="rounded-md border border-[#d8e0eb] bg-white px-3 py-2.5 text-[12px] font-bold text-[#102c50] transition-colors hover:border-[#2870e8] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-[#182536] dark:text-white dark:hover:bg-[#1c2c3f]"
                  >
                    <span className="block">{repair.repair_number}</span>
                    <span className="mt-1 block truncate text-left text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      {repair.customer_name} · {repair.computer_name}
                    </span>
                  </button>
                ))}
              </div>
            ) : lookingUp ? (
              <p className="mt-5 text-center text-[10px] text-slate-400">
                Searching repairs...
              </p>
            ) : resultsMatchQuery && !searchError ? (
              <p className="mt-5 text-center text-[10px] text-slate-400">
                {query.trim()
                  ? `No active repairs match “${query.trim()}”.`
                  : "No active repairs found."}
              </p>
            ) : null}

              <div className="mt-4 flex items-center justify-between">
                <p className="text-[10px] text-slate-400">
                  Showing {(resultsPage - 1) * POS_PAGE_SIZE + 1}–
                  {Math.min(resultsPage * POS_PAGE_SIZE, repairCount)} of {repairCount}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={!resultsMatchQuery || lookingUp || resultsPage <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-700"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="min-w-10 text-center text-[10px] text-slate-500 dark:text-slate-400">
                    {resultsPage} / {Math.ceil(repairCount / POS_PAGE_SIZE)}
                  </span>
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={
                      !resultsMatchQuery ||
                      lookingUp ||
                      resultsPage >= Math.ceil(repairCount / POS_PAGE_SIZE)
                    }
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-700"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

          </div>
        </DashboardPanel>

        {/* Summary */}
        <DashboardPanel
          title="Checkout summary"
          description="Repair totals are read from the service request."
          headerClassName="py-3"
        >
          <div className="p-5">
            {selected ? (
              <>
                {/* Identity */}
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {selected.repair_number}
                  </p>
                  <span
                    className={`inline-flex rounded px-2 py-1 text-[10px] font-bold ${
                      STATUS_BADGE[selected.status] ?? STATUS_BADGE.PENDING
                    }`}
                  >
                    {STATUS_LABEL[selected.status] ?? selected.status}
                  </span>
                </div>

                <h2 className="mt-3 text-[22px] font-bold text-[#102c50] dark:text-white">
                  {selected.computer_name}
                </h2>

                <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                  {selected.reported_problem}
                </p>

                {/* Details grid */}
                <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[#e5edf7] pt-5 dark:border-slate-700">
                  <div>
                    <dt className="text-[10px] text-slate-400">Customer</dt>
                    <dd className="mt-1 text-[12px] font-bold text-[#102c50] dark:text-white">
                      {selected.customer_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-slate-400">Due</dt>
                    <dd className="mt-1 text-[12px] font-bold text-[#102c50] dark:text-white">
                      {formatDue(
                        selected.appointment_date,
                        selected.appointment_time,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-slate-400">
                      Computer type
                    </dt>
                    <dd className="mt-1 text-[12px] font-bold text-[#102c50] dark:text-white">
                      {COMPUTER_TYPE_LABEL[selected.computer_type] ??
                        selected.computer_type}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-slate-400">
                      Assigned technician
                    </dt>
                    <dd className="mt-1 text-[12px] font-bold text-[#102c50] dark:text-white">
                      {selected.technician_name ?? "Unassigned"}
                    </dd>
                  </div>
                </dl>

                {/* Total */}
                <div className="mt-6 rounded-lg border border-[#e5edf7] bg-[#f8fafc] px-5 py-5 dark:border-slate-700 dark:bg-[#162334]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Estimated service total
                  </p>
                  <p className="mt-2 text-[36px] font-bold text-[#2870e8]">
                    {formatMoney(total)}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Use this request total when preparing the customer handoff.
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-between gap-2">

                  <CommonButton
                    onClick={handleGoToRepairDetail}
                  >
                    Go to repair detail
                  </CommonButton>

                  <div className="flex gap-2">
                    <CommonButton
                      onClick={handleRemove}
                      className="bg-[#c0392b] px-4 py-2 hover:bg-[#a83226]"
                    >
                      Remove item
                    </CommonButton>

                    <CommonButton
                      onClick={handleCheckout}
                      disabled={
                        checkingOut ||
                          selected.status === "RELEASED" ||
                          total === null ||
                          total <= 0 ||
                          !["COMPLETED", "REPAIRING"].includes(selected.status)
                      }
                      className="bg-[#15946a] px-4 py-2 hover:bg-[#0f7a55] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {checkingOut ? "Checking out..." : "Check out"}
                    </CommonButton>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-14 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef4ff] text-[#2870e8]">
                  <Search size={16} />
                </div>
                <p className="mt-3 text-[12px] font-semibold text-[#102c50] dark:text-white">
                  No repair loaded
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Look up a repair ID or click a shortcut to view its checkout summary.
                </p>
              </div>
            )}
          </div>
        </DashboardPanel>
      </div>
    </DashboardPage>
  );
}
