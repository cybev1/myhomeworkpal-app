import os
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime,
    ForeignKey,
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import uuid

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://localhost/myhomeworkpal")

# Fix Railway's postgres:// to postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

# ═══════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════
class UserRole(str, enum.Enum):
    student = "student"
    helper = "helper"
    admin = "admin"

class TaskStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    delivered = "delivered"
    completed = "completed"
    cancelled = "cancelled"
    disputed = "disputed"

class OrderStatus(str, enum.Enum):
    pending = "pending"
    active = "active"
    delivered = "delivered"
    revision = "revision"
    completed = "completed"
    cancelled = "cancelled"
    disputed = "disputed"

class BidStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    withdrawn = "withdrawn"

class PaymentStatus(str, enum.Enum):
    pending = "pending"
    held = "held"
    released = "released"
    refunded = "refunded"

# ═══════════════════════════════════════
# MODELS
# ═══════════════════════════════════════
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.student)
    avatar = Column(String(500))
    bio = Column(Text)
    skills = Column(Text)  # JSON array
    rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    completed_orders = Column(Integer, default=0)
    verified = Column(Boolean, default=False)
    balance = Column(Float, default=0.0)
    escrow_balance = Column(Float, default=0.0)
    stripe_customer_id = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tasks = relationship("Task", back_populates="student", foreign_keys="Task.student_id")
    services = relationship("Service", back_populates="helper")
    bids = relationship("Bid", back_populates="helper")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True)
    budget = Column(Float, nullable=False)
    deadline = Column(DateTime)
    status = Column(String(20), default=TaskStatus.open, index=True)
    files = Column(Text)  # JSON array of file URLs
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    assigned_helper_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("User", back_populates="tasks", foreign_keys=[student_id])
    assigned_helper = relationship("User", foreign_keys=[assigned_helper_id])
    bids = relationship("Bid", back_populates="task")
    order = relationship("Order", back_populates="task", uselist=False)

class Service(Base):
    __tablename__ = "services"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True)
    price = Column(Float, nullable=False)
    delivery_days = Column(Integer, nullable=False)
    revisions = Column(Integer, default=2)
    active = Column(Boolean, default=True)
    helper_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    helper = relationship("User", back_populates="services")

class Bid(Base):
    __tablename__ = "bids"

    id = Column(String, primary_key=True, default=generate_uuid)
    amount = Column(Float, nullable=False)
    message = Column(Text, nullable=False)
    delivery_days = Column(Integer, nullable=False)
    status = Column(String(20), default=BidStatus.pending)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=False)
    helper_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="bids")
    helper = relationship("User", back_populates="bids")

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=generate_uuid)
    status = Column(String(20), default=OrderStatus.active)
    amount = Column(Float, nullable=False)
    task_id = Column(String, ForeignKey("tasks.id"))
    service_id = Column(String, ForeignKey("services.id"))
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    helper_id = Column(String, ForeignKey("users.id"), nullable=False)
    delivery_deadline = Column(DateTime)
    delivered_at = Column(DateTime)
    completed_at = Column(DateTime)
    delivery_files = Column(Text)  # JSON
    revision_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    task = relationship("Task", back_populates="order")
    student = relationship("User", foreign_keys=[student_id])
    helper = relationship("User", foreign_keys=[helper_id])
    review = relationship("Review", back_populates="order", uselist=False)
    payment = relationship("Payment", back_populates="order", uselist=False)

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=generate_uuid)
    amount = Column(Float, nullable=False)
    status = Column(String(20), default=PaymentStatus.pending)
    stripe_payment_intent_id = Column(String(255))
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    payer_id = Column(String, ForeignKey("users.id"), nullable=False)
    payee_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="payment")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=generate_uuid)
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    reviewer_id = Column(String, ForeignKey("users.id"), nullable=False)
    reviewee_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="review")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    user1_id = Column(String, ForeignKey("users.id"), nullable=False)
    user2_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    content = Column(Text, nullable=False)
    type = Column(String(20), default="text")
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

class FeedPost(Base):
    __tablename__ = "feed_posts"

    id = Column(String, primary_key=True, default=generate_uuid)
    content = Column(Text, nullable=False)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class Follow(Base):
    __tablename__ = "follows"

    id = Column(String, primary_key=True, default=generate_uuid)
    follower_id = Column(String, ForeignKey("users.id"), nullable=False)
    following_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# ═══════════════════════════════════════
# DB INIT
# ═══════════════════════════════════════
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
