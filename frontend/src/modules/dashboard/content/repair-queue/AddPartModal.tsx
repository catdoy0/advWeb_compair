import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";

import Modal from "../../../../components/common/modals/Modal";
import CommonButton from "../../../../components/common/widgets/CommonButton";
import MessageModal from "../../../../components/common/modals/MessageModal";
import { useEnterKey } from "../../../../hooks/useModalKeys";
import { listParts } from "../../../../api/parts";
import { addRepairPart } from "../../../../api/repair_requests";
import type { Part } from "../../../../types/parts";

const inputClass =
  "h-10 w-full rounded-md border border-[#cfd9e8] bg-white px-3 text-[12px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white";

const textareaClass =
  "w-full rounded-md border border-[#cfd9e8] bg-white px-3 py-2 text-[12px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white resize-none";

const labelClass =
  "text-xs font-bold uppercase tracking-wider text-slate-400";

interface AddPartModalProps {
  open: boolean;
  onClose: () => void;
  repairRequestId: number;
  onUpdated: () => void;
}

export default function AddPartModal({
  open,
  onClose,
  repairRequestId,
  onUpdated,
}: AddPartModalProps) {
  const [parts, setParts] = useState<Part[]>([]);
  const [search, setSearch] = useState("");
  const [partId, setPartId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [workNote, setWorkNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageModalMessage, setMessageModalMessage] = useState("");
  const [messageWasSuccess, setMessageWasSuccess] = useState(false);

  // reset + load parts when opened
  useEffect(() => {
    if (!open) return;

    setPartId(null);
    setQuantity(1);
    setWorkNote("");
    setSearch("");

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
    if (quantity <= 0) {
      showMessage("Quantity must be greater than zero.", false);
      return;
    }
    if (selectedPart && quantity > selectedPart.quantity) {
      showMessage(
        `Only ${selectedPart.quantity} in stock for ${selectedPart.name}.`,
        false,
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await addRepairPart(repairRequestId, {
        part_id: partId,
        quantity_used: quantity,
        work_note: workNote.trim() || null,
      });

      if (!result.ok) {
        showMessage(result.message, false);
        return;
      }

      showMessage("Part added.", true);
      onUpdated();
      onClose();
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
        Repair parts
      </p>

      <div className="mt-2">
        <h2 className="text-lg font-bold text-[#102c50] dark:text-white">
          Add part to repair
        </h2>
      </div>

      <div className="mt-3 space-y-4 border-t border-[#e6ebf2] pt-3 dark:border-slate-700">
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
                  {selectedPart.sku} · {selectedPart.quantity} in stock
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
                        {p.sku} · {p.quantity} in stock
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

        <div>
          <label className={labelClass}>Quantity used</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
            className={`${inputClass} mt-1.5`}
          />
        </div>

        <div>
          <label className={labelClass}>Work note (optional)</label>
          <textarea
            value={workNote}
            onChange={(e) => setWorkNote(e.target.value)}
            placeholder="e.g. Replaced thermal paste while installing"
            rows={2}
            className={`${textareaClass} mt-1.5`}
          />
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
          {submitting ? "Adding..." : "Add part"}
          {!submitting && <ArrowRight size={13} />}
        </CommonButton>
      </div>
    </Modal>
  );
}
