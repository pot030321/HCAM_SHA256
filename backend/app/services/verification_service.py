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
from app.services.security_log_service import create_security_event


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
        create_security_event(
            db,
            category="verification",
            event_type="VERIFY_UNKNOWN_FILE_ID",
            severity="MEDIUM",
            file_id=file_id,
            file_name=upload_file.filename or "unknown",
            actor="user",
            note=note,
            metadata={"changed_blocks": 0},
        )
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
        create_security_event(
            db,
            category="verification",
            event_type="VERIFY_VALID",
            severity="LOW",
            file_id=file_record.id,
            file_name=file_record.original_name,
            actor="user",
            note=note,
            metadata={"changed_blocks": 0},
        )
    else:
        result = "MODIFIED"
        note = "File content changed. The file name is not trusted; verification uses file bytes."
        create_security_event(
            db,
            category="verification",
            event_type="VERIFY_MODIFIED",
            severity="HIGH",
            file_id=file_record.id,
            file_name=file_record.original_name,
            actor="user",
            note=note,
            metadata={"changed_blocks": changed_blocks},
        )

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


def verify_attacker_copy(db: Session, file_id: int, attacker_file_path: str) -> dict:
    requested_path = Path(attacker_file_path)
    resolved_path = requested_path.resolve()
    attacker_root = ATTACKER_DIR.resolve()

    if not resolved_path.is_file() or attacker_root not in resolved_path.parents:
        note = "Attacker copy is missing or outside the allowed attacker storage directory."
        _save_log(db, file_id, requested_path.name or "attacker_copy", "UNKNOWN", None, None, None, None, [], note)
        create_security_event(
            db,
            category="verification",
            event_type="VERIFY_ATTACKER_COPY_INVALID_PATH",
            severity="HIGH",
            file_id=file_id,
            file_name=requested_path.name or "attacker_copy",
            actor="user",
            note=note,
            metadata={"attacker_file_path": attacker_file_path},
        )
        return {
            "result": "UNKNOWN",
            "old_sha256": None,
            "new_sha256": None,
            "old_merkle_root": None,
            "new_merkle_root": None,
            "changed_blocks": [],
            "note": note,
        }

    with open(resolved_path, "rb") as input_file:
        file_bytes = input_file.read()

    return _verify_file_bytes(db, file_id, resolved_path.name, file_bytes, "attacker_copy")


def _verify_file_bytes(db: Session, file_id: int, submitted_name: str, file_bytes: bytes, actor: str) -> dict:
    file_record = get_file_by_id(db, file_id)

    if file_record is None:
        note = "No registered file exists for this file id."
        _save_log(db, file_id, submitted_name or "unknown", "UNKNOWN", None, None, None, None, [], note)
        create_security_event(
            db,
            category="verification",
            event_type="VERIFY_UNKNOWN_FILE_ID",
            severity="MEDIUM",
            file_id=file_id,
            file_name=submitted_name or "unknown",
            actor=actor,
            note=note,
            metadata={"changed_blocks": 0},
        )
        return {
            "result": "UNKNOWN",
            "old_sha256": None,
            "new_sha256": None,
            "old_merkle_root": None,
            "new_merkle_root": None,
            "changed_blocks": [],
            "note": note,
        }

    analysis = _analyze_file_bytes(file_bytes)
    old_block_hashes = get_block_hashes(file_record)
    changed_blocks = compare_block_hashes(old_block_hashes, analysis["block_hashes"])

    if file_record.sha256 == analysis["sha256"] and file_record.merkle_root == analysis["merkle_root"]:
        result = "VALID"
        note = "File content matches the registered SHA-256 and Merkle Root."
        event_type = "VERIFY_VALID"
        severity = "LOW"
    else:
        result = "MODIFIED"
        note = "File content changed. The file name is not trusted; verification uses file bytes."
        event_type = "VERIFY_MODIFIED"
        severity = "HIGH"

    create_security_event(
        db,
        category="verification",
        event_type=event_type,
        severity=severity,
        file_id=file_record.id,
        file_name=file_record.original_name,
        actor=actor,
        note=note,
        metadata={"changed_blocks": changed_blocks},
    )

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
        result = _unknown_attack_result()
        create_security_event(
            db,
            category="attack",
            event_type="ATTACK_MODIFY_BYTE_UNKNOWN_FILE",
            severity="MEDIUM",
            file_id=file_id,
            file_name=None,
            actor="attacker",
            note=result["note"],
            metadata={"attack": "modify_byte"},
        )
        return result

    attacker_path = _copy_original_for_attack(file_record, "modify_byte")
    if attacker_path is None:
        result = _missing_original_result(file_record)
        create_security_event(
            db,
            category="attack",
            event_type="ATTACK_MODIFY_BYTE_SOURCE_MISSING",
            severity="HIGH",
            file_id=file_record.id,
            file_name=file_record.original_name,
            actor="attacker",
            note=result["note"],
            metadata={"attack": "modify_byte"},
        )
        return result

    with open(attacker_path, "rb") as input_file:
        file_bytes = bytearray(input_file.read())

    if len(file_bytes) == 0:
        file_bytes.append(1)
    else:
        file_bytes[0] = (file_bytes[0] + 1) % 256

    with open(attacker_path, "wb") as output_file:
        output_file.write(file_bytes)

    result = _build_attack_result(file_record, bytes(file_bytes), attacker_path, "MODIFIED")
    _save_log(
        db,
        file_record.id,
        file_record.original_name,
        "MODIFIED",
        file_record.sha256,
        result["attacker_sha256"],
        file_record.merkle_root,
        result["attacker_merkle_root"],
        result["changed_blocks"],
        "Attacker simulation: modified one byte in copied file.",
    )
    create_security_event(
        db,
        category="attack",
        event_type="ATTACK_MODIFY_BYTE",
        severity="HIGH",
        file_id=file_record.id,
        file_name=file_record.original_name,
        actor="attacker",
        note="Attacker modified one byte. Integrity checks detect tampering.",
        metadata={"changed_blocks": result["changed_blocks"], "attacker_file_path": result["attacker_file_path"]},
    )
    return result


