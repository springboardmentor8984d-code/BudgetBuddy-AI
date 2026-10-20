
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models.expense import Expense
from models.budget import Budget
from models.notification import Notification
from schemas.expense import ExpenseCreate, ExpenseResponse
from auth.dependencies import get_current_user
from models.user import User


router = APIRouter(
    prefix="/expenses",
    tags=["Expenses"]
)


def check_budget_alert(db, user_id, category):
    now = datetime.now()

    print("\n========== BUDGET ALERT DEBUG ==========")
    print("User ID:", user_id)
    print("Expense category:", repr(category))
    print("Current time:", now)

    # Find an active budget for this user and category
    budget = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.category == category,
        Budget.start_date <= now,
        Budget.end_date >= now
    ).order_by(
        Budget.budget_id.desc()
    ).first()

    if not budget:
        print("DEBUG: No active budget found for this user/category.")
        print("========================================\n")
        return

    print("DEBUG: Budget found:", budget.category)
    print("DEBUG: Budget limit:", budget.amount_limit)
    print("DEBUG: Budget dates:", budget.start_date, "to", budget.end_date)

    if budget.amount_limit <= 0:
        print("DEBUG: Budget limit is zero or negative.")
        print("========================================\n")
        return

    # Calculate spending within the budget period
    total_spent = db.query(
        func.coalesce(func.sum(Expense.amount), 0)
    ).filter(
        Expense.user_id == user_id,
        Expense.category == category,
        Expense.expense_date >= budget.start_date,
        Expense.expense_date <= budget.end_date
    ).scalar()

    total_spent = float(total_spent or 0)

    print("DEBUG: Total spent:", total_spent)

    # Only notify when spending is greater than the limit
    if total_spent <= budget.amount_limit:
        print("DEBUG: Spending has not exceeded the budget.")
        print("========================================\n")
        return

    percentage = (total_spent / budget.amount_limit) * 100
    excess = total_spent - budget.amount_limit

    start_label = budget.start_date.strftime("%Y-%m-%d")
    end_label = budget.end_date.strftime("%Y-%m-%d")

    message = (
        f"{category} budget exceeded! "
        f"You've spent ₹{total_spent:.2f} "
        f"of your ₹{budget.amount_limit:.2f} budget "
        f"({percentage:.1f}%). "
        f"You are over budget by ₹{excess:.2f}. "
        f"Budget period {start_label} to {end_label}."
    )

    # Create a new notification every time an expense operation
    # leaves the total spending above the budget limit
    try:
        notification = Notification(
            user_id=user_id,
            message=message,
            notification_type="budget_alert",
            is_read=False
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

        print("DEBUG: Notification created successfully.")
        print("DEBUG: Notification ID:", notification.notification_id)
        print("DEBUG: Notification message:", notification.message)

    except Exception as error:
        db.rollback()
        print("DEBUG: Failed to create notification:", repr(error))
        raise

    print("========================================\n")


@router.post("/", response_model=ExpenseResponse)
def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_expense = Expense(
        user_id=current_user.user_id,
        amount=expense.amount,
        category=expense.category,
        description=expense.description
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    check_budget_alert(
        db,
        current_user.user_id,
        expense.category
    )

    return new_expense


@router.get("/", response_model=list[ExpenseResponse])
def get_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Expense).filter(
        Expense.user_id == current_user.user_id
    ).order_by(
        Expense.expense_date.desc()
    ).all()


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_expense = db.query(Expense).filter(
        Expense.expense_id == expense_id,
        Expense.user_id == current_user.user_id
    ).first()

    if not existing_expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    old_category = existing_expense.category

    existing_expense.amount = expense.amount
    existing_expense.category = expense.category
    existing_expense.description = expense.description

    db.commit()
    db.refresh(existing_expense)

    check_budget_alert(
        db,
        current_user.user_id,
        old_category
    )

    if expense.category != old_category:
        check_budget_alert(
            db,
            current_user.user_id,
            expense.category
        )

    return existing_expense


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_expense = db.query(Expense).filter(
        Expense.expense_id == expense_id,
        Expense.user_id == current_user.user_id
    ).first()

    if not existing_expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    category = existing_expense.category

    db.delete(existing_expense)
    db.commit()

    check_budget_alert(
        db,
        current_user.user_id,
        category
    )

    return {
        "message": "Expense deleted successfully"
    }
