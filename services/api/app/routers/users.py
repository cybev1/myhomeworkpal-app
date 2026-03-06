from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_
from app.models.database import get_db, User, Review, Follow
from app.services.auth_service import get_current_user

router = APIRouter()

@router.get("/search")
async def search_users(q: str = "", role: str = "", page: int = 1, limit: int = 20, db: AsyncSession = Depends(get_db)):
    query = select(User)
    if q:
        query = query.where(or_(User.name.ilike(f"%{q}%"), User.bio.ilike(f"%{q}%")))
    if role:
        query = query.where(User.role == role)
    query = query.order_by(desc(User.rating)).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()
    return [{"id": u.id, "name": u.name, "avatar": u.avatar, "role": u.role,
             "rating": u.rating, "totalReviews": u.total_reviews,
             "completedOrders": u.completed_orders, "verified": u.verified} for u in users]

@router.get("/top-helpers")
async def top_helpers(limit: int = 10, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.role == "helper").order_by(desc(User.rating)).limit(limit)
    )
    helpers = result.scalars().all()
    return [{"id": h.id, "name": h.name, "avatar": h.avatar, "rating": h.rating,
             "totalReviews": h.total_reviews, "completedOrders": h.completed_orders,
             "bio": h.bio, "verified": h.verified} for h in helpers]

@router.get("/{user_id}")
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "name": user.name, "avatar": user.avatar, "role": user.role,
            "bio": user.bio, "skills": user.skills, "rating": user.rating,
            "totalReviews": user.total_reviews, "completedOrders": user.completed_orders,
            "verified": user.verified, "createdAt": user.created_at.isoformat()}

@router.get("/{user_id}/reviews")
async def user_reviews(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Review).where(Review.reviewee_id == user_id).order_by(desc(Review.created_at)))
    reviews = result.scalars().all()
    output = []
    for r in reviews:
        reviewer_result = await db.execute(select(User).where(User.id == r.reviewer_id))
        reviewer = reviewer_result.scalar_one_or_none()
        output.append({
            "id": r.id, "rating": r.rating, "comment": r.comment,
            "reviewer": {"id": reviewer.id, "name": reviewer.name} if reviewer else None,
            "createdAt": r.created_at.isoformat(),
        })
    return output

@router.post("/{user_id}/follow")
async def follow_user(user_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    existing = await db.execute(
        select(Follow).where(Follow.follower_id == user.id, Follow.following_id == user_id)
    )
    if existing.scalar_one_or_none():
        return {"message": "Already following"}
    follow = Follow(follower_id=user.id, following_id=user_id)
    db.add(follow)
    await db.flush()
    return {"message": "Followed"}

@router.delete("/{user_id}/follow")
async def unfollow_user(user_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Follow).where(Follow.follower_id == user.id, Follow.following_id == user_id)
    )
    follow = result.scalar_one_or_none()
    if follow:
        await db.delete(follow)
    return {"message": "Unfollowed"}
