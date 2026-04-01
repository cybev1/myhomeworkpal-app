from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from app.models.database import get_db, Order, Task, User, Bid, Payment, Review
from app.services.auth_service import get_current_user

router = APIRouter()

class CreateOrderRequest(BaseModel):
    task_id: Optional[str] = None
    service_id: Optional[str] = None
    helper_id: str
    amount: float

class DeliverRequest(BaseModel):
    message: Optional[str] = None

class RevisionRequest(BaseModel):
    message: str

class DisputeRequest(BaseModel):
    reason: str

class ReviewRequest(BaseModel):
    rating: int
    comment: str = ""

def order_response(o, title=None, helper_name=None, student_name=None):
    return {
        "id": o.id, "status": o.status, "amount": o.amount,
        "title": title or f"Order #{o.id[:8]}",
        "taskId": o.task_id, "studentId": o.student_id, "helperId": o.helper_id,
        "helperName": helper_name, "studentName": student_name,
        "deliveryDeadline": o.delivery_deadline.isoformat() if o.delivery_deadline else None,
        "deliveredAt": o.delivered_at.isoformat() if o.delivered_at else None,
        "completedAt": o.completed_at.isoformat() if o.completed_at else None,
        "revisionMessage": o.revision_message,
        "createdAt": o.created_at.isoformat(),
    }

async def enrich_order(o, db):
    title = f"Order #{o.id[:8]}"
    if o.task_id:
        tr = await db.execute(select(Task).where(Task.id == o.task_id))
        task = tr.scalar_one_or_none()
        if task: title = task.title
    helper_name = student_name = None
    if o.helper_id:
        hr = await db.execute(select(User).where(User.id == o.helper_id))
        h = hr.scalar_one_or_none()
        if h: helper_name = h.name
    if o.student_id:
        sr = await db.execute(select(User).where(User.id == o.student_id))
        s = sr.scalar_one_or_none()
        if s: student_name = s.name
    return order_response(o, title, helper_name, student_name)

@router.post("")
async def create_order(req: CreateOrderRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Check student has sufficient balance
    available = (user.balance or 0)
    if available < req.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient funds. You have ${available:.2f} but need ${req.amount:.2f}. Please add funds to your wallet first."
        )

    # Create order
    order = Order(
        task_id=req.task_id, service_id=req.service_id,
        student_id=user.id, helper_id=req.helper_id,
        amount=req.amount, status="active",
        delivery_deadline=datetime.utcnow() + timedelta(days=7),
    )
    db.add(order)
    await db.flush()
    await db.refresh(order)

    # Move funds from balance to escrow
    user.balance = (user.balance or 0) - req.amount
    user.escrow_balance = (user.escrow_balance or 0) + req.amount

    # Create escrow payment record
    payment = Payment(
        amount=req.amount, status="held",
        order_id=order.id, payer_id=user.id, payee_id=req.helper_id,
    )
    db.add(payment)
    await db.flush()

    return {"id": order.id, "status": order.status, "amount": order.amount}

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
    if order.student_id != user.id and order.helper_id != user.id:
        # Allow admins
        if user.role not in ("admin", "superadmin"):
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

    # Release escrow — move funds to helper
    pay_result = await db.execute(select(Payment).where(Payment.order_id == order_id))
    payment = pay_result.scalar_one_or_none()
    if payment:
        payment.status = "released"

    # Credit helper balance
    helper_result = await db.execute(select(User).where(User.id == order.helper_id))
    helper = helper_result.scalar_one_or_none()
    if helper:
        helper.balance = (helper.balance or 0) + order.amount
        helper.completed_orders = (helper.completed_orders or 0) + 1

    # Deduct from student escrow
    student_result = await db.execute(select(User).where(User.id == order.student_id))
    student = student_result.scalar_one_or_none()
    if student:
        student.escrow_balance = max(0, (student.escrow_balance or 0) - order.amount)

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
    await db.flush()
    return {"id": order.id, "status": "revision"}

@router.post("/{order_id}/dispute")
async def dispute_order(order_id: str, req: DisputeRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = "disputed"
    await db.flush()
    return {"id": order.id, "status": "disputed", "message": "Dispute opened, admin will review"}

@router.post("/{order_id}/review")
async def create_review(order_id: str, req: ReviewRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id, Order.student_id == user.id))
    order = result.scalar_one_or_none()
    if not order or order.status != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed orders")

    # Check for existing review
    existing = await db.execute(select(Review).where(Review.order_id == order_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already reviewed")

    review = Review(
        rating=req.rating, comment=req.comment, order_id=order_id,
        reviewer_id=user.id, reviewee_id=order.helper_id,
    )
    db.add(review)

    # Update helper rating
    helper_result = await db.execute(select(User).where(User.id == order.helper_id))
    helper = helper_result.scalar_one_or_none()
    if helper:
        total = (helper.total_reviews or 0)
        current_avg = (helper.rating or 0)
        new_total = total + 1
        helper.rating = round(((current_avg * total) + req.rating) / new_total, 2)
        helper.total_reviews = new_total

    await db.flush()
    return {"message": "Review submitted", "rating": req.rating}
