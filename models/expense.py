from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.sql import func

from database import Base


class Expense(Base):
    __tablename__ = "expenses"

    expense_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    expense_date = Column(DateTime, server_default=func.now())
    description = Column(String, nullable=True)

    __table_args__ = (
        CheckConstraint("amount > 0", name="check_expense_amount_positive"),
    )