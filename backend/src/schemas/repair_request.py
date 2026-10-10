from datetime import date, time
from decimal import Decimal

from pydantic import BaseModel, Field
from src.models.enums import ComputerType


class CreateRepairRequestRequest(BaseModel):
    # device fields — find-or-create by computer_name under the customer
    computer_name: str = Field(min_length=1, max_length=150)
    computer_type: ComputerType
    serial_number: str | None = None

    # request fields
    contact_detail: str | None = Field(default=None, max_length=255)
    requested_service: str = Field(min_length=1, max_length=255)
    reported_problem: str = Field(min_length=1)

    preferred_date: date
    preferred_time: time


class RepairRequestCreated(BaseModel):
    repair_request_id: int
    repair_number: str
    appointment_id: int
    conversation_id: int

class UpdateEstimateRequest(BaseModel):
    amount: Decimal = Field(ge=0)
