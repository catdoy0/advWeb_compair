import json
from pathlib import Path

from src.schemas.store_settings import StoreSettings

# Resolve relative to the backend package, not the process working directory.
# The server may be started from the repository root or another directory.
FILE_PATH = Path(__file__).resolve().parents[2] / "store_settings.json"

def read_settings() -> StoreSettings:
    """Reads the JSON file and returns a StoreSettings object."""
    if not FILE_PATH.exists():
        return StoreSettings(email="", number="")
        
    with FILE_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)
        return StoreSettings(**data)

def write_settings(email: str, number: str) -> None:
    """Updates the JSON file with new values."""
    data = {
        "email": email,
        "number": number
    }
    with FILE_PATH.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def serialize_store_settings(store_settings: StoreSettings) -> dict:
    return {
        "email": store_settings.email,
        "number": store_settings.number
    }
