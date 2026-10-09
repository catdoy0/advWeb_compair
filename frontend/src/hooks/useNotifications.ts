import { useCallback, useEffect, useState } from "react";

import { useEvents } from "../context/EventContext";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";
import type { Notification } from "../types/notifications";

export function useNotifications() {
  const { subscribe } = useEvents();

  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [list, count] = await Promise.all([
      listNotifications(30),
      getUnreadCount(),
    ]);
    setItems(list);
    setUnread(count);
  }, []);

  // initial load
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [list, count] = await Promise.all([
        listNotifications(30),
        getUnreadCount(),
      ]);
      if (cancelled) return;
      setItems(list);
      setUnread(count);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // SSE — refresh both list and count when a notification arrives
  useEffect(() => {
    return subscribe("new-notification", () => {
      refresh();
    });
  }, [subscribe, refresh]);

  const markRead = async (id: number) => {
    const ok = await markNotificationRead(id);
    if (!ok) return;

    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnread((u) => Math.max(0, u - 1));
  };

  const markAllRead = async () => {
    const ok = await markAllNotificationsRead();
    if (!ok) return;

    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  };

  return { items, unread, loading, markRead, markAllRead, refresh };
}
