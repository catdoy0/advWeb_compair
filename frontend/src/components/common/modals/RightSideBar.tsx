import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

interface RightSidebarProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  dismissable?: boolean;
}

export default function RightSidebar({
  open,
  onClose,
  children,
  footer,
  dismissable = true,
}: RightSidebarProps) {
  useEffect(() => {
    if (!open || !dismissable) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, dismissable, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={dismissable ? onClose : undefined}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* panel */}
      <div
        className="animate-slide-in-right relative z-10 flex h-full w-full max-w-[560px] flex-col overflow-hidden bg-white shadow-2xl dark:bg-[#0f1724]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X size={18} />
        </button>

        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-6">
          {children}
        </div>

        {footer && (
          <div className="border-t border-[#e5edf7] bg-white px-6 py-4 dark:border-slate-700 dark:bg-[#0f1724]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
