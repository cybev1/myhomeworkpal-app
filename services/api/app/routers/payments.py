# ═══════════════════════════════════════════════════════════════
# MyHomeworkPal Payments — Stripe + Flutterwave wallet funding
# Students fund wallet → escrow on order → release to helper
# ═══════════════════════════════════════════════════════════════
import os
import hmac
import hashlib
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Optional
from app.models.database import get_db, User, Payment, Order
from app.services.auth_service import get_current_user

router = APIRouter()

STRIPE_SECRET = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
FLUTTERWAVE_SECRET = os.getenv("FLUTTERWAVE_SECRET_KEY", "")
FLUTTERWAVE_HASH = os.getenv("FLUTTERWAVE_WEBHOOK_HASH", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://myhomeworkpal.com")

# ═══ Wallet balance ═══
@router.get("/wallet")
async def get_wallet(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    import os
    CLEARANCE_DAYS = int(os.getenv("CLEARANCE_DAYS", "14"))
    PLATFORM_FEE = float(os.getenv("PLATFORM_FEE_PERCENT", "20"))

    # Calculate pending clearance for helpers
    pending_clearance = 0
    available_balance = user.balance or 0
    if user.role == "helper":
        from app.models.database import Order
        recent = await db.execute(
            select(Order).where(
                Order.helper_id == user.id,
                Order.status == "completed",
                Order.completed_at > datetime.utcnow() - timedelta(days=CLEARANCE_DAYS),
            )
        )
        pending_clearance = sum(o.amount * (100 - PLATFORM_FEE) / 100 for o in recent.scalars().all())
        available_balance = max(0, (user.balance or 0) - pending_clearance)

    return {
        "balance": user.balance or 0,
        "availableForWithdrawal": round(available_balance, 2),
        "pendingClearance": round(pending_clearance, 2),
        "escrowBalance": user.escrow_balance or 0,
        "clearanceDays": CLEARANCE_DAYS,
        "platformFeePercent": PLATFORM_FEE,
        "currency": "USD",
    }

# ═══ Fund wallet — creates payment session ═══
class FundWalletRequest(BaseModel):
    amount: float
    method: str = "stripe"  # "stripe" or "flutterwave"
    currency: str = "USD"

@router.post("/fund-wallet")
async def fund_wallet(req: FundWalletRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if req.amount < 5:
        raise HTTPException(status_code=400, detail="Minimum deposit is $5")
    if req.amount > 10000:
        raise HTTPException(status_code=400, detail="Maximum deposit is $10,000")

    if req.method == "stripe" and STRIPE_SECRET:
        return await _create_stripe_session(req, user, db)
    elif req.method == "flutterwave" and FLUTTERWAVE_SECRET:
        return await _create_flutterwave_session(req, user, db)
    else:
        # Demo mode — credit wallet directly for testing
        user.balance = (user.balance or 0) + req.amount
        await db.flush()
        return {
            "status": "success",
            "message": f"${req.amount:.2f} added to your wallet (demo mode)",
            "balance": user.balance,
            "demo": True,
        }

# ═══ Stripe checkout session ═══
async def _create_stripe_session(req, user, db):
    import stripe
    stripe.api_key = STRIPE_SECRET

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": req.currency.lower(),
                "product_data": {
                    "name": "MyHomeworkPal Wallet Deposit",
                    "description": f"Add ${req.amount:.2f} to your wallet",
                },
                "unit_amount": int(req.amount * 100),
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=f"{FRONTEND_URL}/payment?status=success&amount={req.amount}",
        cancel_url=f"{FRONTEND_URL}/payment?status=cancelled",
        client_reference_id=user.id,
        customer_email=user.email,
        metadata={"user_id": user.id, "amount": str(req.amount), "type": "wallet_deposit"},
    )

    return {
        "status": "pending",
        "sessionId": session.id,
        "url": session.url,
        "method": "stripe",
    }

# ═══ Flutterwave payment link ═══
async def _create_flutterwave_session(req, user, db):
    import httpx
    import uuid

    tx_ref = f"mhp_{user.id[:8]}_{uuid.uuid4().hex[:8]}"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.flutterwave.com/v3/payments",
            headers={
                "Authorization": f"Bearer {FLUTTERWAVE_SECRET}",
                "Content-Type": "application/json",
            },
            json={
                "tx_ref": tx_ref,
                "amount": req.amount,
                "currency": req.currency,
                "redirect_url": f"{FRONTEND_URL}/payment?status=success&amount={req.amount}&ref={tx_ref}",
                "customer": {
                    "email": user.email,
                    "name": user.name,
                },
                "customizations": {
                    "title": "MyHomeworkPal",
                    "description": f"Add ${req.amount:.2f} to your wallet",
                    "logo": f"{FRONTEND_URL}/favicon.png",
                },
                "meta": {"user_id": user.id},
            },
        )
        data = resp.json()

    if data.get("status") == "success":
        return {
            "status": "pending",
            "url": data["data"]["link"],
            "txRef": tx_ref,
            "method": "flutterwave",
        }
    else:
        raise HTTPException(status_code=400, detail=data.get("message", "Payment creation failed"))

# ═══ Stripe webhook ═══
@router.post("/webhook/stripe")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    import stripe
    stripe.api_key = STRIPE_SECRET

    body = await request.body()
    sig = request.headers.get("stripe-signature", "")

    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(body, sig, STRIPE_WEBHOOK_SECRET)
        else:
            event = json.loads(body)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event.get("type") == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("client_reference_id") or session.get("metadata", {}).get("user_id")
        amount = float(session.get("metadata", {}).get("amount", 0)) or (session.get("amount_total", 0) / 100)

        if user_id and amount > 0:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if user:
                user.balance = (user.balance or 0) + amount
                await db.flush()

    return {"received": True}

# ═══ Flutterwave webhook ═══
@router.post("/webhook/flutterwave")
async def flutterwave_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.json()

    # Verify webhook hash
    sig = request.headers.get("verif-hash", "")
    if FLUTTERWAVE_HASH and sig != FLUTTERWAVE_HASH:
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    if body.get("event") == "charge.completed" and body.get("data", {}).get("status") == "successful":
        data = body["data"]
        user_id = data.get("meta", {}).get("user_id")
        amount = data.get("amount", 0)

        if user_id and amount > 0:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if user:
                user.balance = (user.balance or 0) + amount
                await db.flush()

    return {"received": True}

# ═══ Verify payment (for redirect callback) ═══
@router.post("/verify")
async def verify_payment(ref: str, method: str = "flutterwave", user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if method == "flutterwave" and FLUTTERWAVE_SECRET:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref={ref}",
                headers={"Authorization": f"Bearer {FLUTTERWAVE_SECRET}"},
            )
            data = resp.json()
        if data.get("status") == "success" and data.get("data", {}).get("status") == "successful":
            amount = data["data"]["amount"]
            user.balance = (user.balance or 0) + amount
            await db.flush()
            return {"status": "success", "amount": amount, "balance": user.balance}
        raise HTTPException(status_code=400, detail="Payment not verified")

    return {"status": "pending", "message": "Verification not available for this method"}

# ═══ Transaction history ═══
@router.get("/transactions")
async def get_transactions(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Payment).where(
            (Payment.payer_id == user.id) | (Payment.payee_id == user.id)
        ).order_by(desc(Payment.created_at))
    )
    txns = result.scalars().all()
    return {"transactions": [{
        "id": t.id, "amount": t.amount if t.payee_id == user.id else -t.amount,
        "status": t.status, "orderId": t.order_id,
        "description": f"{'Received' if t.payee_id == user.id else 'Payment'} — Order #{t.order_id[:8] if t.order_id else 'N/A'}",
        "createdAt": t.created_at.isoformat() if t.created_at else None,
    } for t in txns]}

