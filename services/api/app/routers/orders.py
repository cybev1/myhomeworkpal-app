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
    await db.flush()        # Flush order first to generate order.id
    await db.refresh(order)  # Now order.id is populated

    # Create escrow payment with the real order.id
    payment = Payment(
        amount=req.amount, status="held",
        order_id=order.id, payer_id=user.id, payee_id=req.helper_id,
    )
    db.add(payment)
    await db.flush()

    # Update student escrow balance
    user.escrow_balance = (user.escrow_balance or 0) + req.amount
    await db.flush()

    return {"id": order.id, "status": order.status, "amount": order.amount}

@router.get("")
async def list_orders(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).where(or_(Order.student_id == user.id, Order.helper_id == user.id))
        .order_by(desc(Order.created_at))
    )
    orders = result.scalars().all()
    order_list = []
    for o in orders:
        # Get task title
        title = f"Order #{o.id[:8]}"
        if o.task_id:
            tr = await db.execute(select(Task).where(Task.id == o.task_id))
            task = tr.scalar_one_or_none()
            if task:
                title = task.title
        # Get helper/student name
        helper_name = None
        student_name = None
        if o.helper_id:
            hr = await db.execute(select(User).where(User.id == o.helper_id))
            h = hr.scalar_one_or_none()
            if h: helper_name = h.name
        if o.student_id:
            sr = await db.execute(select(User).where(User.id == o.student_id))
            s = sr.scalar_one_or_none()
            if s: student_name = s.name
        order_list.append({
            "id": o.id, "status": o.status, "amount": o.amount, "title": title,
            "taskId": o.task_id, "studentId": o.student_id, "helperId": o.helper_id,
            "helperName": helper_name, "studentName": student_name,
            "deliveryDeadline": o.delivery_deadline.isoformat() if o.delivery_deadline else None,
            "deliveredAt": o.delivered_at.isoformat() if o.delivered_at else None,
            "createdAt": o.created_at.isoformat(),
        })
    return {"orders": order_list}

@router.get("/{order_id}")
async def get_order(order_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.student_id != user.id and order.helper_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    # Get task title
    title = f"Order #{order.id[:8]}"
    if order.task_id:
        tr = await db.execute(select(Task).where(Task.id == order.task_id))
        task = tr.scalar_one_or_none()
        if task: title = task.title
    # Get names
    helper_name = student_name = None
    if order.helper_id:
        hr = await db.execute(select(User).where(User.id == order.helper_id))
        h = hr.scalar_one_or_none()
        if h: helper_name = h.name
    if order.student_id:
        sr = await db.execute(select(User).where(User.id == order.student_id))
        s = sr.scalar_one_or_none()
        if s: student_name = s.name
    return {"id": order.id, "status": order.status, "amount": order.amount, "title": title,
            "taskId": order.task_id, "studentId": order.student_id, "helperId": order.helper_id,
            "helperName": helper_name, "studentName": student_name,
            "deliveryDeadline": order.delivery_deadline.isoformat() if order.delivery_deadline else None,
            "deliveredAt": order.delivered_at.isoformat() if order.delivered_at else None,
            "completedAt": order.completed_at.isoformat() if order.completed_at else None,
            "revisionMessage": order.revision_message,
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
