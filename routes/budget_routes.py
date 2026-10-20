from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.budget import Budget
from schemas.budget import BudgetCreate, BudgetResponse
from auth.dependencies import get_current_user
from models.user import User

router = APIRouter(
    prefix="/budgets",
    tags=["Budgets"]
)


@router.post("/", response_model=BudgetResponse)
def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_budget = Budget(
        user_id=current_user.user_id,
        category=budget.category,
        amount_limit=budget.amount_limit,
        start_date=budget.start_date,
        end_date=budget.end_date
    )

    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)

    return new_budget


@router.get("/", response_model=list[BudgetResponse])
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Budget).filter(
        Budget.user_id == current_user.user_id
    ).all()


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_budget = db.query(Budget).filter(
        Budget.budget_id == budget_id,
        Budget.user_id == current_user.user_id
    ).first()

    if not existing_budget:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    existing_budget.category = budget.category
    existing_budget.amount_limit = budget.amount_limit
    existing_budget.start_date = budget.start_date
    existing_budget.end_date = budget.end_date

    db.commit()
    db.refresh(existing_budget)

    return existing_budget


@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_budget = db.query(Budget).filter(
        Budget.budget_id == budget_id,
        Budget.user_id == current_user.user_id
    ).first()

    if not existing_budget:
        raise HTTPException(
            status_code=404,
            detail="Budget not found"
        )

    db.delete(existing_budget)
    db.commit()

    return {"message": "Budget deleted successfully"}