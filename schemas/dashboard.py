from pydantic import BaseModel
from datetime import datetime


class RecentTransaction(BaseModel):
    type: str
    amount: float
    category_or_source: str
    date: datetime
    description: str | None = None


class MonthlyTrend(BaseModel):
    month: str
    income: float
    expenses: float


class SavingsProgress(BaseModel):
    goal_id: int
    goal_name: str
    target_amount: float
    current_amount: float
    progress: float
    status: str


class DashboardResponse(BaseModel):
    total_income: float
    total_expenses: float
    remaining_balance: float

    category_wise_expenses: dict[str, float]

    monthly_trends: list[MonthlyTrend]

    savings_progress: list[SavingsProgress]

    recent_transactions: list[RecentTransaction]