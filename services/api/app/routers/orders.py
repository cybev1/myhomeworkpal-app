from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from app.models.database import get_db, Order, Task, User, Bid, Payment
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

@router.post("")
async def create_order(req: CreateOrderRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    order = Order(
        task_id=req.task_id, service_id=req.service_id,
        student_id=user.id, helper_id=req.helper_id,
        amount=req.amount, status="active",
        delivery_deadline=datetime.utcnow() + timedelta(days=7),
    )
    db.add(order)

    # Create escrow payment
    payment = Payment(
        amount=req.amount, status="held",
        order_id=order.id, payer_id=user.id, payee_id=req.helper_id,
    )
    db.add(payment)
    await db.flush()
    await db.refresh(order)
    return {"id": order.id, "status": order.status, "amount": order.amount}

@router.get("")
async def list_orders(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).where(or_(Order.student_id == user.id, Order.helper_id == user.id))
        .order_by(desc(Order.created_at))
    )
    orders = result.scalars().all()
    return [{"id": o.id, "status": o.status, "amount": o.amount,
             "taskId": o.task_id, "studentId": o.student_id, "helperId": o.helper_id,
             "deliveryDeadline": o.delivery_deadline.isoformat() if o.delivery_deadline else None,
             "createdAt": o.created_at.isoformat()} for o in orders]

@router.get("/{order_id}")
async def get_order(order_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.student_id != user.id and order.helper_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return {"id": order.id, "status": order.status, "amount": order.amount,
            "taskId": order.task_id, "studentId": order.student_id, "helperId": order.helper_id,
            "deliveredAt": order.delivered_at.isoformat() if order.delivered_at else None,
            "createdAt": order.created_at.isoformat()}

@router.post("/{order_id}/deliver")
async def deliver_order(order_id: str, req: DeliverRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
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
    order.status = "completed"
    order.completed_at = datetime.utcnow()

    # Release escrow payment
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

class ReviewRequest(BaseModel):
    rating: int
    comment: str = ""

@router.post("/{order_id}/review")
async def create_review(order_id: str, req: ReviewRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rating = req.rating
    comment = req.comment
    from app.models.database import Review
    result = await db.execute(select(Order).where(Order.id == order_id, Order.student_id == user.id))
    order = result.scalar_one_or_none()
    if not order or order.status != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed orders")

    review = Review(
        rating=rating, comment=comment, order_id=order_id,
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
        helper.rating = ((current_avg * total) + rating) / new_total
        helper.total_reviews = new_total

    await db.flush()
    return {"message": "Review submitted", "rating": rating}
