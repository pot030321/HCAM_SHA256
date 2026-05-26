import json
import os
from datetime import datetime
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import UPLOAD_DIR
from app.database.models import FileRecord
from app.services.hashing_service import calculate_sha256
from app.services.hmac_service import generate_hmac_sha256
from app.services.merkle_service import (
    build_merkle_root,
    calculate_block_hashes,
    split_into_blocks,
)


def _safe_file_name(file_name: str) -> str:
    base_name = os.path.basename(file_name)
    safe_name = base_name.replace("\\", "_").replace("/", "_")
    if safe_name == "":
        safe_name = "uploaded_file"
    return safe_name


def _read_file_bytes(upload_file: UploadFile) -> bytes:
    return upload_file.file.read()


def register_file(db: Session, upload_file: UploadFile) -> FileRecord:
    file_bytes = _read_file_bytes(upload_file)
    original_name = _safe_file_name(upload_file.filename or "uploaded_file")
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    stored_name = timestamp + "_" + original_name
    stored_path = UPLOAD_DIR / stored_name

    with open(stored_path, "wb") as output_file:
        output_file.write(file_bytes)

    file_sha256 = calculate_sha256(file_bytes)
    blocks = split_into_blocks(file_bytes)
    block_hashes = calculate_block_hashes(blocks)
    merkle_root = build_merkle_root(block_hashes)
    file_size = len(file_bytes)
    hmac_sha256 = generate_hmac_sha256(file_sha256, merkle_root, file_size)

    file_record = FileRecord(
        original_name=original_name,
        stored_path=str(stored_path),
        file_size=file_size,
        sha256=file_sha256,
        merkle_root=merkle_root,
        hmac_sha256=hmac_sha256,
        block_hashes_json=json.dumps(block_hashes),
        created_at=datetime.utcnow().isoformat(timespec="seconds") + "Z",
    )

    db.add(file_record)
    db.commit()
    db.refresh(file_record)
    return file_record


def list_files(db: Session) -> list[FileRecord]:
    return db.query(FileRecord).order_by(FileRecord.id.desc()).all()


def get_file_by_id(db: Session, file_id: int) -> FileRecord | None:
    return db.query(FileRecord).filter(FileRecord.id == file_id).first()


def get_block_hashes(file_record: FileRecord) -> list[str]:
    try:
        block_hashes = json.loads(file_record.block_hashes_json)
    except json.JSONDecodeError:
        block_hashes = []
    return block_hashes


def read_stored_file(file_record: FileRecord) -> bytes | None:
    stored_path = Path(file_record.stored_path)
    if not stored_path.exists():
        return None

    with open(stored_path, "rb") as input_file:
        file_bytes = input_file.read()
    return file_bytes
