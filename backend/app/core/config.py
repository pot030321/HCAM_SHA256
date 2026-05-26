from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
ATTACKER_DIR = STORAGE_DIR / "attacker"
DATABASE_URL = "sqlite:///" + str(BASE_DIR / "document_integrity.db")

BLOCK_SIZE = 4096
SERVER_SECRET_KEY = "master-assignment-local-demo-secret-key"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ATTACKER_DIR.mkdir(parents=True, exist_ok=True)
