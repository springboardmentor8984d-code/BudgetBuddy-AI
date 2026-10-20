from pydantic import BaseModel, field_validator
from datetime import datetime


VALID_SOURCES = {
    "Pocket Money",
    "Scholarship",
    "Freelance Income"
}


class IncomeCreate(BaseModel):
    amount: float
    source: str
    description: str | None = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value):
        if value <= 0:
            raise ValueError("Income amount must be greater than 0")
        return value

    @field_validator("source")
    @classmethod
    def validate_source(cls, value):
        if value not in VALID_SOURCES:
            raise ValueError("Invalid income source")
        return value


class IncomeResponse(BaseModel):
    income_id: int
    user_id: int
    amount: float
    source: str
    income_date: datetime
    description: str | None = None

    class Config:
        from_attributes = True