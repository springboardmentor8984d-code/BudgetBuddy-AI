from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.sql import func

from database import Base


class Income(Base):
    __tablename__ = "income"

    income_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    amount = Column(Float, nullable=False)
    source = Column(String, nullable=False)
    income_date = Column(DateTime, server_default=func.now())
    description = Column(String, nullable=True)

    __table_args__ = (
        CheckConstraint("amount > 0", name="check_income_amount_positive"),
    )