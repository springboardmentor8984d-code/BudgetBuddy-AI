from sqlalchemy import Column, Integer, String, ForeignKey

from database import Base


class Profile(Base):
    __tablename__ = "profiles"

    profile_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False)

    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    currency = Column(String, default="INR")