import { useEffect, useRef } from "react";
import { API_URL } from "../api/config";

export function useMessageEvents(
  onNewMessage: (conversationId: number) => void,
) {
  const callbackRef = useRef(onNewMessage);

  useEffect(() => {
    callbackRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    let es: EventSource | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;

      es = new EventSource(`${API_URL}/events/`, { withCredentials: true });

      es.addEventListener("new-message", (event) => {
        try {
          const data = JSON.parse((event as MessageEvent).data);
          callbackRef.current(data.conversation_id);
        } catch {
          console.log("malformed new-message event data");
        }
      });

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
}
