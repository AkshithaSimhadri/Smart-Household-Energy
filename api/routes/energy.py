from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.models import Consumption, Bill
from ..ml.forecasting import generate_forecast
from pydantic import BaseModel
from datetime import datetime, timedelta

router = APIRouter()

class ConsumptionCreate(BaseModel):
    kwh: float
    date: datetime
    source: str = "grid"

@router.post("/consumption/{household_id}")
def add_consumption(household_id: int, consumption: ConsumptionCreate, db: Session = Depends(get_db)):
    db_consumption = Consumption(
        household_id=household_id,
        kwh=consumption.kwh,
        date=consumption.date,
        source=consumption.source
    )
    db.add(db_consumption)
    db.commit()
    return {"message": "Consumption added"}

@router.get("/forecast/{household_id}")
async def get_forecast_api(household_id: int, db: Session = Depends(get_db)):
    history = db.query(Consumption).filter(Consumption.household_id == household_id).all()
    if not history:
        # Return mock data if no history exists for the demo
        mock_history = [{"date": (datetime.now() - iter * timedelta(days=1)).isoformat(), "kwh": 12.5} for iter in range(10)]
        return generate_forecast(mock_history)
    
    data = [{"date": c.date.isoformat(), "kwh": c.kwh} for c in history]
    result = generate_forecast(data)
    return result
