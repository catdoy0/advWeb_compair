import { TriangleAlert } from "lucide-react";
import Modal from "./Modal";
import CommonButton from "../widgets/CommonButton";

interface AreYouSureModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  header?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" tints the confirm button red for destructive actions. */
  variant?: "default" | "danger";
}

export default function AreYouSureModal({
  open,
  onClose,
  onConfirm,
  header = "",
  title = "Are you sure?",
  description = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
}: AreYouSureModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>

      <div className="flex flex-col justify-between items-start border-b-2 border-black/10 mb-5">
        <div className="flex flex-col mb-5">
          {variant === "danger" && (
            <TriangleAlert size={16} className="text-slate-400" />
          )}
          <p className="text-xs font-bold tracking-widest text-slate-400">
            {variant === "danger" ? "WARNING —" : "PLEASE CONFIRM —"}
          </p>
          <h1 className="text-md font-extrabold">
            {header}
          </h1>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
        {title}
      </h1>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
        {description}
      </p>

      <div className="flex flex-col sm:flex-row justify-end gap-2 border-t-2 border-black/10 pt-4">
        <CommonButton
          onClick={onClose}
          variant="outline"
        >
          {cancelLabel}
        </CommonButton>

        <CommonButton
          onClick={handleConfirm}
          variant="primary"
        >
          {confirmLabel}
        </CommonButton>
      </div>
    </Modal>
  );
}
