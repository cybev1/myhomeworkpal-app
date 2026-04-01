# ═══════════════════════════════════════════════════════════════
# MyHomeworkPal Orders — Full workspace with auto-conversation
# Creates chat on order, system messages on status changes
# ═══════════════════════════════════════════════════════════════
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from app.models.database import get_db, Order, Task, User, Bid, Payment, Review, Conversation, Message
from app.services.auth_service import get_current_user

router = APIRouter()

class CreateOrderRequest(BaseModel):
    task_id: Optional[str] = None
    service_id: Optional[str] = None
    helper_id: str
    amount: float

class RevisionRequest(BaseModel):
    message: str

class DisputeRequest(BaseModel):
    reason: str

class ReviewRequest(BaseModel):
    rating: int
    comment: str = ""

# ═══ Helper: find or create conversation ═══
async def get_or_create_conversation(user1_id: str, user2_id: str, db: AsyncSession) -> str:
    result = await db.execute(
        select(Conversation).where(
            or_(
                (Conversation.user1_id == user1_id) & (Conversation.user2_id == user2_id),
                (Conversation.user1_id == user2_id) & (Conversation.user2_id == user1_id),
            )
        )
    )
    conv = result.scalar_one_or_none()
    if conv:
        return conv.id
    conv = Conversation(user1_id=user1_id, user2_id=user2_id)
    db.add(conv)
    await db.flush()
    await db.refresh(conv)
    return conv.id

# ═══ Helper: send system message ═══
async def send_system_message(conv_id: str, content: str, db: AsyncSession):
    msg = Message(content=content, type="system", sender_id="system", conversation_id=conv_id)
    db.add(msg)
    await db.flush()

# ═══ Helper: enrich order response ═══
async def enrich_order(o, db):
    title = f"Order #{o.id[:8]}"
    if o.task_id:
        tr = await db.execute(select(Task).where(Task.id == o.task_id))
        task = tr.scalar_one_or_none()
        if task: title = task.title
    helper_name = student_name = None
    conv_id = None
    if o.helper_id:
        hr = await db.execute(select(User).where(User.id == o.helper_id))
        h = hr.scalar_one_or_none()
        if h: helper_name = h.name
    if o.student_id:
        sr = await db.execute(select(User).where(User.id == o.student_id))
        s = sr.scalar_one_or_none()
        if s: student_name = s.name
    # Find linked conversation
    if o.student_id and o.helper_id:
        cr = await db.execute(
            select(Conversation).where(
                or_(
                    (Conversation.user1_id == o.student_id) & (Conversation.user2_id == o.helper_id),
                    (Conversation.user1_id == o.helper_id) & (Conversation.user2_id == o.student_id),
                )
            )
        )
        conv = cr.scalar_one_or_none()
        if conv: conv_id = conv.id
    return {
        "id": o.id, "status": o.status, "amount": o.amount, "title": title,
        "taskId": o.task_id, "studentId": o.student_id, "helperId": o.helper_id,
        "helperName": helper_name, "studentName": student_name,
        "conversationId": conv_id,
        "deliveryDeadline": o.delivery_deadline.isoformat() if o.delivery_deadline else None,
        "deliveredAt": o.delivered_at.isoformat() if o.delivered_at else None,
        "completedAt": o.completed_at.isoformat() if o.completed_at else None,
        "revisionMessage": o.revision_message,
        "createdAt": o.created_at.isoformat(),
    }

# ═══ Create order — auto-creates conversation ═══
@router.post("")
async def create_order(req: CreateOrderRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    available = (user.balance or 0)
    if available < req.amount:
        raise HTTPException(status_code=400, detail=f"Insufficient funds. You have ${available:.2f} but need ${req.amount:.2f}. Please add funds to your wallet first.")

    order = Order(
        task_id=req.task_id, service_id=req.service_id,
        student_id=user.id, helper_id=req.helper_id,
        amount=req.amount, status="active",
        delivery_deadline=datetime.utcnow() + timedelta(days=7),
    )
    db.add(order)
    await db.flush()
    await db.refresh(order)

    # Move funds to escrow
    user.balance = (user.balance or 0) - req.amount
    user.escrow_balance = (user.escrow_balance or 0) + req.amount

    payment = Payment(amount=req.amount, status="held", order_id=order.id, payer_id=user.id, payee_id=req.helper_id)
    db.add(payment)

    # Auto-create conversation + welcome message
    conv_id = await get_or_create_conversation(user.id, req.helper_id, db)
    task_title = ""
    if req.task_id:
        tr = await db.execute(select(Task).where(Task.id == req.task_id))
        t = tr.scalar_one_or_none()
        if t: task_title = t.title
    await send_system_message(conv_id, f"🎉 Order started for \"{task_title or 'task'}\" — ${req.amount:.2f} held in escrow. You can now discuss details and share files here.", db)

    await db.flush()
    return {"id": order.id, "status": order.status, "amount": order.amount, "conversationId": conv_id}

@router.get("")
async def list_orders(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).where(or_(Order.student_id == user.id, Order.helper_id == user.id))
        .order_by(desc(Order.created_at))
    )
    orders = result.scalars().all()
    return {"orders": [await enrich_order(o, db) for o in orders]}

