from pydantic import BaseModel


class FileMetadata(BaseModel):
    id: int
    original_name: str
    file_size: int
    sha256: str
    merkle_root: str
    hmac_sha256: str
    created_at: str

    class Config:
        from_attributes = True


class FileDetail(FileMetadata):
    block_hashes: list[str]


class VerificationResult(BaseModel):
    result: str
    old_sha256: str | None
    new_sha256: str | None
    old_merkle_root: str | None
    new_merkle_root: str | None
    changed_blocks: list[int]
    note: str


class AttackResult(BaseModel):
    result: str
    original_sha256: str | None
    attacker_sha256: str | None
    original_merkle_root: str | None = None
    attacker_merkle_root: str | None = None
    changed_blocks: list[int]
    content_changed: bool
    hmac_valid: bool
    note: str
    attacker_file_path: str | None = None


class VerificationLogOut(BaseModel):
    id: int
    file_id: int | None
    file_name: str
    result: str
    old_sha256: str | None
    new_sha256: str | None
    old_merkle_root: str | None
    new_merkle_root: str | None
    changed_blocks: list[int]
    note: str
    created_at: str
