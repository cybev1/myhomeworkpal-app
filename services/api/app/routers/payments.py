from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.database import get_db
from app.services.auth_service import get_current_user

router = APIRouter()

@router.get("")
async def list_payments(db: AsyncSession = Depends(get_db)):
    return {"message": "payments endpoint - implement with full CRUD"}

@router.get("/{item_id}")
async def get_payments(item_id: str, db: AsyncSession = Depends(get_db)):
    return {"id": item_id, "message": "payments detail endpoint"}
