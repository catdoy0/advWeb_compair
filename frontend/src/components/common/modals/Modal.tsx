import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  dismissable?: boolean;
  large?: boolean
}

/**
 * Reusable modal screen.
 *
 * @example
 * ```tsx
 * const [showModal, setShowModal] = useState(false);
 *
 * <Modal
 *   open={showModal}
 *   onClose={() => setShowModal(false)}
 * >
 *   <h2>Forgot Password?</h2>
 * </Modal>
 * ```
 */
export default function Modal({
  open,
  onClose,
  children,
  className = "",
  dismissable = true,
  large = false
}: ModalProps) {
  useEffect(() => {
    if (!open || !dismissable) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, dismissable, onClose]);

  if (!open) return null;

  return (
    <div
      className="
      fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4
      "
      onClick={dismissable ? onClose : undefined}
    >
      <div
        className={`
        relative
        w-full ${large ? "max-w-4xl overflow-x-auto" : "max-w-xl"} rounded-3xl bg-white dark:bg-[#0f1724] dark:text-white p-6 shadow-2xl max-h-[calc(100vh-2rem)] overflow-y-auto
        modal-open
        ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {dismissable && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="
              absolute right-4 top-4
              rounded-full p-2
              text-slate-400
              transition-colors
              hover:bg-slate-100
              dark:text-slate-500
              dark:hover:bg-slate-800
            "
          >
            <X size={18} />
          </button>
        )}

        {children}
      </div>
    </div>
  );
}
