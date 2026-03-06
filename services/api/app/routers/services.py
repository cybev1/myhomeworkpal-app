from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Optional
from app.models.database import get_db, Service, User
from app.services.auth_service import get_current_user

router = APIRouter()

class CreateServiceRequest(BaseModel):
    title: str
    description: str
    category: str
    price: float
    delivery_days: int
    revisions: int = 2

class UpdateServiceRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    delivery_days: Optional[int] = None
    active: Optional[bool] = None

@router.post("")
async def create_service(req: CreateServiceRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = Service(
        title=req.title, description=req.description, category=req.category,
        price=req.price, delivery_days=req.delivery_days, revisions=req.revisions,
        helper_id=user.id,
    )
    db.add(service)
    await db.flush()
    await db.refresh(service)
    return {"id": service.id, "title": service.title}

@router.get("")
async def list_services(category: Optional[str] = None, page: int = 1, limit: int = 20, db: AsyncSession = Depends(get_db)):
    query = select(Service).where(Service.active == True)
    if category:
        query = query.where(Service.category == category)
    query = query.order_by(desc(Service.created_at)).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    services = result.scalars().all()
    return [{"id": s.id, "title": s.title, "description": s.description, "category": s.category,
             "price": s.price, "deliveryDays": s.delivery_days, "helperId": s.helper_id,
             "createdAt": s.created_at.isoformat()} for s in services]

@router.get("/mine")
async def my_services(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Service).where(Service.helper_id == user.id).order_by(desc(Service.created_at)))
    services = result.scalars().all()
    return [{"id": s.id, "title": s.title, "price": s.price, "active": s.active} for s in services]

@router.get("/{service_id}")
async def get_service(service_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    # Get helper info
    helper_result = await db.execute(select(User).where(User.id == service.helper_id))
    helper = helper_result.scalar_one_or_none()
    return {
        "id": service.id, "title": service.title, "description": service.description,
        "category": service.category, "price": service.price, "deliveryDays": service.delivery_days,
        "revisions": service.revisions,
        "helper": {
            "id": helper.id, "name": helper.name, "rating": helper.rating,
            "totalReviews": helper.total_reviews, "completedOrders": helper.completed_orders,
            "verified": helper.verified,
        } if helper else None,
    }

@router.patch("/{service_id}")
async def update_service(service_id: str, req: UpdateServiceRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Service).where(Service.id == service_id, Service.helper_id == user.id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    for field, value in req.model_dump(exclude_none=True).items():
        setattr(service, field, value)
    await db.flush()
    return {"id": service.id, "title": service.title, "updated": True}

@router.delete("/{service_id}")
async def delete_service(service_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Service).where(Service.id == service_id, Service.helper_id == user.id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    await db.delete(service)
    return {"deleted": True}
