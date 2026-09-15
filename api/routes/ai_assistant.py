from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.models import User, Household, Appliance, Consumption, Bill, Message, Conversation
from pydantic import BaseModel
from typing import List, Optional
import os
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage

router = APIRouter()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
model = "mistral-tiny" # or "mistral-medium"

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    user_id: int

@router.post("/chat")
async def chat_with_ai(request: ChatRequest, db: Session = Depends(get_db)):
    # Get user context
    user = db.query(User).filter(User.id == request.user_id).first() if request.user_id else None
    household = db.query(Household).filter(Household.user_id == user.id).first() if user else None
    appliances = db.query(Appliance).filter(Appliance.household_id == household.id).all() if household else []
    consumption = db.query(Consumption).filter(Consumption.household_id == household.id).limit(10).all() if household else []
    
    # Prepare context
    user_name = user.full_name if user else "Household User"
    home_type = household.home_type if household else "Standard Residence"
    appliance_list = ", ".join([f"{a.name} ({a.power_rating_watts}W)" for a in appliances]) if appliances else "Standard appliances (Refrigerator, AC, Lighting)"
    consumption_data = ", ".join([f"{c.date.date()}: {c.kwh}kWh" for c in consumption]) if consumption else "Standard monthly average (250-350 kWh)"
    
    system_prompt = f"""You are a Smart Household Energy Assistant for an Indian household.
User Context:
- Name: {user_name}
- Home Type: {home_type}
- Appliances: {appliance_list}
- Recent Consumption: {consumption_data}

Use this data to provide personalized, accurate, and helpful energy-saving advice, explain bills, and answer questions.
Always use ₹ (INR) for currency and kWh for energy units.
Be professional, intelligent, and encouraging.
"""

    # Get conversation history
    messages = []
    if request.conversation_id:
        prev_messages = db.query(Message).filter(Message.conversation_id == request.conversation_id).all()
        for msg in prev_messages:
            messages.append(ChatMessage(role=msg.sender, content=msg.content))
    
    messages.append(ChatMessage(role="user", content=request.message))
    
    ai_message_content = ""
    if MISTRAL_API_KEY and MISTRAL_API_KEY != "your_mistral_api_key_here":
        try:
            client = MistralClient(api_key=MISTRAL_API_KEY)
            chat_response = client.chat(
                model=model,
                messages=[ChatMessage(role="system", content=system_prompt)] + messages
            )
            ai_message_content = chat_response.choices[0].message.content
        except Exception:
            ai_message_content = "AI Assistant is currently unavailable. Please contact the administrator."
    else:
        ai_message_content = "AI Assistant is currently unavailable. Please contact the administrator."
    
    # Save to DB
    if not request.conversation_id:
        new_conv = Conversation(user_id=request.user_id, title=request.message[:50])
        db.add(new_conv)
        db.commit()
        db.refresh(new_conv)
        request.conversation_id = new_conv.id
    
    # Save user message
    db.add(Message(conversation_id=request.conversation_id, sender="user", content=request.message))
    # Save AI message
    db.add(Message(conversation_id=request.conversation_id, sender="assistant", content=ai_message_content))
    db.commit()
    
    return {
        "response": ai_message_content,
        "conversation_id": request.conversation_id
    }
