from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.models import User
from pydantic import BaseModel

router = APIRouter()

class UserUpdate(BaseModel):
    full_name: str = None
    phone: str = None
    address: str = None

@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}")
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for key, value in data.dict(exclude_unset=True).items():
        setattr(user, key, value)
    
    db.commit()
    return user

