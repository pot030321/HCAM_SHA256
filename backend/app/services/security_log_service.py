import json
from datetime import datetime

from sqlalchemy.orm import Session

from app.database.models import SecurityEvent


def _current_time() -> str:
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


def create_security_event(
    db: Session,
    category: str,
    event_type: str,
    severity: str,
    note: str,
    file_id: int | None = None,
    file_name: str | None = None,
    actor: str = "system",
    source: str | None = None,
    metadata: dict | None = None,
) -> SecurityEvent:
    event = SecurityEvent(
        category=category,
        event_type=event_type,
        severity=severity,
        file_id=file_id,
        file_name=file_name,
        actor=actor,
        source=source,
        note=note,
        metadata_json=json.dumps(metadata or {}),
        created_at=_current_time(),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def list_security_events(db: Session) -> list[dict]:
    rows = db.query(SecurityEvent).order_by(SecurityEvent.id.desc()).all()
    events = []

    for row in rows:
        try:
            metadata = json.loads(row.metadata_json)
        except json.JSONDecodeError:
            metadata = {}

        event = {
            "id": row.id,
            "category": row.category,
            "event_type": row.event_type,
            "severity": row.severity,
            "file_id": row.file_id,
            "file_name": row.file_name,
            "actor": row.actor,
            "source": row.source,
            "note": row.note,
            "metadata": metadata,
            "created_at": row.created_at,
        }
        events.append(event)

    return events
