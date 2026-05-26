from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.schemas.file_schema import AttackResult
from app.services.verification_service import simulate_append_text, simulate_fake_hash, simulate_modify_byte


router = APIRouter(prefix="/api/attacker", tags=["attacker"])


@router.post("/modify-byte/{file_id}", response_model=AttackResult)
def modify_byte(file_id: int, db: Session = Depends(get_db)):
    return simulate_modify_byte(db, file_id)


@router.post("/append-text/{file_id}", response_model=AttackResult)
def append_text(file_id: int, text: str = Form(...), db: Session = Depends(get_db)):
    return simulate_append_text(db, file_id, text)


@router.post("/fake-hash/{file_id}", response_model=AttackResult)
def fake_hash(file_id: int, db: Session = Depends(get_db)):
    return simulate_fake_hash(db, file_id)