@router.get("/{order_id}")
async def get_order(order_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.student_id != user.id and order.helper_id != user.id and user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    return await enrich_order(order, db)

@router.post("/{order_id}/deliver")
async def deliver_order(order_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id, Order.helper_id == user.id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status not in ("active", "revision"):
        raise HTTPException(status_code=400, detail="Order cannot be delivered in current state")
    order.status = "delivered"
    order.delivered_at = datetime.utcnow()

    # System message in conversation
    conv_id = await get_or_create_conversation(order.student_id, order.helper_id, db)
    await send_system_message(conv_id, "📦 Work has been delivered! Student, please review and approve or request revision.", db)

    await db.flush()
    return {"id": order.id, "status": "delivered"}

@router.post("/{order_id}/approve")
async def approve_order(order_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id, Order.student_id == user.id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "delivered":
        raise HTTPException(status_code=400, detail="Can only approve delivered orders")
    order.status = "completed"
    order.completed_at = datetime.utcnow()

    # Release escrow
    pay = await db.execute(select(Payment).where(Payment.order_id == order_id))
    payment = pay.scalar_one_or_none()
    if payment: payment.status = "released"

    helper = (await db.execute(select(User).where(User.id == order.helper_id))).scalar_one_or_none()
    if helper:
        helper.balance = (helper.balance or 0) + order.amount
        helper.completed_orders = (helper.completed_orders or 0) + 1

    student = (await db.execute(select(User).where(User.id == order.student_id))).scalar_one_or_none()
    if student:
        student.escrow_balance = max(0, (student.escrow_balance or 0) - order.amount)

    conv_id = await get_or_create_conversation(order.student_id, order.helper_id, db)
    await send_system_message(conv_id, f"✅ Order completed! ${order.amount:.2f} released to helper. Thank you!", db)

    await db.flush()
    return {"id": order.id, "status": "completed", "message": "Payment released to helper"}

@router.post("/{order_id}/revision")
async def request_revision(order_id: str, req: RevisionRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id, Order.student_id == user.id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = "revision"
    order.revision_message = req.message

    conv_id = await get_or_create_conversation(order.student_id, order.helper_id, db)
    await send_system_message(conv_id, f"🔄 Revision requested: \"{req.message}\"", db)

    await db.flush()
    return {"id": order.id, "status": "revision"}

@router.post("/{order_id}/dispute")
async def dispute_order(order_id: str, req: DisputeRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = "disputed"

    conv_id = await get_or_create_conversation(order.student_id, order.helper_id, db)
    await send_system_message(conv_id, f"⚠️ Dispute opened: \"{req.reason}\". A moderator will review this case.", db)

    await db.flush()
    return {"id": order.id, "status": "disputed", "message": "Dispute opened, admin will review"}

@router.post("/{order_id}/review")
async def create_review(order_id: str, req: ReviewRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id, Order.student_id == user.id))
    order = result.scalar_one_or_none()
    if not order or order.status != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed orders")

    existing = await db.execute(select(Review).where(Review.order_id == order_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already reviewed")

    review = Review(rating=req.rating, comment=req.comment, order_id=order_id, reviewer_id=user.id, reviewee_id=order.helper_id)
    db.add(review)

    helper = (await db.execute(select(User).where(User.id == order.helper_id))).scalar_one_or_none()
    if helper:
        total = helper.total_reviews or 0
        helper.rating = round(((helper.rating or 0) * total + req.rating) / (total + 1), 2)
        helper.total_reviews = total + 1

    conv_id = await get_or_create_conversation(order.student_id, order.helper_id, db)
    stars = "⭐" * req.rating
    await send_system_message(conv_id, f"{stars} Review submitted: \"{req.comment}\"", db)

    await db.flush()
    return {"message": "Review submitted", "rating": req.rating}
