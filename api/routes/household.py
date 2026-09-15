from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.models import Household, Appliance
from pydantic import BaseModel
from typing import List

router = APIRouter()

class HouseholdUpdate(BaseModel):
    home_type: str = None
    size_sqft: int = None
    occupants: int = None
    location: str = None
    monthly_budget: float = None
    solar_available: bool = None

class ApplianceCreate(BaseModel):
    name: str
    category: str
    quantity: int = 1
    power_rating_watts: float
    usage_hours_per_day: float

@router.get("/{user_id}")
def get_household(user_id: int, db: Session = Depends(get_db)):
    return db.query(Household).filter(Household.user_id == user_id).first()

@router.put("/{household_id}")
def update_household(household_id: int, data: HouseholdUpdate, db: Session = Depends(get_db)):
    db_household = db.query(Household).filter(Household.id == household_id).first()
    for key, value in data.dict(exclude_unset=True).items():
        setattr(db_household, key, value)
    db.commit()
    return db_household

@router.post("/{household_id}/appliances")
def add_appliance(household_id: int, appliance: ApplianceCreate, db: Session = Depends(get_db)):
    db_appliance = Appliance(household_id=household_id, **appliance.dict())
    db.add(db_appliance)
    db.commit()
    return db_appliance

@router.get("/{household_id}/appliances")
def get_appliances(household_id: int, db: Session = Depends(get_db)):
    return db.query(Appliance).filter(Appliance.household_id == household_id).all()

