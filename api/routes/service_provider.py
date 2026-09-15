from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.models import ServiceProvider, User
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class ProviderUpdate(BaseModel):
    business_name: str = None
    categories: str = None
    experience_years: int = None
    location: str = None
    base_price: float = None
    description: str = None
    availability_status: str = None

@router.get("/")
def list_providers(category: Optional[str] = None, location: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ServiceProvider)
    if category:
        query = query.filter(ServiceProvider.categories.contains(category))
    if location:
        query = query.filter(ServiceProvider.location == location)
    return query.all()

@router.get("/{user_id}")
def get_provider_profile(user_id: int, db: Session = Depends(get_db)):
    return db.query(ServiceProvider).filter(ServiceProvider.user_id == user_id).first()

@router.put("/{provider_id}")
def update_provider(provider_id: int, data: ProviderUpdate, db: Session = Depends(get_db)):
    db_provider = db.query(ServiceProvider).filter(ServiceProvider.id == provider_id).first()
    for key, value in data.dict(exclude_unset=True).items():
        setattr(db_provider, key, value)
    db.commit()
    return db_provider

