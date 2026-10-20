from pydantic import BaseModel


class ProfileCreate(BaseModel):
    user_id: int
    full_name: str
    phone: str | None = None
    currency: str = "INR"


class ProfileResponse(ProfileCreate):
    profile_id: int

    class Config:
        from_attributes = True