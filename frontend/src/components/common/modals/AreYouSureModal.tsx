import { TriangleAlert } from "lucide-react";
import Modal from "./Modal";
import CommonButton from "../widgets/CommonButton";

interface AreYouSureModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
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

      <div className="flex flex-row justify-between items-start">
        <div className="flex items-center gap-2 mb-2">
          {variant === "danger" && (
            <TriangleAlert size={16} className="text-slate-400" />
          )}
          <p className="text-xs font-bold tracking-widest text-slate-400">
            {variant === "danger" ? "WARNING —" : "CONFIRM —"}
          </p>
        </div>

      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
        {title}
      </h1>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
        {description}
      </p>

      <div className="flex gap-2">
        <CommonButton
          onClick={onClose}
          variant="outline"
          className="flex-1"
        >
          {cancelLabel}
        </CommonButton>

        <CommonButton
          onClick={handleConfirm}
          variant="primary"
          className="flex-1"
        >
          {confirmLabel}
        </CommonButton>
      </div>
    </Modal>
  );
}
