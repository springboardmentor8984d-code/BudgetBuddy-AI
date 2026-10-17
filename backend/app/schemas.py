from datetime import date
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(min_length=6)

class LoginRequest(BaseModel):
    username: str
    password: str

class ProfileUpdate(BaseModel):
    monthly_income: float = 0
    financial_preferences: str = ""

class IncomeCreate(BaseModel):
    source: str
    amount: float = Field(gt=0)
    income_date: date = date.today()
    notes: str = ""

class ExpenseCreate(BaseModel):
    title: str
    amount: float = Field(gt=0)
    category: str
    expense_date: date = date.today()
    notes: str = ""

class BudgetCreate(BaseModel):
    month: str
    category: str
    limit_amount: float = Field(gt=0)

class GoalCreate(BaseModel):
    name: str
    target_amount: float = Field(gt=0)
    current_amount: float = 0
    deadline: date | None = None

class GoalUpdate(BaseModel):
    current_amount: float = Field(ge=0)
    completed: bool = False
