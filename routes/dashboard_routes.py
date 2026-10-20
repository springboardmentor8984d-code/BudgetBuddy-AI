from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from database import get_db

from models.income import Income
from models.expense import Expense
from models.savings_goal import SavingsGoal

from auth.dependencies import get_current_user
from models.user import User

from schemas.dashboard import (
    DashboardResponse,
    RecentTransaction,
    MonthlyTrend,
    SavingsProgress
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # -----------------------------
    # TOTAL INCOME
    # -----------------------------

    total_income = db.query(
        func.sum(Income.amount)
    ).filter(
        Income.user_id == current_user.user_id
    ).scalar() or 0


    # -----------------------------
    # TOTAL EXPENSES
    # -----------------------------

    total_expenses = db.query(
        func.sum(Expense.amount)
    ).filter(
        Expense.user_id == current_user.user_id
    ).scalar() or 0


    # -----------------------------
    # REMAINING BALANCE
    # -----------------------------

    remaining_balance = total_income - total_expenses


    # -----------------------------
    # CATEGORY-WISE EXPENSES
    # -----------------------------

    category_data = db.query(
        Expense.category,
        func.sum(Expense.amount)
    ).filter(
        Expense.user_id == current_user.user_id
    ).group_by(
        Expense.category
    ).all()


    category_wise_expenses = {
        category: float(total)
        for category, total in category_data
    }


    # -----------------------------
    # MONTHLY TRENDS
    # -----------------------------

    income_data = db.query(
        extract("year", Income.income_date).label("year"),
        extract("month", Income.income_date).label("month"),
        func.sum(Income.amount).label("total")
    ).filter(
        Income.user_id == current_user.user_id
    ).group_by(
        extract("year", Income.income_date),
        extract("month", Income.income_date)
    ).all()


    expense_data = db.query(
        extract("year", Expense.expense_date).label("year"),
        extract("month", Expense.expense_date).label("month"),
        func.sum(Expense.amount).label("total")
    ).filter(
        Expense.user_id == current_user.user_id
    ).group_by(
        extract("year", Expense.expense_date),
        extract("month", Expense.expense_date)
    ).all()


    monthly_map = {}


    for year, month, total in income_data:
        key = f"{int(year)}-{int(month):02d}"

        monthly_map.setdefault(
            key,
            {
                "month": key,
                "income": 0,
                "expenses": 0
            }
        )

        monthly_map[key]["income"] = float(total)


    for year, month, total in expense_data:
        key = f"{int(year)}-{int(month):02d}"

        monthly_map.setdefault(
            key,
            {
                "month": key,
                "income": 0,
                "expenses": 0
            }
        )

        monthly_map[key]["expenses"] = float(total)


    monthly_trends = [
        MonthlyTrend(**data)
        for key, data in sorted(monthly_map.items())
    ]


    # -----------------------------
    # SAVINGS PROGRESS
    # -----------------------------

    goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == current_user.user_id
    ).all()


    savings_progress = []


    for goal in goals:

        progress = (
            goal.current_amount /
            goal.target_amount
        ) * 100

        status = (
            "Completed"
            if progress >= 100
            else "In Progress"
        )

        savings_progress.append(
            SavingsProgress(
                goal_id=goal.goal_id,
                goal_name=goal.goal_name,
                target_amount=float(goal.target_amount),
                current_amount=float(goal.current_amount),
                progress=round(progress, 2),
                status=status
            )
        )


    # -----------------------------
    # RECENT TRANSACTIONS
    # -----------------------------

    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.user_id
    ).all()


    incomes = db.query(Income).filter(
        Income.user_id == current_user.user_id
    ).all()


    transactions = []


    for expense in expenses:

        transactions.append(
            RecentTransaction(
                type="expense",
                amount=expense.amount,
                category_or_source=expense.category,
                date=expense.expense_date,
                description=expense.description
            )
        )


    for income in incomes:

        transactions.append(
            RecentTransaction(
                type="income",
                amount=income.amount,
                category_or_source=income.source,
                date=income.income_date,
                description=income.description
            )
        )


    transactions.sort(
        key=lambda transaction: transaction.date,
        reverse=True
    )


    transactions = transactions[:10]


    # -----------------------------
    # FINAL RESPONSE
    # -----------------------------

    return DashboardResponse(
        total_income=float(total_income),
        total_expenses=float(total_expenses),
        remaining_balance=float(remaining_balance),
        category_wise_expenses=category_wise_expenses,
        monthly_trends=monthly_trends,
        savings_progress=savings_progress,
        recent_transactions=transactions
    )