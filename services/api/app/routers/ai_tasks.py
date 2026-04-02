# ═══════════════════════════════════════════════════════════════
# MyHomeworkPal AI Task Completion
#
# Admin/Superadmin can use AI to complete tasks when helpers
# aren't available. Output is humanized to look natural.
#
# Chain: DeepSeek → OpenAI → Claude (fallback order)
# ═══════════════════════════════════════════════════════════════
import os
import re
import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.models.database import get_db, User, Task, Order
from app.services.auth_service import get_current_user

router = APIRouter()

DEEPSEEK_KEY = os.getenv("DEEPSEEK_API_KEY", "")
OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")
CLAUDE_KEY = os.getenv("ANTHROPIC_API_KEY", "")

class AICompleteRequest(BaseModel):
    task_id: str
    instructions: Optional[str] = None  # extra admin instructions
    style: str = "student"  # student, professional, casual
    humanize_level: int = 3  # 1-5 (5 = most human)

class AIGenerateRequest(BaseModel):
    prompt: str
    style: str = "student"
    humanize_level: int = 3

def build_system_prompt(style: str, humanize_level: int) -> str:
    base = """You are completing a homework/academic task for a student. Your response must look like it was written by a real human student, NOT by AI.

CRITICAL RULES FOR HUMANIZATION:
1. NEVER use these AI giveaway phrases: "Certainly!", "I'd be happy to", "Let me", "Here's", "In conclusion", "Furthermore", "Moreover", "It's worth noting", "It's important to note", "Overall", "In summary", "Delve", "Tapestry", "Multifaceted", "Landscape", "Comprehensive", "Nuanced"
2. Vary sentence length naturally — mix short punchy sentences with longer ones
3. Use contractions (don't, won't, it's, they're)
4. Start some sentences with "So", "And", "But", "Like", "Basically"
5. Include occasional filler words students use: "pretty much", "kind of", "I think", "from what I understand"
6. Make minor formatting inconsistencies (not everything perfectly structured)
7. Show your work/thinking process naturally, not in a polished AI way
8. Use first person where appropriate ("I found that...", "When I looked at...")
9. Include 1-2 very minor natural errors that a student might make (a repeated word, slightly awkward phrasing) but keep the content accurate
10. Don't over-explain obvious things
11. Reference specific textbook concepts or lecture material when relevant
12. Format like a real student submission — not a Wikipedia article"""

    if style == "professional":
        base += "\n\nWrite at a professional/graduate level but still human. More polished but not robotic."
    elif style == "casual":
        base += "\n\nWrite very casually, like a student rushing to submit. Short paragraphs, informal tone."
    else:
        base += "\n\nWrite like a typical undergraduate student. Good effort but not perfect."

    if humanize_level >= 4:
        base += "\n\nExtra humanization: Add a natural opening like jumping right into the topic. Maybe include a brief aside or personal observation. Make it feel lived-in."
    if humanize_level >= 5:
        base += "\n\nMaximum humanization: Include subtle signs of genuine engagement — a question the student might ask themselves, a connection to real life, slight uncertainty on edge cases. This should be INDISTINGUISHABLE from a real student's work."

    return base

