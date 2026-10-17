from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class Status(str, Enum):
    new = "New"
    contacted = "Contacted"
    in_progress = "In Progress"
    approved = "Approved"
    declined = "Declined"

class LoanType(str, Enum):
    home = "Home Loan"
    refinance = "Refinance"
    investment = "Investment"
    vehicle = "Vehicle Finance"

class EnquiryCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    loan_type: LoanType
    amount: int = Field(gt=0, le=100_000_000)
    notes: str = Field(default="", max_length=2000)

class StatusUpdate(BaseModel):
    status: Status

class EnquiryRead(EnquiryCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: Status
    created_at: datetime
