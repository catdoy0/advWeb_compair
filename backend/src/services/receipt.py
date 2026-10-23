import os
import re
import tempfile
import unicodedata
from datetime import datetime, timezone
from decimal import Decimal
from io import BytesIO
from pathlib import Path
from zoneinfo import ZoneInfo

from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

from src.services.store_settings import read_settings

BACKEND_DIRECTORY = Path(__file__).resolve().parents[2]
RECEIPTS_DIRECTORY = BACKEND_DIRECTORY / "assets" / "receipts"
PAPER_WIDTH = 80 * mm
SIDE_MARGIN = 5 * mm
CONTENT_WIDTH = PAPER_WIDTH - SIDE_MARGIN * 2


def _plain_text(value: object | None) -> str:
    """Keep receipt text printable in ReportLab's built-in Helvetica fonts."""
    text = str(value or "—")
    return text.encode("cp1252", "replace").decode("cp1252")


def _wrap_text(value: str, font: str, size: float) -> list[str]:
    lines: list[str] = []
    line = ""
    for word in value.split():
        candidate = f"{line} {word}".strip()
        if stringWidth(candidate, font, size) <= CONTENT_WIDTH:
            line = candidate
            continue

        if line:
            lines.append(line)
            line = ""

        if stringWidth(word, font, size) <= CONTENT_WIDTH:
            line = word
            continue

        part = ""
        for char in word:
            if part and stringWidth(part + char, font, size) > CONTENT_WIDTH:
                lines.append(part)
                part = char
            else:
                part += char
        line = part

    if line:
        lines.append(line)
    return lines or [""]


def _receipt_filename(receipt: dict) -> str:
    name = f"{receipt.get('customer_first') or ''}{receipt.get('customer_last') or ''}"
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    name = re.sub(r"[^A-Za-z0-9]", "", name) or f"Customer{receipt['customer_id']}"
    repair_number = re.sub(r"[^A-Za-z0-9_-]", "", str(receipt["repair_number"]))
    return f"{name}_{repair_number}_receipt.pdf"


def _receipt_pdf(receipt: dict) -> bytes:
    settings = read_settings()
    paid_at = receipt.get("paid_at") or datetime.now(timezone.utc)
    if paid_at.tzinfo is None:
        paid_at = paid_at.replace(tzinfo=timezone.utc)
    paid_at = paid_at.astimezone(ZoneInfo("Asia/Manila"))

    amount = Decimal(str(receipt["amount"]))
    blocks: list[tuple[str | None, str, float, str, float]] = [
        ("COMPAIR", "Helvetica-Bold", 15, "center", 18),
        ("COMPUTER REPAIR SERVICE", "Helvetica", 8, "center", 13),
    ]
    if settings.number:
        blocks.append((f"Tel: {settings.number}", "Helvetica", 8, "center", 12))
    if settings.email:
        blocks.append((settings.email, "Helvetica", 8, "center", 14))

    blocks.extend([
        (None, "", 0, "", 10),
        ("PAYMENT RECEIPT", "Helvetica-Bold", 11, "center", 16),
        (f"Receipt: RCPT-{int(receipt['payment_id']):08d}", "Helvetica", 8, "left", 12),
        (f"Date: {paid_at.strftime('%b %d, %Y %I:%M %p')}", "Helvetica", 8, "left", 14),
        (None, "", 0, "", 10),
        (f"Customer: {receipt['customer_name']}", "Helvetica", 8, "left", 12),
        (f"Email: {receipt['customer_email']}", "Helvetica", 8, "left", 12),
        (f"Repair: {receipt['repair_number']}", "Helvetica-Bold", 8, "left", 12),
        (f"Device: {receipt['computer_name']} ({receipt['computer_type']})", "Helvetica", 8, "left", 12),
    ])
    if receipt.get("serial_number"):
        blocks.append((f"Serial: {receipt['serial_number']}", "Helvetica", 8, "left", 12))

    blocks.extend([
        (None, "", 0, "", 5),
        ("Repair service", "Helvetica-Bold", 8, "left", 12),
        (_plain_text(receipt["requested_service"]), "Helvetica", 8, "left", 12),
        (f"PHP {amount:,.2f}", "Helvetica", 8, "right", 15),
        (None, "", 0, "", 5),
        (f"TOTAL PAID     PHP {amount:,.2f}", "Helvetica-Bold", 10, "right", 16),
        (f"Payment method: {receipt['payment_method']}", "Helvetica", 8, "left", 12),
        (f"Received by: {receipt['cashier_name']}", "Helvetica", 8, "left", 14),
        (None, "", 0, "", 8),
        ("Thank you for choosing Compair!", "Helvetica-Bold", 8, "center", 14),
        ("Keep this receipt for your records.", "Helvetica", 7, "center", 10),
    ])

    prepared: list[tuple[str | None, str, float, str, float, list[str]]] = []
    content_height = 10 * mm
    for text, font, size, align, spacing in blocks:
        lines = [] if text is None else _wrap_text(_plain_text(text), font, size)
        leading = max(size + 2, 10)
        content_height += spacing + leading * len(lines)
        prepared.append((text, font, size, align, spacing, lines))

    page_height = content_height + 10 * mm
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=(PAPER_WIDTH, page_height), pageCompression=1)
    pdf.setTitle(f"Compair receipt {receipt['repair_number']}")
    y = page_height - 5 * mm

    for text, font, size, align, spacing, lines in prepared:
        y -= spacing
        if text is None:
            pdf.setStrokeColor(colors.HexColor("#9ca3af"))
            pdf.setLineWidth(0.4)
            pdf.line(SIDE_MARGIN, y, PAPER_WIDTH - SIDE_MARGIN, y)
            y -= 4
            continue

        pdf.setFont(font, size)
        pdf.setFillColor(colors.black)
        for line in lines:
            if align == "center":
                pdf.drawCentredString(PAPER_WIDTH / 2, y, line)
            elif align == "right":
                pdf.drawRightString(PAPER_WIDTH - SIDE_MARGIN, y, line)
            else:
                pdf.drawString(SIDE_MARGIN, y, line)
            y -= max(size + 2, 10)

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def ensure_receipt_file(receipt: dict) -> tuple[Path, str]:
    """Persist a receipt PDF once and return its path and safe download name."""
    RECEIPTS_DIRECTORY.mkdir(parents=True, exist_ok=True)
    filename = _receipt_filename(receipt)
    path = RECEIPTS_DIRECTORY / filename
    if path.is_file():
        return path, filename

    content = _receipt_pdf(receipt)
    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="wb",
            dir=RECEIPTS_DIRECTORY,
            prefix=".receipt-",
            suffix=".tmp",
            delete=False,
        ) as temporary:
            temp_path = Path(temporary.name)
            temporary.write(content)
        os.replace(temp_path, path)
    finally:
        if temp_path is not None and temp_path.exists():
            temp_path.unlink()

    return path, filename


def receipt_file_storage_path(path: Path) -> str:
    """Return the backend-relative path stored alongside the payment."""
    return path.resolve().relative_to(BACKEND_DIRECTORY.resolve()).as_posix()


def resolve_receipt_file(storage_path: str) -> Path | None:
    """Resolve a stored receipt path, rejecting paths outside the receipts folder."""
    receipts_root = RECEIPTS_DIRECTORY.resolve()
    candidate = (BACKEND_DIRECTORY / storage_path).resolve()
    try:
        candidate.relative_to(receipts_root)
    except ValueError:
        return None
    return candidate if candidate.is_file() and candidate.suffix.lower() == ".pdf" else None
