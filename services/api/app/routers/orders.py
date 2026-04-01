# ═══════════════════════════════════════════════════════════════
# MyHomeworkPal Orders — Upwork/Fiverr Business Rules
#
# RULES:
#  - 20% platform commission (admin-adjustable via env)
#  - 3-day auto-approve: if student doesn't review after delivery,
#    order auto-completes (checked via cron or on-access)
#  - 14-day clearance: helper can withdraw after 14 days
#  - Revision limit: 2 free revisions per order
#  - Dispute window: 7 days after delivery
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

# ═══ Platform config — loaded from DB (admin-adjustable) ═══
from app.models.database import PlatformSettings

async def get_settings(db: AsyncSession):
    result = await db.execute(select(PlatformSettings).where(PlatformSettings.id == "settings"))
    s = result.scalar_one_or_none()
    if s:
        return {
            "fee": s.platform_fee_percent or 20,
            "auto_approve": s.auto_approve_days or 3,
            "clearance": s.clearance_days or 14,
            "max_revisions": s.max_revisions or 2,
        }
    return {"fee": 20, "auto_approve": 3, "clearance": 14, "max_revisions": 2}

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

# ═══ Helpers ═══
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
    if conv: return conv.id
    conv = Conversation(user1_id=user1_id, user2_id=user2_id)
    db.add(conv)
    await db.flush()
    await db.refresh(conv)
    return conv.id

async def sys_msg(conv_id: str, content: str, db: AsyncSession):
    msg = Message(content=content, type="system", sender_id=None, conversation_id=conv_id)
    db.add(msg)
    await db.flush()

async def check_auto_approve(order, db):
    """Auto-approve if delivered > auto_approve_days ago and student hasn't acted"""
    cfg = await get_settings(db)
    if order.status == "delivered" and order.delivered_at:
        deadline = order.delivered_at + timedelta(days=cfg["auto_approve"])
        if datetime.utcnow() > deadline:
            await _complete_order(order, db, auto=True)
            return True
    return False

async def _complete_order(order, db, auto=False):
    """Release escrow with platform fee deduction"""
    cfg = await get_settings(db)
    order.status = "completed"
    order.completed_at = datetime.utcnow()

    # Calculate platform fee
    fee = round(order.amount * cfg["fee"] / 100, 2)
    helper_payout = round(order.amount - fee, 2)

    # Update payment record
    pay = (await db.execute(select(Payment).where(Payment.order_id == order.id))).scalar_one_or_none()
    if pay: pay.status = "released"

    # Credit helper (minus platform fee)
    helper = (await db.execute(select(User).where(User.id == order.helper_id))).scalar_one_or_none()
    if helper:
        helper.balance = (helper.balance or 0) + helper_payout
        helper.completed_orders = (helper.completed_orders or 0) + 1

    # Deduct from student escrow
    student = (await db.execute(select(User).where(User.id == order.student_id))).scalar_one_or_none()
    if student:
        student.escrow_balance = max(0, (student.escrow_balance or 0) - order.amount)

    # System message
    conv_id = await get_or_create_conversation(order.student_id, order.helper_id, db)
    prefix = f"Auto-approved after {cfg[\"auto_approve\"]} days. " if auto else ""
    await sys_msg(conv_id, f"✅ {prefix}Order completed! Helper receives ${helper_payout:.2f} (${fee:.2f} platform fee). Thank you!", db)

    await db.flush()
    return helper_payout, fee

