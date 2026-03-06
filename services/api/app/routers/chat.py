from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_, and_, func
from pydantic import BaseModel
from app.models.database import get_db, Conversation, Message, User
from app.services.auth_service import get_current_user

router = APIRouter()

class SendMessageRequest(BaseModel):
    content: str
    type: str = "text"

class StartConversationRequest(BaseModel):
    recipientId: str

@router.get("/conversations")
async def list_conversations(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation).where(
            or_(Conversation.user1_id == user.id, Conversation.user2_id == user.id)
        ).order_by(desc(Conversation.updated_at))
    )
    convos = result.scalars().all()
    output = []
    for c in convos:
        other_id = c.user2_id if c.user1_id == user.id else c.user1_id
        other_result = await db.execute(select(User).where(User.id == other_id))
        other = other_result.scalar_one_or_none()

        # Get last message
        last_msg_result = await db.execute(
            select(Message).where(Message.conversation_id == c.id).order_by(desc(Message.created_at)).limit(1)
        )
        last_msg = last_msg_result.scalar_one_or_none()

        # Count unread
        unread_result = await db.execute(
            select(func.count(Message.id)).where(
                Message.conversation_id == c.id, Message.sender_id != user.id, Message.read == False
            )
        )
        unread = unread_result.scalar() or 0

        output.append({
            "id": c.id,
            "participant": {
                "id": other.id, "name": other.name, "avatar": other.avatar, "role": other.role,
            } if other else None,
            "lastMessage": {
                "content": last_msg.content, "createdAt": last_msg.created_at.isoformat(),
            } if last_msg else None,
            "unreadCount": unread,
            "updatedAt": c.updated_at.isoformat(),
        })
    return output

@router.post("/conversations")
async def start_conversation(req: StartConversationRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Check if conversation already exists
    existing = await db.execute(
        select(Conversation).where(
            or_(
                and_(Conversation.user1_id == user.id, Conversation.user2_id == req.recipientId),
                and_(Conversation.user1_id == req.recipientId, Conversation.user2_id == user.id),
            )
        )
    )
    conv = existing.scalar_one_or_none()
    if conv:
        return {"id": conv.id, "existing": True}

    conv = Conversation(user1_id=user.id, user2_id=req.recipientId)
    db.add(conv)
    await db.flush()
    await db.refresh(conv)
    return {"id": conv.id, "existing": False}

@router.get("/conversations/{conv_id}/messages")
async def get_messages(conv_id: str, page: int = 1, limit: int = 50, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Message).where(Message.conversation_id == conv_id)
        .order_by(desc(Message.created_at))
        .offset((page - 1) * limit).limit(limit)
    )
    messages = result.scalars().all()

    # Mark as read
    unread = await db.execute(
        select(Message).where(
            Message.conversation_id == conv_id, Message.sender_id != user.id, Message.read == False
        )
    )
    for msg in unread.scalars().all():
        msg.read = True
    await db.flush()

    return [{"id": m.id, "content": m.content, "type": m.type, "senderId": m.sender_id,
             "read": m.read, "createdAt": m.created_at.isoformat()} for m in reversed(messages)]

@router.post("/conversations/{conv_id}/messages")
async def send_message(conv_id: str, req: SendMessageRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Verify user is part of conversation
    conv_result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = conv_result.scalar_one_or_none()
    if not conv or (conv.user1_id != user.id and conv.user2_id != user.id):
        raise HTTPException(status_code=403, detail="Not part of this conversation")

    msg = Message(content=req.content, type=req.type, sender_id=user.id, conversation_id=conv_id)
    db.add(msg)

    # Update conversation timestamp
    from datetime import datetime
    conv.updated_at = datetime.utcnow()

    await db.flush()
    await db.refresh(msg)
    return {"id": msg.id, "content": msg.content, "senderId": msg.sender_id, "createdAt": msg.created_at.isoformat()}
