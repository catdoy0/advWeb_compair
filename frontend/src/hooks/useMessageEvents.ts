import { useEffect } from "react";
import { useEvents } from "../context/EventContext";

export function useMessageEvents(
  onNewMessage: (conversationId: number) => void,
) {
  const { subscribe } = useEvents();

  useEffect(() => {
    return subscribe("new-message", (data) => {
      onNewMessage(data.conversation_id);
    });
  }, [subscribe, onNewMessage]);
}
