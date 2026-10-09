import { createContext, useContext, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { API_URL } from "../api/config";

type EventHandler = (data: unknown) => void;

interface EventContextType {
  subscribe: (eventType: string, handler: EventHandler) => () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const listenersRef = useRef<Map<string, Set<EventHandler>>>(new Map());

  useEffect(() => {
    let es: EventSource | null = null;
    let closed = false;

    const dispatch = (eventType: string) => (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const listeners = listenersRef.current.get(eventType);
        if (!listeners) return;
        for (const handler of listeners) handler(data);
      } catch {
        // malformed payload, ignore
      }
    };

    const connect = () => {
      if (closed) return;

      es = new EventSource(`${API_URL}/events`, { withCredentials: true });

      es.addEventListener("new-message", dispatch("new-message"));
      es.addEventListener("new-notification", dispatch("new-notification"));

      es.addEventListener("error", async () => {
        if (closed) return;
        es?.close();
        es = null;

        try {
          await fetch(`${API_URL}/auth/session`, {
            method: "POST",
            credentials: "include",
          });
        } catch {
          // network down, retry below
        }

        setTimeout(connect, 2000);
      });
    };

    connect();

    return () => {
      closed = true;
      es?.close();
    };
  }, []);

  const subscribe = (eventType: string, handler: EventHandler) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType)!.add(handler);

    return () => {
      listenersRef.current.get(eventType)?.delete(handler);
    };
  };

  return (
    <EventContext.Provider value={{ subscribe }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvents must be used inside EventProvider");
  return ctx;
}
