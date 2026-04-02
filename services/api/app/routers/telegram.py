# ═══════════════════════════════════════════════════════════════
# MyHomeworkPal Telegram Bot
#
# Students can:
#   /start     → Welcome + register link
#   /post      → Post a task via Telegram
#   /orders    → Check active orders
#   /balance   → Check wallet balance
#   /help      → Get help
#   /link      → Link Telegram to MHP account
#
# Bot also receives messages in groups and can:
#   - Auto-reply to homework-related queries
#   - Promote MHP when relevant
# ═══════════════════════════════════════════════════════════════
import os
import json
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.database import get_db, User, Task, Order, TelegramUser
from fastapi import Depends

router = APIRouter()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://myhomeworkpal.com")
BOT_USERNAME = os.getenv("TELEGRAM_BOT_USERNAME", "MyHomeworkPalBot")

async def send_telegram(chat_id: str, text: str, parse_mode: str = "HTML", reply_markup: dict = None):
    if not BOT_TOKEN:
        return
    import httpx
    payload = {"chat_id": chat_id, "text": text, "parse_mode": parse_mode}
    if reply_markup:
        payload["reply_markup"] = json.dumps(reply_markup)
    async with httpx.AsyncClient() as client:
        await client.post(f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage", json=payload)

# ═══ Webhook handler ═══
@router.post("/webhook")
async def telegram_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    if not BOT_TOKEN:
        return {"ok": True, "message": "Bot not configured"}

    body = await request.json()
    message = body.get("message", {})
    callback = body.get("callback_query", {})

    if message:
        await handle_message(message, db)
    elif callback:
        await handle_callback(callback, db)

    return {"ok": True}

async def handle_message(msg: dict, db: AsyncSession):
    chat_id = str(msg.get("chat", {}).get("id", ""))
    text = msg.get("text", "").strip()
    tg_user = msg.get("from", {})
    tg_id = str(tg_user.get("id", ""))
    tg_username = tg_user.get("username", "")
    first_name = tg_user.get("first_name", "Student")

    # Upsert telegram user
    result = await db.execute(select(TelegramUser).where(TelegramUser.telegram_id == tg_id))
    tg_record = result.scalar_one_or_none()
    if not tg_record:
        tg_record = TelegramUser(telegram_id=tg_id, telegram_username=tg_username, chat_id=chat_id)
        db.add(tg_record)
        await db.flush()

    # Command handling
    cmd = text.split()[0].lower() if text else ""
    if cmd.startswith("/"):
        cmd = cmd.split("@")[0]  # Remove @botname

    if cmd == "/start":
        await send_telegram(chat_id,
            f"👋 <b>Welcome to MyHomeworkPal, {first_name}!</b>\n\n"
            f"I can help you get homework done by connecting you with verified experts.\n\n"
            f"📝 <b>/post</b> — Post a task\n"
            f"📋 <b>/orders</b> — Check your orders\n"
            f"💰 <b>/balance</b> — Check wallet\n"
            f"🔗 <b>/link</b> — Connect your account\n"
            f"❓ <b>/help</b> — Get help\n\n"
            f"Or just describe your homework and I'll help you post it!",
            reply_markup={"inline_keyboard": [
                [{"text": "🌐 Open MyHomeworkPal", "url": FRONTEND_URL}],
                [{"text": "📝 Post a Task", "callback_data": "post_task"},
                 {"text": "🔗 Link Account", "callback_data": "link_account"}],
            ]}
        )

    elif cmd == "/post":
        await send_telegram(chat_id,
            "📝 <b>Post a Task</b>\n\n"
            "Send me your task in this format:\n\n"
            "<i>Title: Solve 10 Algebra Problems\n"
            "Budget: 25\n"
            "Category: math\n"
            "Description: Need step-by-step solutions for 10 algebra questions from Chapter 5</i>\n\n"
            "Or just describe what you need and I'll format it for you!",
        )

    elif cmd == "/orders":
        if tg_record.user_id:
            result = await db.execute(
                select(Order).where(
                    (Order.student_id == tg_record.user_id) | (Order.helper_id == tg_record.user_id)
                ).order_by(Order.created_at.desc()).limit(5)
            )
            orders = result.scalars().all()
            if orders:
                lines = ["📋 <b>Your Recent Orders:</b>\n"]
                for o in orders:
                    emoji = {"active": "🔵", "delivered": "📦", "completed": "✅", "revision": "🔄", "disputed": "⚠️"}.get(o.status, "⬜")
                    lines.append(f"{emoji} #{o.id[:8]} — ${o.amount} — {o.status}")
                lines.append(f"\n<a href='{FRONTEND_URL}/orders'>View all orders →</a>")
                await send_telegram(chat_id, "\n".join(lines))
            else:
                await send_telegram(chat_id, "No orders yet. Post a task to get started!\n\nUse /post or visit " + FRONTEND_URL)
        else:
            await send_telegram(chat_id, "🔗 Link your account first with /link to see your orders.")

    elif cmd == "/balance":
        if tg_record.user_id:
            user_result = await db.execute(select(User).where(User.id == tg_record.user_id))
            user = user_result.scalar_one_or_none()
            if user:
                await send_telegram(chat_id,
                    f"💰 <b>Wallet Balance</b>\n\n"
                    f"Available: <b>${(user.balance or 0):.2f}</b>\n"
                    f"In Escrow: ${(user.escrow_balance or 0):.2f}\n\n"
                    f"<a href='{FRONTEND_URL}/add-funds'>Add Funds</a> | <a href='{FRONTEND_URL}/payment'>Withdraw</a>"
                )
        else:
            await send_telegram(chat_id, "🔗 Link your account first with /link")

    elif cmd == "/link":
        await send_telegram(chat_id,
            f"🔗 <b>Link Your Account</b>\n\n"
            f"Click below to connect your Telegram to MyHomeworkPal.\n"
            f"Your Telegram ID: <code>{tg_id}</code>",
            reply_markup={"inline_keyboard": [
                [{"text": "🔗 Link Account", "url": f"{FRONTEND_URL}/login?telegram_id={tg_id}"}],
            ]}
        )

    elif cmd == "/help":
        await send_telegram(chat_id,
            "❓ <b>MyHomeworkPal Help</b>\n\n"
            "📝 Post a task → experts bid → choose one → get it done\n"
            "💰 Funds held in escrow until you approve\n"
            "🔄 Free revisions included\n"
            "⏰ Auto-approval after 3 days if not reviewed\n"
            "⚠️ Open disputes if issues arise\n\n"
            f"Need more help? Visit {FRONTEND_URL}/help",
            reply_markup={"inline_keyboard": [
                [{"text": "📖 Full Help Center", "url": f"{FRONTEND_URL}/help"}],
                [{"text": "📧 Email Support", "url": "mailto:support@myhomeworkpal.com"}],
            ]}
        )

    elif text and not cmd.startswith("/"):
        # Free-text task creation: try to parse a task from natural language
        if tg_record.user_id:
            # Check if message looks like a task format
            if "title:" in text.lower() or "budget:" in text.lower():
                lines = text.split("\n")
                title = budget = category = description = ""
                for line in lines:
                    l = line.strip()
                    if l.lower().startswith("title:"):
                        title = l[6:].strip()
                    elif l.lower().startswith("budget:"):
                        budget = l[7:].strip().replace("$", "")
                    elif l.lower().startswith("category:"):
                        category = l[9:].strip()
                    elif l.lower().startswith("description:") or l.lower().startswith("desc:"):
                        description = l.split(":", 1)[1].strip()

                if title and budget:
                    task = Task(
                        title=title, description=description or title,
                        category=category or "other",
                        budget=float(budget), status="open",
                        student_id=tg_record.user_id,
                    )
                    db.add(task)
                    await db.flush()
                    await db.refresh(task)
                    await send_telegram(chat_id,
                        f"✅ <b>Task Posted!</b>\n\n"
                        f"📝 {title}\n💰 ${budget}\n📂 {category or 'other'}\n\n"
                        f"Experts will start bidding soon!",
                        reply_markup={"inline_keyboard": [
                            [{"text": "View Task", "url": f"{FRONTEND_URL}/task/{task.id}"}],
                        ]}
                    )
                    return

            # Not a formatted task — offer to help
            await send_telegram(chat_id,
                f"Got it! Want me to post this as a task?\n\n"
                f"<i>\"{text[:200]}\"</i>\n\n"
                f"Reply with a budget (e.g. $25) to post it, or use /post for the full form.",
            )
        else:
            await send_telegram(chat_id,
                f"👋 Welcome! To post tasks and hire experts, link your account first.\n\n"
                f"Use /link or sign up at {FRONTEND_URL}/register"
            )

async def handle_callback(callback: dict, db: AsyncSession):
    chat_id = str(callback.get("message", {}).get("chat", {}).get("id", ""))
    data = callback.get("data", "")

    if data == "post_task":
        await send_telegram(chat_id,
            "📝 Send me your task:\n\n"
            "Title: [your task title]\n"
            "Budget: [amount in $]\n"
            "Category: [math/english/science/cs/business/other]\n"
            "Description: [what you need done]"
        )
    elif data == "link_account":
        tg_id = str(callback.get("from", {}).get("id", ""))
        await send_telegram(chat_id,
            f"🔗 Click below to link your account:",
            reply_markup={"inline_keyboard": [
                [{"text": "Link Now", "url": f"{FRONTEND_URL}/login?telegram_id={tg_id}"}],
            ]}
        )

# ═══ Setup webhook (call once) ═══
@router.post("/setup-webhook")
async def setup_webhook():
    if not BOT_TOKEN:
        raise HTTPException(status_code=400, detail="TELEGRAM_BOT_TOKEN not set")
    import httpx
    webhook_url = f"https://api.myhomeworkpal.com/telegram/webhook"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://api.telegram.org/bot{BOT_TOKEN}/setWebhook",
            json={"url": webhook_url, "allowed_updates": ["message", "callback_query"]}
        )
        return resp.json()

# ═══ Bot info ═══
@router.get("/bot-info")
async def bot_info():
    return {
        "configured": bool(BOT_TOKEN),
        "username": BOT_USERNAME,
        "webhook": f"https://api.myhomeworkpal.com/telegram/webhook",
        "commands": ["/start", "/post", "/orders", "/balance", "/link", "/help"],
    }
