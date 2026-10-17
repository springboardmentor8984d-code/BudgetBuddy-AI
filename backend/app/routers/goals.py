from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import SavingsGoal
from ..schemas import GoalCreate, GoalUpdate
from ..security import get_current_user

router=APIRouter()

@router.get("")
def list_goals(current=Depends(get_current_user),db:Session=Depends(get_db)):
    goals=db.query(SavingsGoal).filter(SavingsGoal.user_id==current.id).all()
    return [{"id":g.id,"name":g.name,"target_amount":g.target_amount,
             "current_amount":g.current_amount,"deadline":g.deadline,
             "completed":g.completed,
             "progress":round(min(100,g.current_amount/g.target_amount*100),2)}
            for g in goals]

@router.post("")
def add_goal(data:GoalCreate,current=Depends(get_current_user),db:Session=Depends(get_db)):
    item=SavingsGoal(user_id=current.id,**data.model_dump())
    item.completed=item.current_amount>=item.target_amount
    db.add(item);db.commit();db.refresh(item);return item

@router.put("/{goal_id}")
def update_goal(goal_id:int,data:GoalUpdate,current=Depends(get_current_user),db:Session=Depends(get_db)):
    item=db.query(SavingsGoal).filter(SavingsGoal.id==goal_id,SavingsGoal.user_id==current.id).first()
    if not item: raise HTTPException(404,"Goal not found")
    item.current_amount=data.current_amount
    item.completed=data.completed or item.current_amount>=item.target_amount
    db.commit();db.refresh(item);return item
