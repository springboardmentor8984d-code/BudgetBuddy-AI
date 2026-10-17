from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Budget, Expense
from ..schemas import BudgetCreate
from ..security import get_current_user

router=APIRouter()

@router.get("")
def list_budgets(current=Depends(get_current_user),db:Session=Depends(get_db)):
    budgets=db.query(Budget).filter(Budget.user_id==current.id).all()
    result=[]
    for b in budgets:
        spent=db.query(func.coalesce(func.sum(Expense.amount),0)).filter(
            Expense.user_id==current.id,Expense.category==b.category,
            func.strftime("%Y-%m",Expense.expense_date)==b.month).scalar()
        spent=float(spent or 0)
        result.append({"id":b.id,"month":b.month,"category":b.category,
                       "limit_amount":b.limit_amount,"spent":spent,
                       "remaining":max(0,b.limit_amount-spent)})
    return result

@router.post("")
def add_budget(data:BudgetCreate,current=Depends(get_current_user),db:Session=Depends(get_db)):
    item=Budget(user_id=current.id,**data.model_dump());db.add(item);db.commit();db.refresh(item);return item
