import { useEffect, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import dayjs from "dayjs";

import CommonButton from "../../../components/common/widgets/CommonButton";
import MessageModal from "../../../components/common/modals/MessageModal";
import PageHeader from "../components/PageHeader";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";

import {
  checkoutRepair,
  getRepairByNumber,
  listPosRecent,
} from "../../../api/repair_requests";
import type { RepairDetail } from "../../../types/repair_requests";
import type { POSRecentRepair } from "../../../api/repair_requests";

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

export default function POS() {
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<POSRecentRepair[]>([]);
  const [selected, setSelected] = useState<RepairDetail | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageModalMessage, setMessageModalMessage] = useState("");


  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await listPosRecent();
      if (cancelled) return;
      setRecent(data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshRecent() {
    const data = await listPosRecent();
    setRecent(data);
  }

  async function handleLookup() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLookingUp(true);
    try {
      const data = await getRepairByNumber(trimmed);
      if (data === null) {
        setMessageModalMessage(`No repair found for "${trimmed}".`);
        setMessageModalOpen(true);
        return;
      }
      setSelected(data);
      setQuery("");
    } finally {
      setLookingUp(false);
    }
  }

  async function handleQuickPick(repairNumber: string) {
    setLookingUp(true);
    try {
      const data = await getRepairByNumber(repairNumber);
      if (data === null) {
        setMessageModalMessage(`Could not load ${repairNumber}.`);
        setMessageModalOpen(true);
        return;
      }
      setSelected(data);
    } finally {
      setLookingUp(false);
    }
  }

  function handleRemove() {
    setSelected(null);
    setQuery("");
  }

  async function handleCheckout() {
    if (!selected) return;

    setCheckingOut(true);
    try {
      const result = await checkoutRepair(selected.id);
      setMessageModalMessage(result.message);
      setMessageModalOpen(true);

      if (result.ok) {
        setSelected({ ...selected, status: "RELEASED" });
        refreshRecent();
      }
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
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLookup();
                }}
                placeholder="e.g. CP-1042"
                className="h-11 w-full rounded-md border border-[#cfd9e8] bg-white pl-9 pr-3 font-mono text-[12px] text-[#102c50] outline-none placeholder:font-sans placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white"
              />
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              Use the ID printed on the repair intake or customer message.
            </p>

            {/* Quick picks */}
            {recent.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-2">
                {recent.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleQuickPick(r.repair_number)}
                    disabled={lookingUp}
                    className="rounded-md border border-[#d8e0eb] bg-white px-3 py-2.5 text-[12px] font-bold text-[#102c50] transition-colors hover:border-[#2870e8] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-[#182536] dark:text-white dark:hover:bg-[#1c2c3f]"
                  >
                    {r.repair_number}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <CommonButton
                onClick={handleLookup}
                disabled={lookingUp || query.trim().length === 0}
                className="flex items-center gap-2 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {lookingUp ? "Looking up..." : "Look up repair"}
                {!lookingUp && <ArrowRight size={13} />}
              </CommonButton>
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
                <div className="mt-6 flex justify-end gap-2">
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
                      !["COMPLETED", "REPAIRING"].includes(selected.status)
                    }
                    className="bg-[#15946a] px-4 py-2 hover:bg-[#0f7a55] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checkingOut ? "Checking out..." : "Check out"}
                  </CommonButton>
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
