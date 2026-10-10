import { useEffect, useState } from "react";
import { Package, Pencil, Plus, Search } from "lucide-react";

import CommonButton from "../../../components/common/widgets/CommonButton";
import DataTable, {
  type DataTableColumn,
} from "../../../components/common/widgets/DataTable";
import PageHeader from "../components/PageHeader";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";
import ReceiveStockModal from "./parts-inventory/ReceiveStockModal";
import PartFormModal from "./parts-inventory/PartFormModal";

import {
  listCategories,
  listParts,
  getInventorySummary,
} from "../../../api/parts";
import type { InventorySummary, Part } from "../../../types/parts";

// ---------- helpers ----------

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

// ---------- page ----------

export default function PartsInventory() {
  const [parts, setParts] = useState<Part[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [summary, setSummary] = useState<InventorySummary>({
    total_skus: 0,
    needs_reorder: 0,
    units_on_hand: 0,
    stock_value: 0,
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const [receiveModalOpen, setReceiveModalOpen] = useState(false);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  // fetch parts + summary; refreshTick forces a re-run
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const [partsRes, summaryRes] = await Promise.all([
        listParts(search, category),
        getInventorySummary(),
      ]);
      if (cancelled) return;
      setParts(partsRes);
      setSummary(summaryRes);
      setLoading(false);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, category, refreshTick]);

  // categories load once per refresh
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await listCategories();
      if (cancelled) return;
      setCategories(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const refresh = () => setRefreshTick((t) => t + 1);

  const openCreate = () => {
    setFormMode("create");
    setEditingPart(null);
    setFormModalOpen(true);
  };

  const openEdit = (part: Part) => {
    setFormMode("edit");
    setEditingPart(part);
    setFormModalOpen(true);
  };

  const columns: DataTableColumn<Part>[] = [
    {
      key: "name",
      label: "Part",
      className: "w-[22%]",
      render: (p) => (
        <>
          <p className="text-[11px] font-semibold text-[#102c50] dark:text-white">
            {p.name}
          </p>
          <p className="mt-0.5 text-[9px] text-slate-400">
            SKU-{String(p.id).padStart(3, "0")}
            {p.supplier ? ` · ${p.supplier}` : ""}
          </p>
        </>
      ),
    },
    {
      key: "sku",
      label: "SKU",
      className: "w-[13%]",
      render: (p) => (
        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
          {p.sku}
        </span>
      ),
    },
    { key: "category", label: "Category", className: "w-[11%]" },
    {
      key: "quantity",
      label: "On hand",
      className: "w-[8%]",
      render: (p) => (
        <span
          className={`text-[12px] font-bold ${
            p.is_low_stock
              ? "text-[#b45309] dark:text-[#fbbf24]"
              : "text-[#15946a] dark:text-[#00d68f]"
          }`}
        >
          {p.quantity}
        </span>
      ),
    },
    {
      key: "reorder_threshold",
      label: "Reorder at",
      className: "w-[9%]",
      render: (p) => (
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {p.reorder_threshold}
        </span>
      ),
    },
    {
      key: "unit_price",
      label: "Unit cost",
      className: "w-[10%]",
      render: (p) => (
        <span className="text-[11px] font-semibold text-[#102c50] dark:text-white">
          {formatMoney(p.unit_price)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      className: "w-[11%]",
      render: (p) => (
        <span
          className={`inline-flex rounded px-2 py-1 text-[9px] font-bold ${
            p.is_low_stock
              ? "bg-[#fef3c7] text-[#b45309] dark:bg-[#3a2a0f] dark:text-[#fbbf24]"
              : "bg-[#e6f5ef] text-[#15946a] dark:bg-[#1d4775] dark:text-[#00d68f]"
          }`}
        >
          {p.is_low_stock ? "Low stock" : "In stock"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-[6%]",
      render: (p) => (
        <button
          type="button"
          onClick={() => openEdit(p)}
          aria-label={`Edit ${p.name}`}
          className="flex items-center gap-1 text-[10px] font-semibold text-[#2870e8] hover:underline"
        >
          <Pencil size={12} />
          Edit
        </button>
      ),
    },
  ];

  return (
    <DashboardPage>
      <ReceiveStockModal
        open={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        onUpdated={refresh}
      />

      <PartFormModal
        open={formModalOpen}
        mode={formMode}
        part={editingPart}
        onClose={() => {
          setFormModalOpen(false);
          setEditingPart(null);
        }}
        onUpdated={() => {
          refresh();
        }}
      />

      <PageHeader
        eyebrow="Operations / stock"
        title="Parts inventory"
        description="Know what is on the shelf, what needs reordering, and where every part is stored."
        action={
          <div className="flex gap-2 self-start xl:self-auto">
            <CommonButton
              variant="outline"
              onClick={() => setReceiveModalOpen(true)}
              className="flex items-center gap-2 border-[#d4ddea] px-4 py-2"
            >
              <Package size={14} />
              Receive stock
            </CommonButton>

            <CommonButton
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2"
            >
              <Plus size={14} />
              New part
            </CommonButton>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Part SKUs"
          value={summary.total_skus}
          detail="Active items in catalog"
        />
        <SummaryCard
          label="Needs reorder"
          value={summary.needs_reorder}
          detail="At or below minimum level"
        />
        <SummaryCard
          label="Units on hand"
          value={summary.units_on_hand}
          detail="Across all storage bins"
        />
        <SummaryCard
          label="Stock value"
          value={formatMoney(summary.stock_value)}
          detail="Based on unit cost"
          valueText
        />
      </div>

      {/* Search + filter */}
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exact part or SKU"
            className="h-10 w-full rounded-md border border-[#d8e0eb] bg-white pl-9 pr-3 text-[11px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white"
          />
        </div>

        <div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 w-full rounded-md border border-[#d8e0eb] bg-white px-3 text-[11px] text-[#102c50] outline-none focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <DashboardPanel className="mt-4">
        <div className="flex items-start justify-between border-b border-[#e5edf7] px-5 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-[13px] font-bold text-[#102c50] dark:text-white">
              {parts.length} part{parts.length === 1 ? "" : "s"} in view
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Search by exact part or SKU, then filter the catalog by category.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Stock updated just now
          </div>
        </div>

        {loading ? (
          <p className="px-5 py-10 text-center text-[11px] text-slate-400">
            Loading...
          </p>
        ) : parts.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef4ff] text-[#2870e8]">
              <Package size={16} />
            </div>
            <p className="mt-3 text-[12px] font-semibold text-[#102c50] dark:text-white">
              No parts in inventory
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Add the first part to start tracking stock.
            </p>
            <CommonButton
              onClick={openCreate}
              className="mt-4 flex items-center gap-2 px-4 py-2"
            >
              <Plus size={14} />
              New part
            </CommonButton>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={parts}
            emptyMessage="No parts match this filter."
          />
        )}
      </DashboardPanel>
    </DashboardPage>
  );
}

// ---------- SummaryCard ----------

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
