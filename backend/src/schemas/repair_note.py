from pydantic import BaseModel, Field


class CreateNoteRequest(BaseModel):
    note: str = Field(min_length=1, max_length=2000)
