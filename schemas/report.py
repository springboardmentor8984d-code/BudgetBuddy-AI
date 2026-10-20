from pydantic import BaseModel


class ReportCreate(BaseModel):
    report_type: str
    report_period: str | None = None


class ReportResponse(BaseModel):
    report_id: int
    user_id: int
    report_type: str
    report_period: str | None
    generated_at: str | None

    total_income: float
    total_expenses: float
    remaining_balance: float
    category_wise_expenses: dict[str, float]

    class Config:
        from_attributes = True