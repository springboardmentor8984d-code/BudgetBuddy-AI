from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.sql import func

from database import Base


class Budget(Base):
    __tablename__ = "budgets"

    budget_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    category = Column(String, nullable=False)
    amount_limit = Column(Float, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        CheckConstraint("amount_limit > 0", name="check_budget_amount_positive"),
    )