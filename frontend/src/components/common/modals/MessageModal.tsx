import Modal from "./Modal";
import CommonButton from "../widgets/CommonButton";

interface AreYouSureModalProps {
  open: boolean;
  onClose: () => void;
  header?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function MessageModal({
  open,
  onClose,
  header = "",
  title = "Operation Successful",
  description = "",
  cancelLabel = "Okay",
}: AreYouSureModalProps) {
  return (
    <Modal open={open} onClose={onClose}>

      <div className="flex flex-col justify-between items-start border-b-2 border-black/10 mb-5">
        <div className="flex flex-col mb-5">
          <p className="text-xs font-bold tracking-widest text-slate-400">
            DETAILS —
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

      </div>
    </Modal>
  );
}
