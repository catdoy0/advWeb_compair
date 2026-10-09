import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router";

import { useNotifications } from "../../../hooks/useNotifications";
import { formatRelative } from "./formatRelative";
import type { Notification } from "../../../types/notifications";

export default function NotificationBell() {
  const { items, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  async function handleClick(n: Notification) {
    if (!n.is_read) {
      await markRead(n.id);
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800"
      >
        <Bell size={17} />

        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#2870e8] px-1 text-[9px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] overflow-hidden rounded-lg border border-[#e5edf7] bg-white shadow-lg dark:border-slate-700 dark:bg-[#0f1724]">
          {/* header */}
          <div className="flex items-center justify-between border-b border-[#e5edf7] px-4 py-3 dark:border-slate-700">
            <p className="text-[12px] font-bold text-[#102c50] dark:text-white">
              Notifications
            </p>

            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[10px] font-semibold text-[#2870e8] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* list */}
          <div className="max-h-[360px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[11px] text-slate-400">
                No notifications yet.
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`flex w-full gap-3 border-b border-[#edf0f5] px-4 py-3 text-left transition-colors last:border-b-0 dark:border-slate-700 ${
                    n.is_read
                      ? "hover:bg-[#f8fafc] dark:hover:bg-[#162334]"
                      : "bg-[#f1f6ff] hover:bg-[#e8f0ff] dark:bg-[#172a42] dark:hover:bg-[#1c3350]"
                  }`}
                >
                  {!n.is_read && (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2870e8]" />
                  )}
                  {n.is_read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-[#102c50] dark:text-white">
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-1 text-[9px] text-slate-400">
                      {formatRelative(n.created_at)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
