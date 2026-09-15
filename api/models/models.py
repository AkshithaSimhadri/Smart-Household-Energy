from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class UserRole(str, enum.Enum):
    HOUSEHOLD = "household"
    PROVIDER = "provider"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    phone = Column(String(20))
    address = Column(Text)
    role = Column(String(20), default=UserRole.HOUSEHOLD)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    household = relationship("Household", back_populates="user", uselist=False)
    provider_profile = relationship("ServiceProvider", back_populates="user", uselist=False)
    alerts = relationship("Alert", back_populates="user")
    conversations = relationship("Conversation", back_populates="user")

class Household(Base):
    __tablename__ = "households"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    home_type = Column(String(50))
    size_sqft = Column(Integer)
    occupants = Column(Integer)
    location = Column(String(100))
    monthly_budget = Column(Float)
    solar_available = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="household")
    appliances = relationship("Appliance", back_populates="household")
    consumption = relationship("Consumption", back_populates="household")
    bills = relationship("Bill", back_populates="household")
    audits = relationship("EnergyAudit", back_populates="household")
    solar_analysis = relationship("SolarAnalysis", back_populates="household")


class Appliance(Base):
    __tablename__ = "appliances"
    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"))
    name = Column(String(100))
    category = Column(String(50))
    quantity = Column(Integer, default=1)
    power_rating_watts = Column(Float)
    usage_hours_per_day = Column(Float)
    
    household = relationship("Household", back_populates="appliances")

class Consumption(Base):
    __tablename__ = "consumption"
    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"))
    date = Column(DateTime)
    kwh = Column(Float)
    source = Column(String(20)) # grid, solar
    
    household = relationship("Household", back_populates="consumption")

class Bill(Base):
    __tablename__ = "bills"
    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"))
    billing_period_start = Column(DateTime)
    billing_period_end = Column(DateTime)
    units_consumed = Column(Float)
    amount = Column(Float)
    fixed_charges = Column(Float)
    tariff_rate = Column(Float)
    taxes = Column(Float)
    other_charges = Column(Float)
    file_path = Column(String(255))
    status = Column(String(20)) # paid, pending
    
    household = relationship("Household", back_populates="bills")

class EnergyAudit(Base):
    __tablename__ = "energy_audits"
    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"))
    audit_date = Column(DateTime(timezone=True), server_default=func.now())
    efficiency_score = Column(Integer)
    estimated_monthly_consumption = Column(Float)
    potential_savings = Column(Float)
    audit_data = Column(JSON)
    
    household = relationship("Household", back_populates="audits")

class SolarAnalysis(Base):
    __tablename__ = "solar_analysis"
    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"))
    recommended_capacity_kw = Column(Float)
    expected_monthly_generation = Column(Float)
    estimated_cost = Column(Float)
    payback_years = Column(Float)
    roi_percentage = Column(Float)
    co2_reduction_kg = Column(Float)
    
    household = relationship("Household", back_populates="solar_analysis")


class ServiceProvider(Base):
    __tablename__ = "service_providers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    business_name = Column(String(255))
    categories = Column(String(255)) # Comma separated
    experience_years = Column(Integer)
    location = Column(String(100))
    base_price = Column(Float)
    rating = Column(Float, default=0.0)
    description = Column(Text)
    availability_status = Column(String(20), default="available")
    
    user = relationship("User", back_populates="provider_profile")
    requests = relationship("ServiceRequest", back_populates="provider")

class ServiceRequest(Base):
    __tablename__ = "service_requests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    provider_id = Column(Integer, ForeignKey("service_providers.id"))
    service_type = Column(String(50))
    description = Column(Text)
    status = Column(String(20), default="PENDING") # PENDING, ACCEPTED, SCHEDULED, IN_PROGRESS, COMPLETED, REJECTED
    requested_date = Column(DateTime)
    address = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    provider = relationship("ServiceProvider", back_populates="requests")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(255))
    message = Column(Text)
    alert_type = Column(String(50)) # info, warning, success
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="alerts")

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    sender = Column(String(10)) # user, ai
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    conversation = relationship("Conversation", back_populates="messages")

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"))
    observation = Column(Text)
    action = Column(String(255))
    reason = Column(Text)
    estimated_savings = Column(Float)
    priority = Column(String(20)) # High, Medium, Low
    category = Column(String(50))
    is_implemented = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class KnowledgeDocument(Base):
    __tablename__ = "knowledge_base"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    content = Column(Text)
    category = Column(String(50))
    tags = Column(String(255))
