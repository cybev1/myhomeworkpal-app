from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from app.models.database import get_db, User
from app.services.auth_service import (
    hash_password, verify_password, create_access_token, get_current_user,
)

router = APIRouter()

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "student"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UpdateProfileRequest(BaseModel):
    name: str | None = None
    bio: str | None = None
    skills: str | None = None

def user_response(user: User):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "avatar": user.avatar,
        "bio": user.bio,
        "skills": user.skills,
        "rating": user.rating,
        "totalReviews": user.total_reviews,
        "completedOrders": user.completed_orders,
        "verified": user.verified,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }

@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email exists
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=req.email,
        name=req.name,
        password_hash=hash_password(req.password),
        role=req.role,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token(user.id, user.role)
    return {"token": token, "user": user_response(user)}

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id, user.role)
    return {"token": token, "user": user_response(user)}

@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return user_response(user)

@router.patch("/profile")
async def update_profile(
    req: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.name is not None:
        user.name = req.name
    if req.bio is not None:
        user.bio = req.bio
    if req.skills is not None:
        user.skills = req.skills
    await db.flush()
    await db.refresh(user)
    return user_response(user)
