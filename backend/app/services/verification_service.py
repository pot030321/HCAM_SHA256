import json
import shutil
from datetime import datetime
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import ATTACKER_DIR
from app.database.models import FileRecord, VerificationLog
from app.services.file_service import get_block_hashes, get_file_by_id, read_stored_file
from app.services.hashing_service import calculate_sha256
from app.services.hmac_service import generate_hmac_sha256, verify_hmac_sha256
from app.services.merkle_service import (
    build_merkle_root,
    calculate_block_hashes,
    compare_block_hashes,
    split_into_blocks,
)


def _current_time() -> str:
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


def _analyze_file_bytes(file_bytes: bytes) -> dict:
    file_sha256 = calculate_sha256(file_bytes)
    blocks = split_into_blocks(file_bytes)
    block_hashes = calculate_block_hashes(blocks)
    merkle_root = build_merkle_root(block_hashes)

    return {
        "sha256": file_sha256,
        "block_hashes": block_hashes,
        "merkle_root": merkle_root,
        "file_size": len(file_bytes),
    }


def _save_log(
    db: Session,
    file_id: int | None,
    file_name: str,
    result: str,
    old_sha256: str | None,
    new_sha256: str | None,
    old_merkle_root: str | None,
    new_merkle_root: str | None,
    changed_blocks: list[int],
    note: str,
) -> VerificationLog:
    log = VerificationLog(
        file_id=file_id,
        file_name=file_name,
        result=result,
        old_sha256=old_sha256,
        new_sha256=new_sha256,
        old_merkle_root=old_merkle_root,
        new_merkle_root=new_merkle_root,
        changed_blocks_json=json.dumps(changed_blocks),
        note=note,
        created_at=_current_time(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def verify_uploaded_file(db: Session, file_id: int, upload_file: UploadFile) -> dict:
    file_record = get_file_by_id(db, file_id)
    uploaded_bytes = upload_file.file.read()

    if file_record is None:
        note = "No registered file exists for this file id."
        _save_log(db, file_id, upload_file.filename or "unknown", "UNKNOWN", None, None, None, None, [], note)
        return {
            "result": "UNKNOWN",
            "old_sha256": None,
            "new_sha256": None,
            "old_merkle_root": None,
            "new_merkle_root": None,
            "changed_blocks": [],
            "note": note,
        }

    analysis = _analyze_file_bytes(uploaded_bytes)
    old_block_hashes = get_block_hashes(file_record)
    changed_blocks = compare_block_hashes(old_block_hashes, analysis["block_hashes"])

    if file_record.sha256 == analysis["sha256"] and file_record.merkle_root == analysis["merkle_root"]:
        result = "VALID"
        note = "File content matches the registered SHA-256 and Merkle Root."
    else:
        result = "MODIFIED"
        note = "File content changed. The file name is not trusted; verification uses file bytes."

    _save_log(
        db,
        file_record.id,
        file_record.original_name,
        result,
        file_record.sha256,
        analysis["sha256"],
        file_record.merkle_root,
        analysis["merkle_root"],
        changed_blocks,
        note,
    )

    return {
        "result": result,
        "old_sha256": file_record.sha256,
        "new_sha256": analysis["sha256"],
        "old_merkle_root": file_record.merkle_root,
        "new_merkle_root": analysis["merkle_root"],
        "changed_blocks": changed_blocks,
        "note": note,
    }


def _copy_original_for_attack(file_record: FileRecord, suffix: str) -> Path | None:
    source_path = Path(file_record.stored_path)
    if not source_path.exists():
        return None

    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    target_name = timestamp + "_" + suffix + "_" + file_record.original_name
    target_path = ATTACKER_DIR / target_name
    shutil.copyfile(source_path, target_path)
    return target_path


def simulate_modify_byte(db: Session, file_id: int) -> dict:
    file_record = get_file_by_id(db, file_id)
    if file_record is None:
        return _unknown_attack_result()

    attacker_path = _copy_original_for_attack(file_record, "modify_byte")
    if attacker_path is None:
        return _missing_original_result(file_record)

    with open(attacker_path, "rb") as input_file:
        file_bytes = bytearray(input_file.read())

    if len(file_bytes) == 0:
        file_bytes.append(1)
    else:
        file_bytes[0] = (file_bytes[0] + 1) % 256

    with open(attacker_path, "wb") as output_file:
        output_file.write(file_bytes)

    return _build_attack_result(file_record, bytes(file_bytes), attacker_path, "MODIFIED")


def simulate_append_text(db: Session, file_id: int, text: str) -> dict:
    file_record = get_file_by_id(db, file_id)
    if file_record is None:
        return _unknown_attack_result()

    attacker_path = _copy_original_for_attack(file_record, "append_text")
    if attacker_path is None:
        return _missing_original_result(file_record)

    with open(attacker_path, "ab") as output_file:
        output_file.write(text.encode("utf-8"))

    with open(attacker_path, "rb") as input_file:
        file_bytes = input_file.read()

    return _build_attack_result(file_record, file_bytes, attacker_path, "MODIFIED")


def simulate_fake_hash(db: Session, file_id: int) -> dict:
    file_record = get_file_by_id(db, file_id)
    if file_record is None:
        return _unknown_attack_result()

    original_bytes = read_stored_file(file_record)
    if original_bytes is None:
        return _missing_original_result(file_record)

    attacker_bytes = bytearray(original_bytes)
    if len(attacker_bytes) == 0:
        attacker_bytes.append(1)
    else:
        attacker_bytes[0] = (attacker_bytes[0] + 1) % 256

    analysis = _analyze_file_bytes(bytes(attacker_bytes))
    old_block_hashes = get_block_hashes(file_record)
    changed_blocks = compare_block_hashes(old_block_hashes, analysis["block_hashes"])

    attacker_fake_hmac = file_record.hmac_sha256
    hmac_valid = verify_hmac_sha256(
        analysis["sha256"],
        analysis["merkle_root"],
        analysis["file_size"],
        attacker_fake_hmac,
    )

    result = "FORGED"
    note = "The attacker can recalculate SHA-256, but cannot create a valid HMAC without the server secret key."

    _save_log(
        db,
        file_record.id,
        file_record.original_name,
        result,
        file_record.sha256,
        analysis["sha256"],
        file_record.merkle_root,
        analysis["merkle_root"],
        changed_blocks,
        note,
    )

    return {
        "result": result,
        "original_sha256": file_record.sha256,
        "attacker_sha256": analysis["sha256"],
        "original_merkle_root": file_record.merkle_root,
        "attacker_merkle_root": analysis["merkle_root"],
        "changed_blocks": changed_blocks,
        "content_changed": True,
        "hmac_valid": hmac_valid,
        "note": note,
        "attacker_file_path": None,
    }


def _build_attack_result(file_record: FileRecord, attacker_bytes: bytes, attacker_path: Path, result: str) -> dict:
    analysis = _analyze_file_bytes(attacker_bytes)
    old_block_hashes = get_block_hashes(file_record)
    changed_blocks = compare_block_hashes(old_block_hashes, analysis["block_hashes"])
    expected_hmac = generate_hmac_sha256(analysis["sha256"], analysis["merkle_root"], analysis["file_size"])
    hmac_valid = expected_hmac == file_record.hmac_sha256

    return {
        "result": result,
        "original_sha256": file_record.sha256,
        "attacker_sha256": analysis["sha256"],
        "original_merkle_root": file_record.merkle_root,
        "attacker_merkle_root": analysis["merkle_root"],
        "changed_blocks": changed_blocks,
        "content_changed": file_record.sha256 != analysis["sha256"],
        "hmac_valid": hmac_valid,
        "note": "Modified content is detected by SHA-256 and Merkle block comparison.",
        "attacker_file_path": str(attacker_path),
    }


def _unknown_attack_result() -> dict:
    return {
        "result": "UNKNOWN",
        "original_sha256": None,
        "attacker_sha256": None,
        "original_merkle_root": None,
        "attacker_merkle_root": None,
        "changed_blocks": [],
        "content_changed": False,
        "hmac_valid": False,
        "note": "No registered file exists for this file id.",
        "attacker_file_path": None,
    }


def _missing_original_result(file_record: FileRecord) -> dict:
    return {
        "result": "UNKNOWN",
        "original_sha256": file_record.sha256,
        "attacker_sha256": None,
        "original_merkle_root": file_record.merkle_root,
        "attacker_merkle_root": None,
        "changed_blocks": [],
        "content_changed": False,
        "hmac_valid": False,
        "note": "The original stored file is missing on the server.",
        "attacker_file_path": None,
    }


def list_logs(db: Session) -> list[dict]:
    rows = db.query(VerificationLog).order_by(VerificationLog.id.desc()).all()
    logs = []

    for row in rows:
        try:
            changed_blocks = json.loads(row.changed_blocks_json)
        except json.JSONDecodeError:
            changed_blocks = []

        log_item = {
            "id": row.id,
            "file_id": row.file_id,
            "file_name": row.file_name,
            "result": row.result,
            "old_sha256": row.old_sha256,
            "new_sha256": row.new_sha256,
            "old_merkle_root": row.old_merkle_root,
            "new_merkle_root": row.new_merkle_root,
            "changed_blocks": changed_blocks,
            "note": row.note,
            "created_at": row.created_at,
        }
        logs.append(log_item)

    return logs
