from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.schemas.file_schema import FileDetail, FileMetadata
from app.services.file_service import get_block_hashes, get_file_by_id, list_files, register_file


router = APIRouter(prefix="/api/files", tags=["files"])


def _metadata_response(file_record) -> dict:
    return {
        "id": file_record.id,
        "original_name": file_record.original_name,
        "file_size": file_record.file_size,
        "sha256": file_record.sha256,
        "merkle_root": file_record.merkle_root,
        "hmac_sha256": file_record.hmac_sha256,
        "created_at": file_record.created_at,
    }


@router.post("/register", response_model=FileMetadata)
def register(uploaded_file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_record = register_file(db, uploaded_file)
    return _metadata_response(file_record)


@router.get("", response_model=list[FileMetadata])
def get_files(db: Session = Depends(get_db)):
    rows = list_files(db)
    response = []
    for row in rows:
        response.append(_metadata_response(row))
    return response


@router.get("/{file_id}", response_model=FileDetail)
def get_file_detail(file_id: int, db: Session = Depends(get_db)):
    file_record = get_file_by_id(db, file_id)
    if file_record is None:
        raise HTTPException(status_code=404, detail="File not found")

    response = _metadata_response(file_record)
    response["block_hashes"] = get_block_hashes(file_record)
    return response
