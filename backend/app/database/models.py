from sqlalchemy import Column, Integer, Text

from app.database.db import Base


class FileRecord(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    original_name = Column(Text, nullable=False)
    stored_path = Column(Text, nullable=False)
    file_size = Column(Integer, nullable=False)
    sha256 = Column(Text, nullable=False)
    merkle_root = Column(Text, nullable=False)
    hmac_sha256 = Column(Text, nullable=False)
    block_hashes_json = Column(Text, nullable=False)
    created_at = Column(Text, nullable=False)


class VerificationLog(Base):
    __tablename__ = "verification_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    file_id = Column(Integer, nullable=True)
    file_name = Column(Text, nullable=False)
    result = Column(Text, nullable=False)
    old_sha256 = Column(Text, nullable=True)
    new_sha256 = Column(Text, nullable=True)
    old_merkle_root = Column(Text, nullable=True)
    new_merkle_root = Column(Text, nullable=True)
    changed_blocks_json = Column(Text, nullable=False)
    note = Column(Text, nullable=False)
    created_at = Column(Text, nullable=False)
