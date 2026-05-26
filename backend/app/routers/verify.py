from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.schemas.file_schema import VerificationResult
from app.services.verification_service import verify_uploaded_file


router = APIRouter(prefix="/api/verify", tags=["verify"])


@router.post("/{file_id}", response_model=VerificationResult)
def verify_file(file_id: int, uploaded_file: UploadFile = File(...), db: Session = Depends(get_db)):
    return verify_uploaded_file(db, file_id, uploaded_file)
