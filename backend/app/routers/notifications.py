from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Notification
from ..security import get_current_user

router=APIRouter()

@router.get("")
def list_notifications(current=Depends(get_current_user),db:Session=Depends(get_db)):
    return db.query(Notification).filter(Notification.user_id==current.id).order_by(Notification.created_at.desc()).all()

@router.patch("/{notification_id}/read")
def mark_read(notification_id:int,current=Depends(get_current_user),db:Session=Depends(get_db)):
    item=db.query(Notification).filter(Notification.id==notification_id,Notification.user_id==current.id).first()
    if item:
        item.is_read=True;db.commit()
    return {"message":"Notification updated"}
