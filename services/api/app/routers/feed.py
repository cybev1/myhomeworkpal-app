from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from app.models.database import get_db, FeedPost, User
from app.services.auth_service import get_current_user

router = APIRouter()

class CreatePostRequest(BaseModel):
    content: str

@router.get("")
async def list_posts(page: int = 1, limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FeedPost).order_by(desc(FeedPost.created_at)).offset((page - 1) * limit).limit(limit)
    )
    posts = result.scalars().all()
    output = []
    for p in posts:
        author_result = await db.execute(select(User).where(User.id == p.author_id))
        author = author_result.scalar_one_or_none()
        output.append({
            "id": p.id, "content": p.content, "likesCount": p.likes_count,
            "commentsCount": p.comments_count, "createdAt": p.created_at.isoformat(),
            "author": {"id": author.id, "name": author.name, "avatar": author.avatar} if author else None,
        })
    return output

@router.post("")
async def create_post(req: CreatePostRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    post = FeedPost(content=req.content, author_id=user.id)
    db.add(post)
    await db.flush()
    await db.refresh(post)
    return {"id": post.id, "content": post.content}

@router.post("/{post_id}/like")
async def like_post(post_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FeedPost).where(FeedPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.likes_count = (post.likes_count or 0) + 1
    await db.flush()
    return {"likes": post.likes_count}
