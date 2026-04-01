# ═══════════════════════════════════════════════════════════════
# MyHomeworkPal Admin Router v1.0
# Superuser: udezedike@gmail.com (auto-promoted on first auth/me)
# ═══════════════════════════════════════════════════════════════
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from pydantic import BaseModel
from typing import Optional
from app.models.database import get_db, User, Task, Order, Bid, Payment, Review
from app.services.auth_service import get_current_user

router = APIRouter()

SUPERUSER_EMAILS = ["udezedike@gmail.com"]

# ═══ Middleware: require admin/superadmin ═══
async def require_admin(user: User = Depends(get_current_user)):
    if user.role not in ("admin", "superadmin") and user.email not in SUPERUSER_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_superadmin(user: User = Depends(get_current_user)):
    if user.role != "superadmin" and user.email not in SUPERUSER_EMAILS:
        raise HTTPException(status_code=403, detail="Superadmin access required")
    return user

# ═══ Dashboard Stats ═══
@router.get("/stats")
async def admin_stats(user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    users_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    tasks_count = (await db.execute(select(func.count(Task.id)))).scalar() or 0
    orders_count = (await db.execute(select(func.count(Order.id)))).scalar() or 0
    students = (await db.execute(select(func.count(User.id)).where(User.role == "student"))).scalar() or 0
    helpers = (await db.execute(select(func.count(User.id)).where(User.role == "helper"))).scalar() or 0
    open_tasks = (await db.execute(select(func.count(Task.id)).where(Task.status == "open"))).scalar() or 0
    return {
        "totalUsers": users_count, "totalTasks": tasks_count, "totalOrders": orders_count,
        "students": students, "helpers": helpers, "admins": users_count - students - helpers,
        "openTasks": open_tasks,
    }

# ═══ User Management ═══
class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    verified: Optional[bool] = None
    bio: Optional[str] = None
    balance: Optional[float] = None

@router.get("/users")
async def list_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1, limit: int = 20,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if search:
        query = query.where(or_(User.name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%")))
    query = query.order_by(desc(User.created_at)).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()
    total = (await db.execute(select(func.count(User.id)))).scalar() or 0
    return {
        "users": [{
            "id": u.id, "name": u.name, "email": u.email, "role": u.role,
            "verified": u.verified, "rating": u.rating, "balance": u.balance,
            "totalReviews": u.total_reviews, "completedOrders": u.completed_orders,
            "createdAt": u.created_at.isoformat() if u.created_at else None,
        } for u in users],
        "total": total, "page": page, "limit": limit,
    }

@router.get("/users/{user_id}")
async def get_user(user_id: str, user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    u = result.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": u.id, "name": u.name, "email": u.email, "role": u.role,
        "verified": u.verified, "bio": u.bio, "rating": u.rating,
        "balance": u.balance, "escrowBalance": u.escrow_balance,
        "totalReviews": u.total_reviews, "completedOrders": u.completed_orders,
        "createdAt": u.created_at.isoformat() if u.created_at else None,
    }

@router.patch("/users/{user_id}")
async def update_user(user_id: str, req: UpdateUserRequest, user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    # Only superadmin can promote to admin/superadmin
    if req.role in ("admin", "superadmin") and user.role != "superadmin" and user.email not in SUPERUSER_EMAILS:
        raise HTTPException(status_code=403, detail="Only superadmin can promote to admin")
    for field, value in req.model_dump(exclude_none=True).items():
        setattr(target, field, value)
    await db.flush()
    return {"message": f"User {target.name} updated", "role": target.role}

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: User = Depends(require_superadmin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.email in SUPERUSER_EMAILS:
        raise HTTPException(status_code=403, detail="Cannot delete superuser")
    await db.delete(target)
    return {"message": f"User {target.name} deleted"}

# ═══ Promote / Demote shortcuts ═══
@router.post("/users/{user_id}/promote")
async def promote_user(user_id: str, role: str = "admin", user: User = Depends(require_superadmin), db: AsyncSession = Depends(get_db)):
    if role not in ("admin", "superadmin", "helper", "student"):
        raise HTTPException(status_code=400, detail="Invalid role")
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.role = role
    await db.flush()
    return {"message": f"{target.name} promoted to {role}", "role": role}

@router.post("/users/{user_id}/verify")
async def verify_user(user_id: str, user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.verified = True
    await db.flush()
    return {"message": f"{target.name} verified"}

# ═══ Task Management ═══
@router.get("/tasks")
async def admin_list_tasks(
    status: Optional[str] = None, page: int = 1, limit: int = 20,
    user: User = Depends(require_admin), db: AsyncSession = Depends(get_db),
):
    query = select(Task)
    if status:
        query = query.where(Task.status == status)
    query = query.order_by(desc(Task.created_at)).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    tasks = result.scalars().all()
    return {"tasks": [{
        "id": t.id, "title": t.title, "category": t.category, "budget": t.budget,
        "status": t.status, "studentId": t.student_id,
        "createdAt": t.created_at.isoformat() if t.created_at else None,
    } for t in tasks]}

@router.delete("/tasks/{task_id}")
async def admin_delete_task(task_id: str, user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    return {"message": "Task deleted"}
