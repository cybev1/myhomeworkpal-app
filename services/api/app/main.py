# ═══════════════════════════════════════════════════════════════
# MyHomeworkPal API v2.1.1 — Dual-mount (works with any frontend)
# Routes available at BOTH /auth/... AND /api/v1/auth/...
# ═══════════════════════════════════════════════════════════════
import os
import traceback
from fastapi import FastAPI, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.routers import auth, tasks, bids, orders, payments, chat, services, feed, users
from app.models.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="MyHomeworkPal API",
    description="Academic Marketplace API",
    version="2.1.1",
    lifespan=lifespan,
)

# CORS
cors_origins_str = os.getenv("CORS_ORIGINS", "")
if cors_origins_str:
    origins = [o.strip() for o in cors_origins_str.split(",") if o.strip()]
else:
    origins = [
        "https://myhomeworkpal.com",
        "https://www.myhomeworkpal.com",
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:3000",
        "http://localhost:8000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"ERROR: {type(exc).__name__}: {str(exc)}")
    traceback.print_exc()
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in origins:
        headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {type(exc).__name__}"},
        headers=headers,
    )

# ═══ Helper to mount all routers ═══
def mount_all(router_or_app):
    router_or_app.include_router(auth.router, prefix="/auth", tags=["Auth"])
    router_or_app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
    router_or_app.include_router(bids.router, prefix="/bids", tags=["Bids"])
    router_or_app.include_router(orders.router, prefix="/orders", tags=["Orders"])
    router_or_app.include_router(payments.router, prefix="/payments", tags=["Payments"])
    router_or_app.include_router(chat.router, prefix="/chat", tags=["Chat"])
    router_or_app.include_router(services.router, prefix="/services", tags=["Services"])
    router_or_app.include_router(feed.router, prefix="/feed", tags=["Feed"])
    router_or_app.include_router(users.router, prefix="/users", tags=["Users"])

# Mount at root level: /auth/login, /tasks, etc.
mount_all(app)

# Also mount under /api/v1: /api/v1/auth/login, /api/v1/tasks, etc.
api_v1 = APIRouter(prefix="/api/v1")
mount_all(api_v1)
app.include_router(api_v1)

@app.get("/")
async def root():
    return {"app": "MyHomeworkPal API", "version": "2.1.1", "status": "running", "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