# ═══ Withdraw ═══
class WithdrawRequest(BaseModel):
    amount: float
    method: str = "bank_transfer"

@router.post("/withdraw")
async def withdraw(req: WithdrawRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    import os
    CLEARANCE_DAYS = int(os.getenv("CLEARANCE_DAYS", "14"))

    if req.amount < 10:
        raise HTTPException(status_code=400, detail="Minimum withdrawal is $10")
    if (user.balance or 0) < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Check clearance — funds from recently completed orders may not be withdrawable yet
    from app.models.database import Order
    recent_orders = await db.execute(
        select(Order).where(
            Order.helper_id == user.id,
            Order.status == "completed",
            Order.completed_at > datetime.utcnow() - timedelta(days=CLEARANCE_DAYS),
        )
    )
    pending_clearance = sum(o.amount for o in recent_orders.scalars().all())
    available = max(0, (user.balance or 0) - pending_clearance)

    if available < req.amount:
        raise HTTPException(
            status_code=400,
            detail=f"Only ${available:.2f} available for withdrawal. ${pending_clearance:.2f} is in {CLEARANCE_DAYS}-day clearance period."
        )

    user.balance = (user.balance or 0) - req.amount
    await db.flush()
    return {"message": f"Withdrawal of ${req.amount:.2f} initiated", "balance": user.balance, "clearancePending": pending_clearance}
