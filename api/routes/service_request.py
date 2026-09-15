from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.models import ServiceRequest, Alert
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class RequestCreate(BaseModel):
    user_id: int
    provider_id: int
    service_type: str
    description: str
    requested_date: datetime
    address: str

class StatusUpdate(BaseModel):
    status: str

@router.post("/")
def create_request(request: RequestCreate, db: Session = Depends(get_db)):
    db_request = ServiceRequest(**request.dict())
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    # Notify provider
    alert = Alert(
        user_id=db_request.provider.user_id,
        title="New Service Request",
        message=f"You have a new request for {request.service_type}",
        alert_type="info"
    )
    db.add(alert)
    db.commit()
    
    return db_request

@router.get("/user/{user_id}")
def get_user_requests(user_id: int, db: Session = Depends(get_db)):
    return db.query(ServiceRequest).filter(ServiceRequest.user_id == user_id).all()

@router.get("/provider/{provider_id}")
def get_provider_requests(provider_id: int, db: Session = Depends(get_db)):
    return db.query(ServiceRequest).filter(ServiceRequest.provider_id == provider_id).all()

@router.put("/{request_id}/status")
def update_status(request_id: int, data: StatusUpdate, db: Session = Depends(get_db)):
    db_request = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()
    db_request.status = data.status
    db.commit()
    
    # Notify user
    alert = Alert(
        user_id=db_request.user_id,
        title="Service Request Updated",
        message=f"Your request status has been updated to {data.status}",
        alert_type="success"
    )
    db.add(alert)
    db.commit()
    
    return db_request

