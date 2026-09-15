from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.models import User, UserRole, Household, ServiceProvider
from ..auth.auth_handler import create_access_token, verify_password, get_password_hash
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter()

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.HOUSEHOLD
    # For Providers
    business_name: Optional[str] = None
    categories: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role.value
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    if new_user.role == UserRole.HOUSEHOLD.value:
        household = Household(user_id=new_user.id)
        db.add(household)
    elif new_user.role == UserRole.PROVIDER.value:
        provider = ServiceProvider(
            user_id=new_user.id,
            business_name=user_data.business_name,
            categories=user_data.categories
        )
        db.add(provider)
    
    db.commit()
    return {"message": "User registered successfully"}

@router.post("/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }
