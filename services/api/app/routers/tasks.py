from fastapi import APIRouter, Depends, HTTPException, Query
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
    status: Optional[str] = "open",
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

    return {"tasks": [
        {
            "id": t.id, "title": t.title, "description": t.description,
            "category": t.category, "budget": t.budget,
            "deadline": t.deadline.isoformat() if t.deadline else None,
            "status": t.status, "studentId": t.student_id,
            "createdAt": t.created_at.isoformat() if t.created_at else None,
        }
        for t in tasks
    ]}

@router.get("/mine")
async def my_tasks(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Task).where(Task.student_id == user.id).order_by(desc(Task.created_at))
    )
    tasks = result.scalars().all()
    return {"tasks": [{"id": t.id, "title": t.title, "status": t.status, "budget": t.budget} for t in tasks]}

@router.get("/{task_id}")
async def get_task(task_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Get bid count
    bid_result = await db.execute(select(func.count(Bid.id)).where(Bid.task_id == task_id))
    bids_count = bid_result.scalar() or 0

    return {
        "id": task.id, "title": task.title, "description": task.description,
        "category": task.category, "budget": task.budget,
        "deadline": task.deadline.isoformat() if task.deadline else None,
        "status": task.status, "studentId": task.student_id,
        "bidsCount": bids_count, "files": task.files,
        "createdAt": task.created_at.isoformat() if task.created_at else None,
    }

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

# Bids on a task
@router.post("/{task_id}/bids")
async def create_bid(task_id: str, amount: float, message: str, delivery_days: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    bid = Bid(task_id=task_id, helper_id=user.id, amount=amount, message=message, delivery_days=delivery_days)
    db.add(bid)
    await db.flush()
    return {"id": bid.id, "status": bid.status}

@router.get("/{task_id}/bids")
async def list_bids(task_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Bid).where(Bid.task_id == task_id).order_by(desc(Bid.created_at)))
    bids = result.scalars().all()
    return [{"id": b.id, "amount": b.amount, "message": b.message, "deliveryDays": b.delivery_days, "status": b.status, "helperId": b.helper_id} for b in bids]