def simulate_append_text(db: Session, file_id: int, text: str) -> dict:
    file_record = get_file_by_id(db, file_id)
    if file_record is None:
        result = _unknown_attack_result()
        create_security_event(
            db,
            category="attack",
            event_type="ATTACK_APPEND_TEXT_UNKNOWN_FILE",
            severity="MEDIUM",
            file_id=file_id,
            file_name=None,
            actor="attacker",
            note=result["note"],
            metadata={"attack": "append_text"},
        )
        return result

    attacker_path = _copy_original_for_attack(file_record, "append_text")
    if attacker_path is None:
        result = _missing_original_result(file_record)
        create_security_event(
            db,
            category="attack",
            event_type="ATTACK_APPEND_TEXT_SOURCE_MISSING",
            severity="HIGH",
            file_id=file_record.id,
            file_name=file_record.original_name,
            actor="attacker",
            note=result["note"],
            metadata={"attack": "append_text"},
        )
        return result

    with open(attacker_path, "ab") as output_file:
        output_file.write(text.encode("utf-8"))

    with open(attacker_path, "rb") as input_file:
        file_bytes = input_file.read()

    result = _build_attack_result(file_record, file_bytes, attacker_path, "MODIFIED")
    _save_log(
        db,
        file_record.id,
        file_record.original_name,
        "MODIFIED",
        file_record.sha256,
        result["attacker_sha256"],
        file_record.merkle_root,
        result["attacker_merkle_root"],
        result["changed_blocks"],
        "Attacker simulation: appended text to copied file.",
    )
    create_security_event(
        db,
        category="attack",
        event_type="ATTACK_APPEND_TEXT",
        severity="HIGH",
        file_id=file_record.id,
        file_name=file_record.original_name,
        actor="attacker",
        note="Attacker appended text. Integrity checks detect tampering.",
        metadata={"changed_blocks": result["changed_blocks"], "attacker_file_path": result["attacker_file_path"]},
    )
    return result


def simulate_fake_hash(db: Session, file_id: int) -> dict:
    file_record = get_file_by_id(db, file_id)
    if file_record is None:
        result = _unknown_attack_result()
        create_security_event(
            db,
            category="attack",
            event_type="ATTACK_FAKE_HASH_UNKNOWN_FILE",
            severity="MEDIUM",
            file_id=file_id,
            file_name=None,
            actor="attacker",
            note=result["note"],
            metadata={"attack": "fake_hash"},
        )
        return result

    original_bytes = read_stored_file(file_record)
    if original_bytes is None:
        result = _missing_original_result(file_record)
        create_security_event(
            db,
            category="attack",
            event_type="ATTACK_FAKE_HASH_SOURCE_MISSING",
            severity="HIGH",
            file_id=file_record.id,
            file_name=file_record.original_name,
            actor="attacker",
            note=result["note"],
            metadata={"attack": "fake_hash"},
        )
        return result

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
    create_security_event(
        db,
        category="attack",
        event_type="ATTACK_FAKE_HASH",
        severity="CRITICAL",
        file_id=file_record.id,
        file_name=file_record.original_name,
        actor="attacker",
        note=note,
        metadata={"changed_blocks": changed_blocks, "hmac_valid": hmac_valid},
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
