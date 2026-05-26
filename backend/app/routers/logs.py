from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.schemas.file_schema import VerificationLogOut
from app.services.verification_service import list_logs


router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("", response_model=list[VerificationLogOut])
def get_logs(db: Session = Depends(get_db)):
    return list_logs(db)
