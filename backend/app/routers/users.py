from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import ProfileUpdate
from ..security import get_current_user

router=APIRouter()

@router.get("/me")
def me(current=Depends(get_current_user)):
    return {"id":current.id,"username":current.username,"email":current.email,
            "role":current.role,"monthly_income":current.monthly_income,
            "financial_preferences":current.financial_preferences}

@router.put("/me")
def update_profile(data:ProfileUpdate,current=Depends(get_current_user),db:Session=Depends(get_db)):
    current.monthly_income=data.monthly_income
    current.financial_preferences=data.financial_preferences
    db.commit();db.refresh(current)
    return current
