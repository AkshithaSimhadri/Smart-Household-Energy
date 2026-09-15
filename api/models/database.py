from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smart_household_energy.db")

try:
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        with engine.connect() as conn:
            pass
except Exception as e:
    print(f"Warning: Could not connect to database ({e}). Using local SQLite database.")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./smart_household_energy.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
