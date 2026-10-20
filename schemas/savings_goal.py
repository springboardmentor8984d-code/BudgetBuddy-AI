from pydantic import BaseModel, Field
from datetime import datetime


class SavingsGoalCreate(BaseModel):
    goal_name: str
    target_amount: float = Field(gt=0)
    current_amount: float = Field(default=0, ge=0)
    target_date: datetime | None = None


class SavingsGoalUpdate(BaseModel):
    goal_name: str | None = None
    target_amount: float | None = Field(default=None, gt=0)
    current_amount: float | None = Field(default=None, ge=0)
    target_date: datetime | None = None


class SavingsGoalResponse(BaseModel):
    goal_id: int
    user_id: int
    goal_name: str
    target_amount: float
    current_amount: float
    target_date: datetime | None
    progress: float
    status: str

    class Config:
        from_attributes = True