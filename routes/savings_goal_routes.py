
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.savings_goal import SavingsGoal
from models.notification import Notification
from schemas.savings_goal import (
    SavingsGoalCreate,
    SavingsGoalUpdate,
    SavingsGoalResponse
)
from auth.dependencies import get_current_user
from models.user import User


router = APIRouter(
    prefix="/savings-goals",
    tags=["Savings Goals"]
)


def goal_response(goal):
    progress = (goal.current_amount / goal.target_amount) * 100

    if progress >= 100:
        status = "Completed"
    else:
        status = "In Progress"

    return {
        "goal_id": goal.goal_id,
        "user_id": goal.user_id,
        "goal_name": goal.goal_name,
        "target_amount": goal.target_amount,
        "current_amount": goal.current_amount,
        "target_date": goal.target_date,
        "progress": round(progress, 2),
        "status": status
    }


def create_milestone_notification(
    db,
    user_id,
    goal,
    old_progress,
    new_progress
):
    if round(old_progress, 2) != round(new_progress, 2):
        notification = Notification(
            user_id=user_id,
            message=(
                f"Your savings goal '{goal.goal_name}' "
                f"is now {round(new_progress, 2)}% complete!"
            ),
            notification_type="savings_milestone",
            is_read=False
        )

        db.add(notification)


@router.post("/", response_model=SavingsGoalResponse)
def create_savings_goal(
    goal: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if goal.current_amount > goal.target_amount:
        raise HTTPException(
            status_code=400,
            detail="Current amount cannot exceed target amount"
        )

    new_goal = SavingsGoal(
        user_id=current_user.user_id,
        goal_name=goal.goal_name,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        target_date=goal.target_date
    )

    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)

    return goal_response(new_goal)


@router.get("/", response_model=list[SavingsGoalResponse])
def get_savings_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goals = (
        db.query(SavingsGoal)
        .filter(SavingsGoal.user_id == current_user.user_id)
        .all()
    )

    return [goal_response(goal) for goal in goals]


@router.put("/{goal_id}", response_model=SavingsGoalResponse)
def update_savings_goal(
    goal_id: int,
    goal: SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_goal = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.goal_id == goal_id,
            SavingsGoal.user_id == current_user.user_id
        )
        .first()
    )

    if not existing_goal:
        raise HTTPException(
            status_code=404,
            detail="Savings goal not found"
        )

    old_progress = (
        existing_goal.current_amount /
        existing_goal.target_amount
    ) * 100

    if goal.goal_name is not None:
        existing_goal.goal_name = goal.goal_name

    if goal.target_amount is not None:
        existing_goal.target_amount = goal.target_amount

    if goal.current_amount is not None:
        existing_goal.current_amount = goal.current_amount

    if goal.target_date is not None:
        existing_goal.target_date = goal.target_date

    if existing_goal.current_amount > existing_goal.target_amount:
        raise HTTPException(
            status_code=400,
            detail="Current amount cannot exceed target amount"
        )

    new_progress = (
        existing_goal.current_amount /
        existing_goal.target_amount
    ) * 100

    create_milestone_notification(
        db,
        current_user.user_id,
        existing_goal,
        old_progress,
        new_progress
    )

    db.commit()
    db.refresh(existing_goal)

    return goal_response(existing_goal)