def humanize_output(text: str, level: int) -> str:
    """Post-process AI output to remove remaining AI patterns"""
    # Remove common AI openers
    ai_openers = [
        r"^(Certainly|Sure|Of course|Absolutely|Great question|Here's|I'd be happy to)[!.,]\s*",
        r"^(Let me|Allow me|I'll)\s+",
    ]
    for pattern in ai_openers:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE | re.MULTILINE)

    # Remove AI closers
    ai_closers = [
        r"\n+(In conclusion|To summarize|Overall|In summary|To sum up)[,.].*$",
        r"\n+I hope this helps[!.].*$",
        r"\n+Let me know if you (need|have|want).*$",
        r"\n+Feel free to.*$",
    ]
    for pattern in ai_closers:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE | re.MULTILINE)

    # Replace stiff words with natural ones
    replacements = {
        "Furthermore": "Also",
        "Moreover": "Plus",
        "However": "But",
        "Nevertheless": "Still",
        "Consequently": "So",
        "Therefore": "So",
        "Subsequently": "Then",
        "Additionally": "Also",
        "Utilize": "use",
        "Demonstrate": "show",
        "Implement": "do",
        "Facilitate": "help with",
        "Numerous": "a lot of",
        "Commence": "start",
        "Terminate": "end",
        "Regarding": "About",
        "In terms of": "When it comes to",
        "It is important to note that": "Worth mentioning,",
        "It should be noted that": "Also,",
        "In order to": "To",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
        text = text.replace(old.lower(), new.lower())

    if level >= 3:
        # Add occasional contractions
        text = text.replace("do not", "don't").replace("does not", "doesn't")
        text = text.replace("cannot", "can't").replace("will not", "won't")
        text = text.replace("is not", "isn't").replace("are not", "aren't")
        text = text.replace("would not", "wouldn't").replace("should not", "shouldn't")
        text = text.replace("it is", "it's").replace("It is", "It's")
        text = text.replace("they are", "they're").replace("we are", "we're")

    return text.strip()

async def call_deepseek(system: str, prompt: str) -> str:
    import httpx
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.deepseek.com/chat/completions",
            headers={"Authorization": f"Bearer {DEEPSEEK_KEY}", "Content-Type": "application/json"},
            json={"model": "deepseek-chat", "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ], "max_tokens": 4000, "temperature": 0.8},
        )
        data = resp.json()
        return data["choices"][0]["message"]["content"]

async def call_openai(system: str, prompt: str) -> str:
    import httpx
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_KEY}", "Content-Type": "application/json"},
            json={"model": "gpt-4o-mini", "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ], "max_tokens": 4000, "temperature": 0.8},
        )
        data = resp.json()
        return data["choices"][0]["message"]["content"]

async def call_claude(system: str, prompt: str) -> str:
    import httpx
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": CLAUDE_KEY,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={"model": "claude-sonnet-4-20250514", "max_tokens": 4000,
                  "system": system,
                  "messages": [{"role": "user", "content": prompt}]},
        )
        data = resp.json()
        return data["content"][0]["text"]

async def generate_with_fallback(system: str, prompt: str) -> tuple:
    """Try DeepSeek → OpenAI → Claude, return (text, provider)"""
    errors = []

    if DEEPSEEK_KEY:
        try:
            result = await call_deepseek(system, prompt)
            return result, "deepseek"
        except Exception as e:
            errors.append(f"DeepSeek: {str(e)[:100]}")

    if OPENAI_KEY:
        try:
            result = await call_openai(system, prompt)
            return result, "openai"
        except Exception as e:
            errors.append(f"OpenAI: {str(e)[:100]}")

    if CLAUDE_KEY:
        try:
            result = await call_claude(system, prompt)
            return result, "claude"
        except Exception as e:
            errors.append(f"Claude: {str(e)[:100]}")

    raise HTTPException(status_code=500, detail=f"All AI providers failed: {'; '.join(errors)}")

# ═══ Complete a task ═══
@router.post("/complete-task")
async def ai_complete_task(req: AICompleteRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Admin only")

    # Get task
    task_result = await db.execute(select(Task).where(Task.id == req.task_id))
    task = task_result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    system = build_system_prompt(req.style, req.humanize_level)
    prompt = f"""Complete this homework/academic task:

TITLE: {task.title}
CATEGORY: {task.category}
DESCRIPTION: {task.description or task.title}
{"ADDITIONAL INSTRUCTIONS: " + req.instructions if req.instructions else ""}

Provide a complete, thorough answer. Remember: write like a real student, not AI."""

    raw_output, provider = await generate_with_fallback(system, prompt)
    humanized = humanize_output(raw_output, req.humanize_level)

    return {
        "taskId": task.id, "taskTitle": task.title,
        "output": humanized,
        "provider": provider,
        "style": req.style,
        "humanizeLevel": req.humanize_level,
        "wordCount": len(humanized.split()),
        "generatedAt": datetime.utcnow().isoformat(),
    }

# ═══ Free-form generation ═══
@router.post("/generate")
async def ai_generate(req: AIGenerateRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Admin only")

    system = build_system_prompt(req.style, req.humanize_level)
    raw_output, provider = await generate_with_fallback(system, req.prompt)
    humanized = humanize_output(raw_output, req.humanize_level)

    return {
        "output": humanized,
        "provider": provider,
        "wordCount": len(humanized.split()),
    }

# ═══ Check AI status ═══
@router.get("/status")
async def ai_status(user: User = Depends(get_current_user)):
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403)
    return {
        "deepseek": bool(DEEPSEEK_KEY),
        "openai": bool(OPENAI_KEY),
        "claude": bool(CLAUDE_KEY),
        "available": bool(DEEPSEEK_KEY or OPENAI_KEY or CLAUDE_KEY),
    }
