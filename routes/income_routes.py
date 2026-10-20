from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.income import Income
from schemas.income import IncomeCreate, IncomeResponse
from auth.dependencies import get_current_user
from models.user import User

router = APIRouter(
    prefix="/income",
    tags=["Income"]
)


@router.post("/", response_model=IncomeResponse)
def create_income(
    income: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_income = Income(
        user_id=current_user.user_id,
        amount=income.amount,
        source=income.source,
        description=income.description
    )

    db.add(new_income)
    db.commit()
    db.refresh(new_income)

    return new_income


@router.get("/", response_model=list[IncomeResponse])
def get_income(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Income).filter(
        Income.user_id == current_user.user_id
    ).order_by(
        Income.income_date.desc()
    ).all()


@router.put("/{income_id}", response_model=IncomeResponse)
def update_income(
    income_id: int,
    income: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_income = db.query(Income).filter(
        Income.income_id == income_id,
        Income.user_id == current_user.user_id
    ).first()

    if not existing_income:
        raise HTTPException(
            status_code=404,
            detail="Income not found"
        )

    existing_income.amount = income.amount
    existing_income.source = income.source
    existing_income.description = income.description

    db.commit()
    db.refresh(existing_income)

    return existing_income


@router.delete("/{income_id}")
def delete_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_income = db.query(Income).filter(
        Income.income_id == income_id,
        Income.user_id == current_user.user_id
    ).first()

    if not existing_income:
        raise HTTPException(
            status_code=404,
            detail="Income not found"
        )

    db.delete(existing_income)
    db.commit()

    return {
        "message": "Income deleted successfully"
    }