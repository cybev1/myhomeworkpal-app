from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routers import auth, tasks, bids, orders, payments, chat, services, feed, users
from app.models.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="MyHomeworkPal API",
    description="Academic Marketplace API — Homework help, tutoring, and academic services",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(bids.router, prefix="/bids", tags=["Bids"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(services.router, prefix="/services", tags=["Services"])
app.include_router(feed.router, prefix="/feed", tags=["Community Feed"])
app.include_router(users.router, prefix="/users", tags=["Users"])

@app.get("/")
async def root():
    return {
        "app": "MyHomeworkPal API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
