import { useState } from "react";
import { ArrowRight } from "lucide-react";

import Modal from "../../../../components/common/modals/Modal";
import CommonButton from "../../../../components/common/widgets/CommonButton";
import MessageModal from "../../../../components/common/modals/MessageModal";
import { useEnterKey } from "../../../../hooks/useModalKeys";
import { addRepairNote } from "../../../../api/repair_requests";

const textareaClass =
  "w-full rounded-md border border-[#cfd9e8] bg-white px-3 py-2 text-[12px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white resize-none";

const labelClass =
  "text-xs font-bold uppercase tracking-wider text-slate-400";

interface AddNoteModalProps {
  open: boolean;
  onClose: () => void;
  repairRequestId: number;
  onUpdated: () => void;
}

export default function AddNoteModal({
  open,
  onClose,
  repairRequestId,
  onUpdated,
}: AddNoteModalProps) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageModalMessage, setMessageModalMessage] = useState("");
  const [messageWasSuccess, setMessageWasSuccess] = useState(false);

  function showMessage(message: string, success: boolean) {
    setMessageModalMessage(message);
    setMessageWasSuccess(success);
    setMessageModalOpen(true);
  }

  async function handleSubmit() {
    if (submitting) return;
    const trimmed = note.trim();
    if (!trimmed) {
      showMessage("Note cannot be empty.", false);
      return;
    }

    setSubmitting(true);
    try {
      const result = await addRepairNote(repairRequestId, trimmed);
      if (!result.ok) {
        showMessage(result.message, false);
        return;
      }

      setNote("");
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
        onClose={() => setMessageModalOpen(false)}
        title={messageModalMessage}
      />

      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2870e8]">
        Repair notes
      </p>

      <div className="mt-2">
        <h2 className="text-lg font-bold text-[#102c50] dark:text-white">
          Add repair note
        </h2>
      </div>

      <div className="mt-3 border-t border-[#e6ebf2] pt-3 dark:border-slate-700">
        <label className={labelClass}>Note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Record an inspection result, customer update, or handoff note..."
          rows={4}
          className={`${textareaClass} mt-1.5`}
        />
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
          disabled={submitting || !note.trim()}
          className="flex items-center gap-2 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save note"}
          {!submitting && <ArrowRight size={13} />}
        </CommonButton>
      </div>
    </Modal>
  );
}
