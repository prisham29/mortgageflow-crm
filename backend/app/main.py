from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from .database import Base, engine, get_db
from .models import Enquiry
from .schemas import EnquiryCreate, EnquiryRead, Status, StatusUpdate

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="MortgageFlow API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_methods=["GET", "POST", "PATCH"], allow_headers=["Content-Type"])

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/enquiries", response_model=list[EnquiryRead])
def list_enquiries(
    search: str = Query(default="", max_length=120),
    status: Status | None = None,
    db: Session = Depends(get_db)
):
    stmt = select(Enquiry)

    if search.strip():
        search_term = search.strip().lower().replace("%", r"\%").replace("_", r"\_")
        stmt = stmt.where(
            func.lower(Enquiry.customer_name).like(
                f"%{search_term}%", escape="\\"
            )
        )

    if status:
        stmt = stmt.where(Enquiry.status == status.value)

    return db.scalars(
        stmt.order_by(Enquiry.created_at.desc(), Enquiry.id.desc())
        )

@app.post("/api/enquiries", response_model=EnquiryRead, status_code=201)
def create_enquiry(payload: EnquiryCreate, db: Session = Depends(get_db)):
    record = Enquiry(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@app.patch("/api/enquiries/{enquiry_id}/status", response_model=EnquiryRead)
def update_status(enquiry_id: int, payload: StatusUpdate, db: Session = Depends(get_db)):
    record = db.get(Enquiry, enquiry_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    record.status = payload.status.value
    db.commit()
    db.refresh(record)
    return record