async def enrich_order(o, db):
    title = f"Order #{o.id[:8]}"
    if o.task_id:
        tr = await db.execute(select(Task).where(Task.id == o.task_id))
        task = tr.scalar_one_or_none()
        if task: title = task.title

    helper_name = student_name = conv_id = None
    if o.helper_id:
        h = (await db.execute(select(User).where(User.id == o.helper_id))).scalar_one_or_none()
        if h: helper_name = h.name
    if o.student_id:
        s = (await db.execute(select(User).where(User.id == o.student_id))).scalar_one_or_none()
        if s: student_name = s.name
    if o.student_id and o.helper_id:
        cr = await db.execute(select(Conversation).where(or_(
            (Conversation.user1_id == o.student_id) & (Conversation.user2_id == o.helper_id),
            (Conversation.user1_id == o.helper_id) & (Conversation.user2_id == o.student_id),
        )))
        conv = cr.scalar_one_or_none()
        if conv: conv_id = conv.id

    # Count revisions used
    cfg = await get_settings(db)
    revision_count = 0
    if conv_id:
        rev_msgs = await db.execute(
            select(Message).where(Message.conversation_id == conv_id, Message.content.like("%Revision requested%"))
        )
        revision_count = len(rev_msgs.scalars().all())

    fee = round(o.amount * cfg["fee"] / 100, 2)

    return {
        "id": o.id, "status": o.status, "amount": o.amount, "title": title,
        "taskId": o.task_id, "studentId": o.student_id, "helperId": o.helper_id,
        "helperName": helper_name, "studentName": student_name,
        "conversationId": conv_id,
        "platformFee": fee, "helperPayout": round(o.amount - fee, 2),
        "feePercent": cfg["fee"],
        "revisionsUsed": revision_count, "maxRevisions": cfg["max_revisions"],
        "autoApproveDays": cfg["auto_approve"],
        "autoApproveAt": (o.delivered_at + timedelta(days=cfg["auto_approve"])).isoformat() if o.delivered_at and o.status == "delivered" else None,
        "clearanceDate": (o.completed_at + timedelta(days=cfg["clearance"])).isoformat() if o.completed_at else None,
        "deliveryDeadline": o.delivery_deadline.isoformat() if o.delivery_deadline else None,
        "deliveredAt": o.delivered_at.isoformat() if o.delivered_at else None,
        "completedAt": o.completed_at.isoformat() if o.completed_at else None,
        "revisionMessage": o.revision_message,
        "createdAt": o.created_at.isoformat(),
    }

# ═══ Create order ═══
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

    user.balance = (user.balance or 0) - req.amount
    user.escrow_balance = (user.escrow_balance or 0) + req.amount

    payment = Payment(amount=req.amount, status="held", order_id=order.id, payer_id=user.id, payee_id=req.helper_id)
    db.add(payment)

    cfg = await get_settings(db)
    conv_id = await get_or_create_conversation(user.id, req.helper_id, db)
    task_title = ""
    if req.task_id:
        t = (await db.execute(select(Task).where(Task.id == req.task_id))).scalar_one_or_none()
        if t: task_title = t.title

    fee = round(req.amount * cfg["fee"] / 100, 2)
    payout = round(req.amount - fee, 2)
    await sys_msg(conv_id, f"🎉 Order started for \"{task_title or 'task'}\" — ${req.amount:.2f} held in escrow.\n\n💰 Helper receives ${payout:.2f} ({100-cfg['fee']:.0f}% after {cfg['fee']:.0f}% fee).\n📋 {cfg['max_revisions']} free revisions.\n⏰ Auto-approval {cfg['auto_approve']} days after delivery.\n\nDiscuss details and share files here!", db)

    await db.flush()
    return {"id": order.id, "status": order.status, "amount": order.amount, "conversationId": conv_id}

# ═══ List orders (checks auto-approve) ═══
@router.get("")
async def list_orders(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).where(or_(Order.student_id == user.id, Order.helper_id == user.id))
        .order_by(desc(Order.created_at))
    )
    orders = result.scalars().all()
    for o in orders:
        await check_auto_approve(o, db)
    return {"orders": [await enrich_order(o, db) for o in orders]}

