from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Expense, Income, SavingsGoal
from ..security import get_current_user

router=APIRouter()

@router.get("/summary")
def summary(current=Depends(get_current_user),db:Session=Depends(get_db)):
    income=float(db.query(func.coalesce(func.sum(Income.amount),0)).filter(Income.user_id==current.id).scalar() or 0)
    expense=float(db.query(func.coalesce(func.sum(Expense.amount),0)).filter(Expense.user_id==current.id).scalar() or 0)
    goals=db.query(SavingsGoal).filter(SavingsGoal.user_id==current.id).all()
    remaining=sum(max(0,g.target_amount-g.current_amount) for g in goals)
    return {"total_income":income,"total_expense":expense,"balance":income-expense,
            "remaining_goal_amount":remaining}

@router.get("/categories")
def categories(current=Depends(get_current_user),db:Session=Depends(get_db)):
    rows=db.query(Expense.category,func.sum(Expense.amount)).filter(
        Expense.user_id==current.id).group_by(Expense.category).all()
    return [{"category":r[0],"amount":float(r[1] or 0)} for r in rows]
