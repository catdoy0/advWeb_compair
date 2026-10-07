import { useEffect } from "react";

interface UseEscapeKeyOptions {
  open: boolean;
  onClose: () => void;
  enabled?: boolean;
}

export function useEscapeKey({ open, onClose, enabled = true }: UseEscapeKeyOptions) {
  useEffect(() => {
    if (!open || !enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, enabled, onClose]);
}


interface UseEnterKeyOptions {
  open: boolean;
  onEnter: () => void;
  enabled?: boolean;
}

export function useEnterKey({ open, onEnter, enabled = true }: UseEnterKeyOptions) {
  useEffect(() => {
    if (!open || !enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter") {
        onEnter();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, enabled, onEnter]);
}
