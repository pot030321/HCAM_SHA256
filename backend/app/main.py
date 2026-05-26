from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.db import init_db
from app.routers import attacker, files, logs, verify


app = FastAPI(title="Digital Document Integrity Verification System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


app.include_router(files.router)
app.include_router(verify.router)
app.include_router(attacker.router)
app.include_router(logs.router)
