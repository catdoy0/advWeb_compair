from pydantic import BaseModel, Field


class AddPartRequest(BaseModel):
    part_id: int
    quantity_used: int = Field(gt=0, default=1)
    work_note: str | None = Field(default=None, max_length=500)
