from datetime import datetime

from pydantic import BaseModel, Field


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=4000)



class ConversationSummary(BaseModel):
    """One row in the inbox list."""

    id: int
    customer_id: int
    repair_request_id: int | None

    # team view needs the customer name; customer view ignores it
    customer_name: str | None
    customer_email: str | None

    # repair context if this thread is about a repair
    repair_number: str | None
    device_label: str | None

    preview: str | None          # last message content
    last_message_at: datetime

    unread_count: int


class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int

    # denormalized so the frontend doesn't need a second lookup
    sender_name: str | None
    sender_role: str

    content: str
    created_at: datetime


class ConversationDetail(BaseModel):
    """Everything needed to render one thread."""

    id: int
    customer_id: int
    repair_request_id: int | None
    repair_number: str | None
    device_label: str | None
    created_at: datetime
    last_message_at: datetime
