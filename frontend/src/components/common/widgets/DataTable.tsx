import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, RefreshCw } from "lucide-react";

type SortValue = string | number | Date | null | undefined;

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  sortValue?: (row: T) => SortValue;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  onRefresh: () => void;
  refreshing?: boolean;
}

export default function DataTable<T>({
  columns,
  data,
  emptyMessage = "No records found.",
  onRefresh,
  refreshing = false,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const sortedData = useMemo(() => {
    if (!sort) return data;
    const column = columns.find((item) => item.key === sort.key);
    if (!column) return data;

    const getValue = (row: T): SortValue => column.sortValue
      ? column.sortValue(row)
      : (row as Record<string, SortValue>)[column.key];

    return data
      .map((row, index) => ({ row, index, value: getValue(row) }))
      .sort((a, b) => {
        if (a.value == null && b.value == null) return a.index - b.index;
        if (a.value == null) return 1;
        if (b.value == null) return -1;

        let comparison: number;
        if (a.value instanceof Date && b.value instanceof Date) {
          comparison = a.value.getTime() - b.value.getTime();
        } else if (typeof a.value === "number" && typeof b.value === "number") {
          comparison = a.value - b.value;
        } else {
          const left = String(a.value);
          const right = String(b.value);
          const dateLike = /^\d{4}-\d{2}-\d{2}/.test(left) && /^\d{4}-\d{2}-\d{2}/.test(right);
          comparison = dateLike
            ? Date.parse(left) - Date.parse(right)
            : left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
        }

        return comparison === 0
          ? a.index - b.index
          : comparison * (sort.direction === "asc" ? 1 : -1);
      })
      .map(({ row }) => row);
  }, [columns, data, sort]);

  function toggleSort(key: string) {
    setSort((current) => ({
      key,
      direction: current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-end border-b border-[#edf0f5] px-3 py-1 dark:border-slate-700">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh table"
          title="Refresh table"
          className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[#d8e0eb] dark:border-slate-700">
            {columns.map((column) => {
              const sortable = column.sortable ?? column.key !== "actions";
              const direction = sort?.key === column.key ? sort.direction : null;
              const SortIcon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown;
              return (
                <th
                  key={column.key}
                  aria-sort={direction ? (direction === "asc" ? "ascending" : "descending") : undefined}
                  className={`px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 ${column.className ?? ""}`}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      aria-label={`Sort by ${column.label} ${direction === "asc" ? "descending" : "ascending"}`}
                      title={`Sort by ${column.label} ${direction === "asc" ? "descending" : "ascending"}`}
                      className="inline-flex items-center gap-1.5 text-left transition-colors hover:text-[#2870e8] dark:hover:text-[#8ec5ff]"
                    >
                      {column.label}
                      <SortIcon size={12} className={direction ? "text-[#2870e8] dark:text-[#8ec5ff]" : "opacity-50"} />
                    </button>
                  ) : column.label}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {sortedData.length > 0 ? (
            sortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-[#edf0f5] last:border-b-0 dark:border-slate-700"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-5 py-4 text-[12px] text-[#102c50] dark:text-slate-200 ${column.className ?? ""}`}
                  >
                    {column.render
                      ? column.render(row)
                      : String(
                          (row as Record<string, unknown>)[column.key] ?? "",
                        )}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-10 text-center text-[11px] text-slate-400"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
