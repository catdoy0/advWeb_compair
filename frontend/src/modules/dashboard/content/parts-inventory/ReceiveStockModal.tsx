import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";

import Modal from "../../../../components/common/modals/Modal";
import CommonButton from "../../../../components/common/widgets/CommonButton";
import MessageModal from "../../../../components/common/modals/MessageModal";
import { useEnterKey } from "../../../../hooks/useModalKeys";
import { listParts, restockPart } from "../../../../api/parts";
import type { Part } from "../../../../types/parts";

const inputClass =
  "h-10 w-full rounded-md border border-[#cfd9e8] bg-white px-3 text-[12px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white";

const labelClass =
  "text-xs font-bold uppercase tracking-wider text-slate-400";

interface ReceiveStockModalProps {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function ReceiveStockModal({
  open,
  onClose,
  onUpdated,
}: ReceiveStockModalProps) {
  const [parts, setParts] = useState<Part[]>([]);
  const [search, setSearch] = useState("");
  const [partId, setPartId] = useState<number | null>(null);
  const [amount, setAmount] = useState(1);
  const [reference, setReference] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageModalMessage, setMessageModalMessage] = useState("");
  const [messageWasSuccess, setMessageWasSuccess] = useState(false);

  // load parts when the modal opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    (async () => {
      const data = await listParts();
      if (cancelled) return;
      setParts(data);
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  // reset form when the modal opens
  useEffect(() => {
    if (!open) return;
    setPartId(null);
    setAmount(1);
    setReference("");
    setSearch("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parts.slice(0, 8);
    return parts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [parts, search]);

  const selectedPart = parts.find((p) => p.id === partId) ?? null;

  function showMessage(message: string, success: boolean) {
    setMessageModalMessage(message);
    setMessageWasSuccess(success);
    setMessageModalOpen(true);
  }

  async function handleSubmit() {
    if (submitting) return;

    if (partId === null) {
      showMessage("Select a part first.", false);
      return;
    }
    if (amount <= 0) {
      showMessage("Quantity must be greater than zero.", false);
      return;
    }

    setSubmitting(true);
    try {
      const result = await restockPart(partId, amount);
      showMessage(result.message, result.ok);
      if (result.ok) {
        onUpdated();
      }
    } finally {
      setSubmitting(false);
    }
  }

  useEnterKey({
    open,
    onEnter: handleSubmit,
    enabled: open && !submitting,
  });

  return (
    <Modal open={open} onClose={onClose}>
      <MessageModal
        open={messageModalOpen}
        onClose={() => {
          setMessageModalOpen(false);
          if (messageWasSuccess) {
            setMessageWasSuccess(false);
            onClose();
          }
        }}
        title={messageModalMessage}
      />

      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2870e8]">
        Stock / receive
      </p>

      <div className="mt-2">
        <h2 className="text-lg font-bold text-[#102c50] dark:text-white">
          Receive parts stock
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Add incoming units to the selected inventory item.
        </p>
      </div>

      <div className="mt-4 space-y-4 border-t border-[#e6ebf2] pt-4 dark:border-slate-700">
        {/* Part picker */}
        <div>
          <label className={labelClass}>Part</label>

          {selectedPart ? (
            <div className="mt-1.5 flex items-center justify-between rounded-md border border-[#cfd9e8] bg-[#f8fafc] px-3 py-2.5 dark:border-slate-600 dark:bg-[#182536]">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-[#102c50] dark:text-white">
                  {selectedPart.name}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {selectedPart.sku} · {selectedPart.quantity} on hand
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPartId(null)}
                className="text-[10px] font-semibold text-[#2870e8] hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or SKU..."
                className={`${inputClass} mt-1.5`}
              />

              {filtered.length > 0 && (
                <div className="mt-1 max-h-[200px] overflow-y-auto rounded-md border border-[#cfd9e8] bg-white dark:border-slate-600 dark:bg-[#182536]">
                  {filtered.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPartId(p.id)}
                      className="block w-full border-b border-[#edf0f5] px-3 py-2 text-left last:border-b-0 hover:bg-[#f8fafc] dark:border-slate-700 dark:hover:bg-[#162334]"
                    >
                      <p className="truncate text-[11px] font-semibold text-[#102c50] dark:text-white">
                        {p.name}
                      </p>
                      <p className="mt-0.5 text-[9px] text-slate-400">
                        {p.sku} · {p.quantity} on hand
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {filtered.length === 0 && search.trim() && (
                <p className="mt-2 text-[10px] text-slate-400">
                  No parts match "{search}".
                </p>
              )}
            </>
          )}
        </div>

        {/* Amount + reference */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Quantity received</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 1)}
              className={`${inputClass} mt-1.5`}
            />
          </div>

          <div>
            <label className={labelClass}>Reference</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="PO number or supplier note"
              className={`${inputClass} mt-1.5`}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2 border-t border-[#e6ebf2] pt-4 dark:border-slate-700">
        <CommonButton
          variant="outline"
          onClick={onClose}
          disabled={submitting}
          className="border-[#d4ddea] px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </CommonButton>

        <CommonButton
          onClick={handleSubmit}
          disabled={submitting || partId === null}
          className="flex items-center gap-2 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Updating..." : "Update inventory"}
          {!submitting && <ArrowRight size={13} />}
        </CommonButton>
      </div>
    </Modal>
  );
}
