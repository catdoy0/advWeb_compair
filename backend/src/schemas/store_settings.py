from pydantic import BaseModel


class StoreSettings(BaseModel):
    email: str
    number: str