# ═══ Get order (checks auto-approve) ═══
@router.get("/{order_id}")
async def get_order(order_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.student_id != user.id and order.helper_id != user.id and user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    await check_auto_approve(order, db)
    return await enrich_order(order, db)

# ═══ Deliver ═══
@router.post("/{order_id}/deliver")
async def deliver_order(order_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    order = (await db.execute(select(Order).where(Order.id == order_id, Order.helper_id == user.id))).scalar_one_or_none()
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    if order.status not in ("active", "revision"):
        raise HTTPException(status_code=400, detail="Order cannot be delivered in current state")
    order.status = "delivered"
    order.delivered_at = datetime.utcnow()

    cfg = await get_settings(db)
    conv_id = await get_or_create_conversation(order.student_id, order.helper_id, db)
    auto_date = (datetime.utcnow() + timedelta(days=cfg["auto_approve"])).strftime("%b %d, %Y")
    await sys_msg(conv_id, f"📦 Work delivered! Student has {cfg['auto_approve']} days to review.\n\nIf not reviewed by {auto_date}, order auto-completes and payment releases.", db)

    await db.flush()
    return {"id": order.id, "status": "delivered"}

# ═══ Approve ═══
@router.post("/{order_id}/approve")
async def approve_order(order_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    order = (await db.execute(select(Order).where(Order.id == order_id, Order.student_id == user.id))).scalar_one_or_none()
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "delivered":
        raise HTTPException(status_code=400, detail="Can only approve delivered orders")

    payout, fee = await _complete_order(order, db)
    await db.flush()
    return {"id": order.id, "status": "completed", "helperPayout": payout, "platformFee": fee}

# ═══ Revision (limited) ═══
@router.post("/{order_id}/revision")
async def request_revision(order_id: str, req: RevisionRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    order = (await db.execute(select(Order).where(Order.id == order_id, Order.student_id == user.id))).scalar_one_or_none()
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "delivered":
        raise HTTPException(status_code=400, detail="Can only request revision on delivered orders")

    cfg = await get_settings(db)
    conv_id = await get_or_create_conversation(order.student_id, order.helper_id, db)
    rev_msgs = await db.execute(
        select(Message).where(Message.conversation_id == conv_id, Message.content.like("%Revision requested%"))
    )
    used = len(rev_msgs.scalars().all())
    if used >= cfg["max_revisions"]:
        raise HTTPException(status_code=400, detail=f"Revision limit reached ({cfg['max_revisions']} free revisions). Please approve or open a dispute.")

    order.status = "revision"
    order.revision_message = req.message
    await sys_msg(conv_id, f"🔄 Revision requested ({used + 1}/{MAX_REVISIONS}): \"{req.message}\"", db)
    await db.flush()
    return {"id": order.id, "status": "revision", "revisionsUsed": used + 1, "maxRevisions": cfg["max_revisions"]}

# ═══ Dispute ═══
@router.post("/{order_id}/dispute")
async def dispute_order(order_id: str, req: DisputeRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    order = (await db.execute(select(Order).where(Order.id == order_id))).scalar_one_or_none()
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    order.status = "disputed"

    conv_id = await get_or_create_conversation(order.student_id, order.helper_id, db)
    await sys_msg(conv_id, f"⚠️ Dispute opened: \"{req.reason}\"\n\nA moderator will review this case within 24-48 hours. Escrow funds are frozen until resolution.", db)
    await db.flush()
    return {"id": order.id, "status": "disputed"}

# ═══ Review ═══
@router.post("/{order_id}/review")
async def create_review(order_id: str, req: ReviewRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    order = (await db.execute(select(Order).where(Order.id == order_id, Order.student_id == user.id))).scalar_one_or_none()
    if not order or order.status != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed orders")
    existing = (await db.execute(select(Review).where(Review.order_id == order_id))).scalar_one_or_none()
    if existing: raise HTTPException(status_code=400, detail="Already reviewed")

    review = Review(rating=req.rating, comment=req.comment, order_id=order_id, reviewer_id=user.id, reviewee_id=order.helper_id)
    db.add(review)

    helper = (await db.execute(select(User).where(User.id == order.helper_id))).scalar_one_or_none()
    if helper:
        total = helper.total_reviews or 0
        helper.rating = round(((helper.rating or 0) * total + req.rating) / (total + 1), 2)
        helper.total_reviews = total + 1

    conv_id = await get_or_create_conversation(order.student_id, order.helper_id, db)
    await sys_msg(conv_id, f"{'⭐' * req.rating} Review: \"{req.comment}\"", db)
    await db.flush()
    return {"message": "Review submitted", "rating": req.rating}

# ═══ Platform settings (admin) ═══
@router.get("/settings/platform")
async def get_platform_settings(user: User = Depends(get_current_user)):
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403)
    return {
        "feePercent": cfg["fee"],
        "autoApproveDays": cfg["auto_approve"],
        "clearanceDays": CLEARANCE_DAYS,
        "maxRevisions": cfg["max_revisions"],
    }
