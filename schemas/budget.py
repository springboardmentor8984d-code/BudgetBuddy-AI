from pydantic import BaseModel, field_validator, model_validator
from datetime import datetime


VALID_CATEGORIES = {
    "Food",
    "Travel",
    "Shopping",
    "Education",
    "Entertainment",
    "Miscellaneous"
}


class BudgetCreate(BaseModel):
    category: str
    amount_limit: float
    start_date: datetime
    end_date: datetime

    @field_validator("amount_limit")
    @classmethod
    def validate_amount(cls, value):
        if value <= 0:
            raise ValueError("Budget amount must be greater than 0")
        return value

    @field_validator("category")
    @classmethod
    def validate_category(cls, value):
        if value not in VALID_CATEGORIES:
            raise ValueError("Invalid budget category")
        return value

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date <= self.start_date:
            raise ValueError("End date must be after start date")
        return self


class BudgetResponse(BaseModel):
    budget_id: int
    user_id: int
    category: str
    amount_limit: float
    start_date: datetime
    end_date: datetime
    created_at: datetime | None = None

    class Config:
        from_attributes = True