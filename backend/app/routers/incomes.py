from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Income
from ..schemas import IncomeCreate
from ..security import get_current_user

router=APIRouter()

@router.get("")
def list_incomes(current=Depends(get_current_user),db:Session=Depends(get_db)):
    return db.query(Income).filter(Income.user_id==current.id).order_by(Income.income_date.desc()).all()

@router.post("")
def add_income(data:IncomeCreate,current=Depends(get_current_user),db:Session=Depends(get_db)):
    item=Income(user_id=current.id,**data.model_dump());db.add(item);db.commit();db.refresh(item);return item

@router.delete("/{income_id}")
def delete_income(income_id:int,current=Depends(get_current_user),db:Session=Depends(get_db)):
    item=db.query(Income).filter(Income.id==income_id,Income.user_id==current.id).first()
    if not item: raise HTTPException(404,"Income not found")
    db.delete(item);db.commit();return {"message":"Income deleted"}
