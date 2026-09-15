from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
import os
from dotenv import load_dotenv

# Path adjustments for unified structure
from api.models.database import engine, Base, get_db
from api.routes import auth, user, service_provider, household, energy, ai_assistant, service_request

load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Household Energy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(user.router, prefix="/api/users", tags=["Users"])
app.include_router(household.router, prefix="/api/household", tags=["Household"])
app.include_router(energy.router, prefix="/api/energy", tags=["Energy"])
app.include_router(ai_assistant.router, prefix="/api/ai", tags=["AI Assistant"])
app.include_router(service_provider.router, prefix="/api/providers", tags=["Service Providers"])
app.include_router(service_request.router, prefix="/api/service-requests", tags=["Service Requests"])

@app.get("/")
async def root():
    return {"message": "Welcome to Smart Household Energy API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
