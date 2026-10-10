import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

import Modal from "../../../../components/common/modals/Modal";
import CommonButton from "../../../../components/common/widgets/CommonButton";
import MessageModal from "../../../../components/common/modals/MessageModal";
import { useEnterKey } from "../../../../hooks/useModalKeys";
import {
  createPart,
  listCategories,
  updatePart,
} from "../../../../api/parts";
import type { Part } from "../../../../types/parts";

const inputClass =
  "h-10 w-full rounded-md border border-[#cfd9e8] bg-white px-3 text-[12px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white";

const labelClass =
  "text-xs font-bold uppercase tracking-wider text-slate-400";

interface PartFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  part: Part | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function PartFormModal(props: PartFormModalProps) {
  if (!props.open) return null;
  if (props.mode === "edit" && !props.part) return null;
  return <PartFormContent {...props} />;
}

function PartFormContent({
  open,
  mode,
  part,
  onClose,
  onUpdated,
}: PartFormModalProps) {
  const isCreate = mode === "create";

  const [name, setName] = useState(part?.name ?? "");
  const [sku, setSku] = useState(part?.sku ?? "");
  const [category, setCategory] = useState(part?.category ?? "");
  const [quantity, setQuantity] = useState(part?.quantity ?? 0);
  const [reorderThreshold, setReorderThreshold] = useState(
    part?.reorder_threshold ?? 5,
  );
  const [unitPrice, setUnitPrice] = useState(part?.unit_price ?? 0);
  const [supplier, setSupplier] = useState(part?.supplier ?? "");

  const [categories, setCategories] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageModalMessage, setMessageModalMessage] = useState("");
  const [messageWasSuccess, setMessageWasSuccess] = useState(false);

  // load known categories (for the datalist suggestions)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const data = await listCategories();
      if (cancelled) return;
      setCategories(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function showMessage(message: string, success: boolean) {
    setMessageModalMessage(message);
    setMessageWasSuccess(success);
    setMessageModalOpen(true);
  }

  async function handleSubmit() {
    if (submitting) return;

    if (!name.trim()) {
      showMessage("Part name is required.", false);
      return;
    }
    if (isCreate && !sku.trim()) {
      showMessage("SKU is required.", false);
      return;
    }
    if (!category.trim()) {
      showMessage("Category is required.", false);
      return;
    }
    if (unitPrice < 0) {
      showMessage("Unit price cannot be negative.", false);
      return;
    }
    if (reorderThreshold < 0) {
      showMessage("Reorder threshold cannot be negative.", false);
      return;
    }
    if (isCreate && quantity < 0) {
      showMessage("Initial quantity cannot be negative.", false);
      return;
    }

    setSubmitting(true);
    try {
      if (isCreate) {
        const result = await createPart({
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          category: category.trim(),
          quantity,
          reorder_threshold: reorderThreshold,
          unit_price: unitPrice,
          supplier: supplier.trim() || null,
        });

        showMessage(result.message, result.ok);
        if (result.ok) onUpdated();
      } else if (part) {
        const result = await updatePart(part.id, {
          name: name.trim(),
          category: category.trim(),
          reorder_threshold: reorderThreshold,
          unit_price: unitPrice,
          supplier: supplier.trim() || null,
        });

        showMessage(result.message, result.ok);
        if (result.ok) onUpdated();
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
        Stock / {isCreate ? "new" : "edit"}
      </p>

      <div className="mt-2">
        <h2 className="text-lg font-bold text-[#102c50] dark:text-white">
          {isCreate ? "New part" : "Edit part"}
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-400">
          {isCreate
            ? "Add a new item to the inventory catalog."
            : part?.name}
        </p>
      </div>

      {/* Edit: read-only summary */}
      {!isCreate && part && (
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#e6ebf2] pt-4 dark:border-slate-700">
          <div>
            <p className={labelClass}>SKU</p>
            <p className="mt-1.5 font-mono text-[12px] font-semibold text-[#102c50] dark:text-white">
              {part.sku}
            </p>
          </div>
          <div>
            <p className={labelClass}>On hand</p>
            <p className="mt-1.5 text-[12px] font-semibold text-[#102c50] dark:text-white">
              {part.quantity}
              <span className="ml-2 text-[10px] font-normal text-slate-400">
                (adjust via Receive stock)
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <div
        className={`grid grid-cols-2 gap-3 ${
          isCreate
            ? "mt-4 border-t border-[#e6ebf2] pt-4 dark:border-slate-700"
            : "mt-3"
        }`}
      >
        <div className="col-span-2">
          <label className={labelClass}>Part name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. DDR4 8GB 2666MHz"
            className={`${inputClass} mt-1.5`}
          />
        </div>

        {isCreate && (
          <div className="col-span-2">
            <label className={labelClass}>SKU</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. RAM-DDR4-8G"
              className={`${inputClass} mt-1.5 font-mono`}
            />
            <p className="mt-1.5 text-[10px] text-slate-400">
              Used everywhere else — cannot be changed later.
            </p>
          </div>
        )}

        <div className="col-span-2">
          <label className={labelClass}>Category</label>
          <input
            type="text"
            list="parts-categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Memory"
            className={`${inputClass} mt-1.5`}
          />
          <datalist id="parts-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        {isCreate && (
          <div>
            <label className={labelClass}>Initial quantity</label>
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 0)}
              className={`${inputClass} mt-1.5`}
            />
          </div>
        )}

        <div className={isCreate ? "" : "col-span-2"}>
          <label className={labelClass}>Reorder threshold</label>
          <input
            type="number"
            min={0}
            value={reorderThreshold}
            onChange={(e) =>
              setReorderThreshold(Number(e.target.value) || 0)
            }
            className={`${inputClass} mt-1.5`}
          />
          <p className="mt-1.5 text-[10px] text-slate-400">
            Flag as low stock at or below this quantity.
          </p>
        </div>

        <div className={isCreate ? "" : "col-span-2"}>
          <label className={labelClass}>Unit price (₱)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
            className={`${inputClass} mt-1.5`}
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Supplier</label>
          <input
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="Optional"
            className={`${inputClass} mt-1.5`}
          />
        </div>
      </div>

      {/* Actions */}
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
          disabled={submitting}
          className="flex items-center gap-2 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? isCreate
              ? "Creating..."
              : "Saving..."
            : isCreate
              ? "Create part"
              : "Save changes"}
          {!submitting && <ArrowRight size={13} />}
        </CommonButton>
      </div>
    </Modal>
  );
}
