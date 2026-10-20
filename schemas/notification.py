from pydantic import BaseModel


class NotificationCreate(BaseModel):
    user_id: int
    message: str
    notification_type: str | None = None
    is_read: bool = False


class NotificationResponse(NotificationCreate):
    notification_id: int

    class Config:
        from_attributes = True