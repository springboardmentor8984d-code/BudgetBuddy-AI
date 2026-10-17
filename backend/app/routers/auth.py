from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, LoginRequest
from ..security import hash_password, verify_password, create_access_token

router=APIRouter()

@router.post("/register")
def register(data: UserCreate, db: Session=Depends(get_db)):
    if db.query(User).filter((User.username==data.username)|(User.email==data.email)).first():
        raise HTTPException(400, "Username or email already exists")
    user=User(username=data.username,email=data.email,password_hash=hash_password(data.password))
    db.add(user); db.commit(); db.refresh(user)
    return {"message":"Registration successful","user_id":user.id}

@router.post("/login")
def login(data: LoginRequest, db: Session=Depends(get_db)):
    user=db.query(User).filter(User.username==data.username).first()
    if not user or not verify_password(data.password,user.password_hash):
        raise HTTPException(401,"Incorrect username or password")
    return {"access_token":create_access_token(user.id),"token_type":"bearer"}
