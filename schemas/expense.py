from pydantic import BaseModel, field_validator

VALID_CATEGORIES = {
    "Food",
    "Travel",
    "Shopping",
    "Education",
    "Entertainment",
    "Miscellaneous"
}

class ExpenseCreate(BaseModel):
    amount: float
    category: str
    description: str | None = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value):
        if value <= 0:
            raise ValueError("Expense amount must be greater than 0")
        return value

    @field_validator("category")
    @classmethod
    def validate_category(cls, value):
        if value not in VALID_CATEGORIES:
            raise ValueError("Invalid expense category")
        return value


class ExpenseResponse(BaseModel):
    expense_id: int
    user_id: int
    amount: float
    category: str
    expense_date: object
    description: str | None = None

    class Config:
        from_attributes = True