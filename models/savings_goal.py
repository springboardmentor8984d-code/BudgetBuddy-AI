from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.sql import func

from database import Base


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    goal_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    goal_name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0)
    target_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        CheckConstraint("target_amount > 0", name="check_goal_target_positive"),
        CheckConstraint("current_amount >= 0", name="check_goal_current_nonnegative"),
    )