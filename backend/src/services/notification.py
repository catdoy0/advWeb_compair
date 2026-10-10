from src.events import broadcaster
from src.models.enums import NotificationType
from src.sql import notification as notif_sql

STATUS_LABEL = {
    "PENDING": "Pending",
    "RECEIVED": "Received",
    "DIAGNOSING": "Diagnosing",
    "REPAIRING": "Repairing",
    "COMPLETED": "Completed",
    "RELEASED": "Released",
    "CANCELLED": "Cancelled",
    "REJECTED": "Rejected",
}


async def notify_team_new_repair_request(
    repair_request_id: int,
    repair_number: str,
    customer_name: str,
    computer_name: str,
) -> None:
    team_ids = notif_sql.get_team_user_ids()
    if not team_ids:
        return

    title = f"New repair request · {repair_number}"
    body = f"{customer_name} — {computer_name}"
    # link = f"/dashboard/repair-queue/{repair_request_id}"
    link = "/dashboard/repair-queue"

    rows = notif_sql.create_notifications(
        user_ids=team_ids,
        type=NotificationType.NEW_REPAIR_REQUEST,
        title=title,
        body=body,
        link=link,
        reference_id=repair_request_id,
    )

    await broadcaster.publish_to_users(
        user_ids=set(team_ids),
        event_type="new-notification",
        data={
            "type": NotificationType.NEW_REPAIR_REQUEST.value,
            "title": title,
            "body": body,
            "link": link,
            "reference_id": repair_request_id,
            "count": len(rows),
        },
    )


async def notify_customer_status_changed(
    customer_id: int,
    repair_request_id: int,
    repair_number: str,
    new_status: str,
) -> None:
    """Notify the customer that their repair moved to a new status."""
    label = STATUS_LABEL.get(new_status, new_status)
    title = f"Repair {repair_number} · {label}"
    body = f"Your repair is now {label.lower()}."
    link = "/dashboard/mydevices"

    notif_sql.create_notifications(
        user_ids=[customer_id],
        type=NotificationType.REPAIR_STATUS_CHANGED,
        title=title,
        body=body,
        link=link,
        reference_id=repair_request_id,
    )

    await broadcaster.publish_to_users(
        user_ids={customer_id},
        event_type="new-notification",
        data={
            "type": NotificationType.REPAIR_STATUS_CHANGED.value,
            "title": title,
            "body": body,
            "link": link,
            "reference_id": repair_request_id,
        },
    )
