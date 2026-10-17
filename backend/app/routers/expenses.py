from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Expense
from ..schemas import ExpenseCreate
from ..security import get_current_user

router=APIRouter()

@router.get("")
def list_expenses(current=Depends(get_current_user),db:Session=Depends(get_db)):
    return db.query(Expense).filter(Expense.user_id==current.id).order_by(Expense.expense_date.desc()).all()

@router.post("")
def add_expense(data:ExpenseCreate,current=Depends(get_current_user),db:Session=Depends(get_db)):
    item=Expense(user_id=current.id,**data.model_dump());db.add(item);db.commit();db.refresh(item);return item

@router.put("/{expense_id}")
def edit_expense(expense_id:int,data:ExpenseCreate,current=Depends(get_current_user),db:Session=Depends(get_db)):
    item=db.query(Expense).filter(Expense.id==expense_id,Expense.user_id==current.id).first()
    if not item: raise HTTPException(404,"Expense not found")
    for k,v in data.model_dump().items(): setattr(item,k,v)
    db.commit();db.refresh(item);return item

@router.delete("/{expense_id}")
def delete_expense(expense_id:int,current=Depends(get_current_user),db:Session=Depends(get_db)):
    item=db.query(Expense).filter(Expense.id==expense_id,Expense.user_id==current.id).first()
    if not item: raise HTTPException(404,"Expense not found")
    db.delete(item);db.commit();return {"message":"Expense deleted"}
