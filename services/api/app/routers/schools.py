from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_, func
from pydantic import BaseModel
from typing import Optional
from app.models.database import get_db, School, User
from app.services.auth_service import get_current_user

router = APIRouter()

class CreateSchoolRequest(BaseModel):
    name: str
    short_name: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    country: str = "US"
    type: str = "university"
    telegram_channel: Optional[str] = None
    telegram_group: Optional[str] = None
    website: Optional[str] = None

@router.get("")
async def list_schools(
    q: str = "", state: str = "", type: str = "",
    page: int = 1, limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    query = select(School)
    if q:
        query = query.where(or_(School.name.ilike(f"%{q}%"), School.short_name.ilike(f"%{q}%")))
    if state:
        query = query.where(School.state == state)
    if type:
        query = query.where(School.type == type)
    query = query.order_by(School.name).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    schools = result.scalars().all()
    total = (await db.execute(select(func.count(School.id)))).scalar() or 0
    return {
        "schools": [{
            "id": s.id, "name": s.name, "shortName": s.short_name,
            "state": s.state, "city": s.city, "country": s.country,
            "type": s.type, "telegramChannel": s.telegram_channel,
            "telegramGroup": s.telegram_group, "studentCount": s.student_count,
            "website": s.website, "verified": s.verified,
        } for s in schools],
        "total": total, "page": page,
    }

@router.get("/states")
async def list_states(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(School.state).distinct().where(School.state.isnot(None)).order_by(School.state))
    return {"states": [r[0] for r in result.fetchall()]}

@router.get("/{school_id}")
async def get_school(school_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(School).where(School.id == school_id))
    s = result.scalar_one_or_none()
    if not s: raise HTTPException(status_code=404, detail="School not found")
    return {
        "id": s.id, "name": s.name, "shortName": s.short_name,
        "state": s.state, "city": s.city, "country": s.country,
        "type": s.type, "telegramChannel": s.telegram_channel,
        "telegramGroup": s.telegram_group, "studentCount": s.student_count,
        "website": s.website, "verified": s.verified,
    }

# Admin: add/edit schools
@router.post("")
async def create_school(req: CreateSchoolRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Admin only")
    school = School(**req.model_dump())
    db.add(school)
    await db.flush()
    await db.refresh(school)
    return {"id": school.id, "name": school.name}

@router.patch("/{school_id}")
async def update_school(school_id: str, req: CreateSchoolRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403)
    result = await db.execute(select(School).where(School.id == school_id))
    school = result.scalar_one_or_none()
    if not school: raise HTTPException(status_code=404)
    for k, v in req.model_dump(exclude_none=True).items():
        setattr(school, k, v)
    await db.flush()
    return {"message": "School updated"}

@router.delete("/{school_id}")
async def delete_school(school_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403)
    result = await db.execute(select(School).where(School.id == school_id))
    school = result.scalar_one_or_none()
    if not school: raise HTTPException(status_code=404)
    await db.delete(school)
    return {"message": "School deleted"}

# Seed US schools (run once via admin)
@router.post("/seed")
async def seed_schools(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403)

    existing = (await db.execute(select(func.count(School.id)))).scalar() or 0
    if existing > 10:
        return {"message": f"Already seeded ({existing} schools)"}

    schools_data = [
        ("Massachusetts Institute of Technology", "MIT", "MA", "Cambridge", "university"),
        ("Stanford University", "Stanford", "CA", "Stanford", "university"),
        ("Harvard University", "Harvard", "MA", "Cambridge", "university"),
        ("University of California, Berkeley", "UC Berkeley", "CA", "Berkeley", "university"),
        ("University of California, Los Angeles", "UCLA", "CA", "Los Angeles", "university"),
        ("University of Michigan", "UMich", "MI", "Ann Arbor", "university"),
        ("University of Texas at Austin", "UT Austin", "TX", "Austin", "university"),
        ("Georgia Institute of Technology", "Georgia Tech", "GA", "Atlanta", "university"),
        ("University of Illinois Urbana-Champaign", "UIUC", "IL", "Champaign", "university"),
        ("University of Washington", "UW", "WA", "Seattle", "university"),
        ("Columbia University", "Columbia", "NY", "New York", "university"),
        ("University of Pennsylvania", "UPenn", "PA", "Philadelphia", "university"),
        ("Yale University", "Yale", "CT", "New Haven", "university"),
        ("Princeton University", "Princeton", "NJ", "Princeton", "university"),
        ("Carnegie Mellon University", "CMU", "PA", "Pittsburgh", "university"),
        ("New York University", "NYU", "NY", "New York", "university"),
        ("University of Southern California", "USC", "CA", "Los Angeles", "university"),
        ("Duke University", "Duke", "NC", "Durham", "university"),
        ("Northwestern University", "Northwestern", "IL", "Evanston", "university"),
        ("University of Florida", "UF", "FL", "Gainesville", "university"),
        ("Ohio State University", "OSU", "OH", "Columbus", "university"),
        ("Penn State University", "Penn State", "PA", "State College", "university"),
        ("University of Wisconsin-Madison", "UW-Madison", "WI", "Madison", "university"),
        ("Arizona State University", "ASU", "AZ", "Tempe", "university"),
        ("University of North Carolina", "UNC", "NC", "Chapel Hill", "university"),
        ("Purdue University", "Purdue", "IN", "West Lafayette", "university"),
        ("University of Minnesota", "UMN", "MN", "Minneapolis", "university"),
        ("Virginia Tech", "VT", "VA", "Blacksburg", "university"),
        ("University of Maryland", "UMD", "MD", "College Park", "university"),
        ("Boston University", "BU", "MA", "Boston", "university"),
        ("Texas A&M University", "TAMU", "TX", "College Station", "university"),
        ("University of Colorado Boulder", "CU Boulder", "CO", "Boulder", "university"),
        ("Rutgers University", "Rutgers", "NJ", "New Brunswick", "university"),
        ("University of Pittsburgh", "Pitt", "PA", "Pittsburgh", "university"),
        ("Indiana University", "IU", "IN", "Bloomington", "university"),
        ("University of Arizona", "UArizona", "AZ", "Tucson", "university"),
        ("Michigan State University", "MSU", "MI", "East Lansing", "university"),
        ("University of Iowa", "UIowa", "IA", "Iowa City", "university"),
        ("University of Oregon", "UO", "OR", "Eugene", "university"),
        ("Florida State University", "FSU", "FL", "Tallahassee", "university"),
        ("University of Georgia", "UGA", "GA", "Athens", "university"),
        ("University of Virginia", "UVA", "VA", "Charlottesville", "university"),
        ("Brown University", "Brown", "RI", "Providence", "university"),
        ("Cornell University", "Cornell", "NY", "Ithaca", "university"),
        ("Rice University", "Rice", "TX", "Houston", "university"),
        ("Vanderbilt University", "Vandy", "TN", "Nashville", "university"),
        ("Georgetown University", "Georgetown", "DC", "Washington", "university"),
        ("Emory University", "Emory", "GA", "Atlanta", "university"),
        ("University of Miami", "UMiami", "FL", "Coral Gables", "university"),
        ("Northeastern University", "NEU", "MA", "Boston", "university"),
    ]

    count = 0
    for name, short, state, city, stype in schools_data:
        school = School(name=name, short_name=short, state=state, city=city, type=stype, country="US")
        db.add(school)
        count += 1

    await db.flush()
    return {"message": f"Seeded {count} US schools"}
