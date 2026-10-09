from enum import Enum


class UserRole(str, Enum):
    CUSTOMER = "CUSTOMER"
    TECHNICIAN = "TECHNICIAN"
    STAFF = "STAFF"
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"


class RepairRequestStatus(str, Enum):
    PENDING = "PENDING"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

    RECEIVED = "RECEIVED"
    DIAGNOSING = "DIAGNOSING"
    REPAIRING = "REPAIRING"
    COMPLETED = "COMPLETED"
    RELEASED = "RELEASED"


class AppointmentStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
    NO_SHOW = "NO_SHOW"


class ComputerType(str, Enum):
    LAPTOP = "LAPTOP"
    DESKTOP = "DESKTOP"
    OTHER = "OTHER"


class PaymentMethod(str, Enum):
    CASH = "CASH"


class PaymentStatus(str, Enum):
    UNPAID = "UNPAID"
    PAID = "PAID"
    REFUNDED = "REFUNDED"


class NotificationType(str, Enum):
    NEW_REPAIR_REQUEST = "NEW_REPAIR_REQUEST"
    REPAIR_STATUS_CHANGED = "REPAIR_STATUS_CHANGED"
    APPOINTMENT_CONFIRMED = "APPOINTMENT_CONFIRMED"
