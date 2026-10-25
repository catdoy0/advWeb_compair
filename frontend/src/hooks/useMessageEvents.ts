import { useEffect } from "react";
import { useEvents } from "../context/EventContext";

export function useMessageEvents(
  onNewMessage: (conversationId: number, senderId: number, messageId: number, deleted: boolean) => void,
) {
  const { subscribe } = useEvents();

  useEffect(() => {
    return subscribe("new-message", (data) => {
      const payload = data as {
        conversation_id: number;
        sender_id: number;
        message_id: number;
        deleted?: boolean;
      };
      onNewMessage(
        payload.conversation_id,
        payload.sender_id,
        payload.message_id,
        payload.deleted === true,
      );
    });
  }, [subscribe, onNewMessage]);
}
