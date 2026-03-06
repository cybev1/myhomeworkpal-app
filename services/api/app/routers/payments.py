from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from app.models.database import get_db, User, Payment, Order
from app.services.auth_service import get_current_user

router = APIRouter()

class CreatePaymentIntentRequest(BaseModel):
    amount: float
    orderId: str

class WithdrawRequest(BaseModel):
    amount: float
    method: str = "bank_transfer"

@router.get("/wallet")
async def get_wallet(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return {
        "balance": user.balance or 0,
        "escrowBalance": user.escrow_balance or 0,
        "currency": "USD",
    }

@router.post("/create-intent")
async def create_payment_intent(req: CreatePaymentIntentRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # In production, create Stripe PaymentIntent here
    # For now, simulate escrow hold
    order_result = await db.execute(select(Order).where(Order.id == req.orderId))
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    payment = Payment(
        amount=req.amount, status="held",
        order_id=req.orderId, payer_id=user.id, payee_id=order.helper_id,
        stripe_payment_intent_id=f"pi_simulated_{req.orderId}",
    )
    db.add(payment)
    user.escrow_balance = (user.escrow_balance or 0) + req.amount
    await db.flush()
    return {"clientSecret": "simulated_secret", "paymentId": payment.id, "status": "held"}

@router.get("/transactions")
async def get_transactions(page: int = 1, limit: int = 20, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import or_
    result = await db.execute(
        select(Payment).where(
            or_(Payment.payer_id == user.id, Payment.payee_id == user.id)
        ).order_by(desc(Payment.created_at)).offset((page - 1) * limit).limit(limit)
    )
    payments = result.scalars().all()
    return [{
        "id": p.id,
        "amount": p.amount if p.payee_id == user.id else -p.amount,
        "status": p.status,
        "orderId": p.order_id,
        "type": "earning" if p.payee_id == user.id else "payment",
        "createdAt": p.created_at.isoformat(),
    } for p in payments]

@router.post("/withdraw")
async def withdraw(req: WithdrawRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if (user.balance or 0) < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    if req.amount < 10:
        raise HTTPException(status_code=400, detail="Minimum withdrawal is $10")
    user.balance = (user.balance or 0) - req.amount
    await db.flush()
    return {"message": f"Withdrawal of ${req.amount} initiated via {req.method}", "newBalance": user.balance}
