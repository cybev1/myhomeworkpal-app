from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Optional
from app.models.database import get_db, Bid, Task, User
from app.services.auth_service import get_current_user

router = APIRouter()

class CreateBidRequest(BaseModel):
    amount: float
    message: str
    delivery_days: int

@router.post("/{bid_id}/accept")
async def accept_bid(bid_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Bid).where(Bid.id == bid_id))
    bid = result.scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    # Verify the task owner is accepting
    task_result = await db.execute(select(Task).where(Task.id == bid.task_id))
    task = task_result.scalar_one_or_none()
    if not task or task.student_id != user.id:
        raise HTTPException(status_code=403, detail="Only task owner can accept bids")

    bid.status = "accepted"
    task.status = "in_progress"
    task.assigned_helper_id = bid.helper_id

    # Reject other pending bids
    other_bids = await db.execute(
        select(Bid).where(Bid.task_id == bid.task_id, Bid.id != bid_id, Bid.status == "pending")
    )
    for other in other_bids.scalars().all():
        other.status = "rejected"

    await db.flush()
    return {"id": bid.id, "status": "accepted", "message": "Bid accepted, order started"}

@router.post("/{bid_id}/reject")
async def reject_bid(bid_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Bid).where(Bid.id == bid_id))
    bid = result.scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    bid.status = "rejected"
    await db.flush()
    return {"id": bid.id, "status": "rejected"}

@router.post("/{bid_id}/withdraw")
async def withdraw_bid(bid_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Bid).where(Bid.id == bid_id, Bid.helper_id == user.id))
    bid = result.scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    bid.status = "withdrawn"
    await db.flush()
    return {"id": bid.id, "status": "withdrawn"}

@router.get("/mine")
async def my_bids(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Bid).where(Bid.helper_id == user.id).order_by(desc(Bid.created_at)))
    bids = result.scalars().all()
    return [{"id": b.id, "amount": b.amount, "message": b.message, "deliveryDays": b.delivery_days,
             "status": b.status, "taskId": b.task_id, "createdAt": b.created_at.isoformat()} for b in bids]
