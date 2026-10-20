from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import extract

from database import get_db
from models.report import Report
from models.income import Income
from models.expense import Expense
from schemas.report import ReportCreate, ReportResponse
from auth.dependencies import get_current_user
from models.user import User

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.post("/", response_model=ReportResponse)
def create_report(
    report: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Create report for logged-in user
    new_report = Report(
        user_id=current_user.user_id,
        report_type=report.report_type,
        report_period=report.report_period
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Get user's income and expenses
    income_query = db.query(Income).filter(
        Income.user_id == current_user.user_id
    )

    expense_query = db.query(Expense).filter(
        Expense.user_id == current_user.user_id
    )

    # Filter by month if provided
    if report.report_period:
        year, month = report.report_period.split("-")

        income_query = income_query.filter(
            extract("year", Income.income_date) == int(year),
            extract("month", Income.income_date) == int(month)
        )

        expense_query = expense_query.filter(
            extract("year", Expense.expense_date) == int(year),
            extract("month", Expense.expense_date) == int(month)
        )

    incomes = income_query.all()
    expenses = expense_query.all()

    total_income = sum(item.amount for item in incomes)
    total_expenses = sum(item.amount for item in expenses)

    category_wise_expenses = {}

    for expense in expenses:
        category_wise_expenses[expense.category] = (
            category_wise_expenses.get(expense.category, 0)
            + expense.amount
        )

    return {
        "report_id": new_report.report_id,
        "user_id": current_user.user_id,
        "report_type": new_report.report_type,
        "report_period": new_report.report_period,
        "generated_at": (
            new_report.generated_at.isoformat()
            if new_report.generated_at
            else None
        ),
        "total_income": float(total_income),
        "total_expenses": float(total_expenses),
        "remaining_balance": float(
            total_income - total_expenses
        ),
        "category_wise_expenses": {
            category: float(amount)
            for category, amount in category_wise_expenses.items()
        }
    }


@router.get("/", response_model=list[ReportResponse])
def get_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reports = db.query(Report).filter(
        Report.user_id == current_user.user_id
    ).all()

    result = []

    for report in reports:

        # Get only this user's data
        income_query = db.query(Income).filter(
            Income.user_id == current_user.user_id
        )

        expense_query = db.query(Expense).filter(
            Expense.user_id == current_user.user_id
        )

        # Filter according to the report month
        if report.report_period:
            year, month = report.report_period.split("-")

            income_query = income_query.filter(
                extract("year", Income.income_date) == int(year),
                extract("month", Income.income_date) == int(month)
            )

            expense_query = expense_query.filter(
                extract("year", Expense.expense_date) == int(year),
                extract("month", Expense.expense_date) == int(month)
            )

        incomes = income_query.all()
        expenses = expense_query.all()

        total_income = sum(item.amount for item in incomes)
        total_expenses = sum(item.amount for item in expenses)

        category_wise_expenses = {}

        for expense in expenses:
            category_wise_expenses[expense.category] = (
                category_wise_expenses.get(expense.category, 0)
                + expense.amount
            )

        result.append({
            "report_id": report.report_id,
            "user_id": report.user_id,
            "report_type": report.report_type,
            "report_period": report.report_period,
            "generated_at": (
                report.generated_at.isoformat()
                if report.generated_at
                else None
            ),
            "total_income": float(total_income),
            "total_expenses": float(total_expenses),
            "remaining_balance": float(
                total_income - total_expenses
            ),
            "category_wise_expenses": {
                category: float(amount)
                for category, amount in category_wise_expenses.items()
            }
        })

    return result