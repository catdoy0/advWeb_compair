from enum import Enum


class UserRole(str, Enum):
    CUSTOMER = "CUSTOMER"
    TECHNICIAN = "TECHNICIAN"
    STAFF = "STAFF"
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"


class RepairRequestStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    IN_REPAIR = "IN_REPAIR"
    COMPLETED = "COMPLETED"
    READY_FOR_PAYMENT = "READY_FOR_PAYMENT"
    PAID = "PAID"
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
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"
