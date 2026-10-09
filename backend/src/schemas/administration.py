from datetime import datetime

from pydantic import BaseModel


class GetUsers(BaseModel):
    id: int
    first_name: str | None
    last_name: str | None
    email: str
    role: str
    created_at: datetime | None = None
    is_active: bool
    last_sign_in: datetime

class TotalUsers(BaseModel):
    total_accounts: int
    customer_total: int
    technician_total: int
    staff_total: int
    administrator_total: int
