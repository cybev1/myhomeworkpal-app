from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.database import get_db, Task, User, Bid
from app.services.auth_service import get_current_user

router = APIRouter()

class CreateTaskRequest(BaseModel):
    title: str
    description: str
    category: str
    budget: float
    deadline: Optional[str] = None

class UpdateTaskRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    budget: Optional[float] = None
    status: Optional[str] = None

class CreateBidOnTaskRequest(BaseModel):
    amount: float
    message: str
    delivery_days: int = 3

def task_response(t: Task, bids_count: int = 0):
    return {
        "id": t.id, "title": t.title, "description": t.description,
        "category": t.category, "budget": t.budget,
        "deadline": t.deadline.isoformat() if t.deadline else None,
        "status": t.status, "studentId": t.student_id,
        "bidsCount": bids_count, "files": t.files,
        "createdAt": t.created_at.isoformat() if t.created_at else None,
    }

@router.post("")
async def create_task(req: CreateTaskRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    task = Task(
        title=req.title, description=req.description,
        category=req.category, budget=req.budget,
        deadline=datetime.fromisoformat(req.deadline) if req.deadline else None,
        student_id=user.id,
    )
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return {"id": task.id, "title": task.title, "status": task.status}

@router.get("")
async def list_tasks(
    category: Optional[str] = None,
    status: Optional[str] = None,
    sort: str = "newest",
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    query = select(Task)
    if category:
        query = query.where(Task.category == category)
    if status:
        query = query.where(Task.status == status)
    query = query.order_by(desc(Task.created_at))
    query = query.offset((page - 1) * limit).limit(limit)

    result = await db.execute(query)
    tasks = result.scalars().all()

    # Get bid counts
    task_list = []
    for t in tasks:
        bc = await db.execute(select(func.count(Bid.id)).where(Bid.task_id == t.id))
        task_list.append(task_response(t, bc.scalar() or 0))

    return {"tasks": task_list}

@router.get("/mine")
async def my_tasks(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Task).where(Task.student_id == user.id).order_by(desc(Task.created_at))
    )
    tasks = result.scalars().all()
    task_list = []
    for t in tasks:
        bc = await db.execute(select(func.count(Bid.id)).where(Bid.task_id == t.id))
        task_list.append(task_response(t, bc.scalar() or 0))
    return {"tasks": task_list}

@router.get("/{task_id}")
async def get_task(task_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    bid_result = await db.execute(select(func.count(Bid.id)).where(Bid.task_id == task_id))
    bids_count = bid_result.scalar() or 0

    # Get student info
    student_data = None
    if task.student_id:
        sr = await db.execute(select(User).where(User.id == task.student_id))
        student = sr.scalar_one_or_none()
        if student:
            student_data = {
                "id": student.id, "name": student.name, "role": student.role,
                "rating": student.rating, "totalReviews": student.total_reviews,
                "verified": student.verified,
            }

    resp = task_response(task, bids_count)
    resp["student"] = student_data
    return resp

@router.patch("/{task_id}")
async def update_task(task_id: str, req: UpdateTaskRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.student_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    for field, value in req.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    await db.flush()
    return {"id": task.id, "status": task.status}

@router.delete("/{task_id}")
async def delete_task(task_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task or task.student_id != user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    return {"deleted": True}

# ═══ Bids on a task ═══
@router.post("/{task_id}/bids")
async def create_bid(task_id: str, req: CreateBidOnTaskRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Verify task exists and is open
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status != "open":
        raise HTTPException(status_code=400, detail="Task is not accepting bids")
    if task.student_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot bid on your own task")

    # Check for duplicate bid
    existing = await db.execute(
        select(Bid).where(Bid.task_id == task_id, Bid.helper_id == user.id, Bid.status == "pending")
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already have a pending bid on this task")

    bid = Bid(
        task_id=task_id, helper_id=user.id,
        amount=req.amount, message=req.message, delivery_days=req.delivery_days,
    )
    db.add(bid)
    await db.flush()
    await db.refresh(bid)
    return {"id": bid.id, "status": bid.status, "amount": bid.amount}

@router.get("/{task_id}/bids")
async def list_bids(task_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Bid).where(Bid.task_id == task_id).order_by(desc(Bid.created_at))
    )
    bids = result.scalars().all()

    bid_list = []
    for b in bids:
        # Get helper info
        hr = await db.execute(select(User).where(User.id == b.helper_id))
        helper = hr.scalar_one_or_none()
        helper_data = None
        if helper:
            helper_data = {
                "id": helper.id, "name": helper.name, "role": helper.role,
                "rating": helper.rating, "totalReviews": helper.total_reviews,
                "completedOrders": helper.completed_orders, "verified": helper.verified,
            }
        bid_list.append({
            "id": b.id, "amount": b.amount, "message": b.message,
            "deliveryDays": b.delivery_days, "status": b.status,
            "helperId": b.helper_id, "helper": helper_data,
            "createdAt": b.created_at.isoformat() if b.created_at else None,
        })

    return {"bids": bid_list}
