from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.profile import Profile
from schemas.profile import ProfileCreate, ProfileResponse

router = APIRouter(
    prefix="/profiles",
    tags=["Profiles"]
)


@router.post("/", response_model=ProfileResponse)
def create_profile(
    profile: ProfileCreate,
    db: Session = Depends(get_db)
):
    new_profile = Profile(
        user_id=profile.user_id,
        full_name=profile.full_name,
        phone=profile.phone,
        currency=profile.currency
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile


@router.get("/", response_model=list[ProfileResponse])
def get_profiles(
    db: Session = Depends(get_db)
):
    return db.query(Profile).all()